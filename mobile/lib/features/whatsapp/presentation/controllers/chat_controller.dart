import 'dart:async';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/errors/app_exception.dart';
import '../../data/repositories/whatsapp_repository.dart';
import '../../domain/models/whatsapp_conversation_model.dart';
import '../../domain/models/whatsapp_message_model.dart';
import 'inbox_controller.dart';

class ChatState {
  final bool isLoading;
  final bool isSending;
  final WhatsAppConversationModel? conversation;
  final List<WhatsAppMessageModel> messages;
  final bool is24hWindowActive;
  final String? errorMessage;
  final String? meta24hWarning;

  const ChatState({
    this.isLoading = false,
    this.isSending = false,
    this.conversation,
    this.messages = const [],
    this.is24hWindowActive = true,
    this.errorMessage,
    this.meta24hWarning,
  });

  ChatState copyWith({
    bool? isLoading,
    bool? isSending,
    WhatsAppConversationModel? conversation,
    List<WhatsAppMessageModel>? messages,
    bool? is24hWindowActive,
    String? errorMessage,
    String? meta24hWarning,
  }) {
    return ChatState(
      isLoading: isLoading ?? this.isLoading,
      isSending: isSending ?? this.isSending,
      conversation: conversation ?? this.conversation,
      messages: messages ?? this.messages,
      is24hWindowActive: is24hWindowActive ?? this.is24hWindowActive,
      errorMessage: errorMessage,
      meta24hWarning: meta24hWarning,
    );
  }
}

final chatControllerFamily =
    StateNotifierProvider.family<ChatController, ChatState, String>((ref, conversationId) {
  final repository = ref.watch(whatsAppRepositoryProvider);
  return ChatController(repository, conversationId, ref);
});

class ChatController extends StateNotifier<ChatState> {
  final WhatsAppRepository _repository;
  final String conversationId;
  final Ref _ref;
  Timer? _chatPollingTimer;

  ChatController(this._repository, this.conversationId, this._ref) : super(const ChatState()) {
    loadMessages();
    _startChatPolling();
  }

  void _startChatPolling() {
    _chatPollingTimer?.cancel();
    // Lightweight polling every 6 seconds while active chat is open
    _chatPollingTimer = Timer.periodic(const Duration(seconds: 6), (_) {
      loadMessagesSilent();
    });
  }

  @override
  void dispose() {
    _chatPollingTimer?.cancel();
    super.dispose();
  }

  Future<void> loadMessages() async {
    state = state.copyWith(isLoading: true, errorMessage: null, meta24hWarning: null);
    try {
      final result = await _repository.getMessages(conversationId);
      state = state.copyWith(
        isLoading: false,
        messages: result.messages,
        conversation: result.conversation,
        is24hWindowActive: result.is24hWindowActive,
      );

      // Update unread count locally in inbox
      _ref.read(inboxControllerProvider.notifier).markConversationLocallyRead(conversationId);
    } catch (e) {
      state = state.copyWith(isLoading: false, errorMessage: e.toString());
    }
  }

  Future<void> loadMessagesSilent() async {
    try {
      final result = await _repository.getMessages(conversationId);
      state = state.copyWith(
        messages: result.messages,
        conversation: result.conversation,
        is24hWindowActive: result.is24hWindowActive,
      );
    } catch (_) {}
  }

  Future<bool> sendMessage(String text) async {
    if (text.trim().isEmpty) return false;

    state = state.copyWith(isSending: true, errorMessage: null, meta24hWarning: null);

    // Optimistic message placeholder
    final optimisticMessage = WhatsAppMessageModel(
      id: 'temp_${DateTime.now().millisecondsSinceEpoch}',
      conversationId: conversationId,
      direction: 'OUTBOUND',
      senderType: 'AGENT',
      type: 'text',
      textBody: text.trim(),
      status: 'SENT',
      createdAt: DateTime.now(),
    );

    state = state.copyWith(
      messages: [...state.messages, optimisticMessage],
    );

    try {
      await _repository.sendMessage(
        conversationId: conversationId,
        text: text.trim(),
      );

      state = state.copyWith(isSending: false);
      // Reload to fetch authoritative server message ID and status
      await loadMessagesSilent();
      // Notify inbox
      _ref.read(inboxControllerProvider.notifier).refreshSilent();
      return true;
    } on Meta24HourWindowException catch (e) {
      // Revert optimistic message and show user-friendly guidance
      state = state.copyWith(
        isSending: false,
        messages: state.messages.where((m) => m.id != optimisticMessage.id).toList(),
        meta24hWarning: e.message,
      );
      return false;
    } catch (e) {
      state = state.copyWith(
        isSending: false,
        errorMessage: e.toString(),
      );
      return false;
    }
  }

  Future<void> updateAssignment(String userId) async {
    try {
      final updated = await _repository.updateConversation(
        id: conversationId,
        assignedUserId: userId,
      );
      state = state.copyWith(conversation: updated);
      _ref.read(inboxControllerProvider.notifier).refreshSilent();
    } catch (e) {
      state = state.copyWith(errorMessage: 'Failed to update assignment: $e');
    }
  }

  Future<void> updateStatus(String status) async {
    try {
      final updated = await _repository.updateConversation(
        id: conversationId,
        status: status,
      );
      state = state.copyWith(conversation: updated);
      _ref.read(inboxControllerProvider.notifier).refreshSilent();
    } catch (e) {
      state = state.copyWith(errorMessage: 'Failed to update status: $e');
    }
  }

  Future<bool> sendInternalNote(String text) async {
    if (text.trim().isEmpty) return false;
    try {
      final note = await _repository.sendInternalNote(
        conversationId: conversationId,
        text: text.trim(),
      );
      state = state.copyWith(messages: [...state.messages, note]);
      await loadMessagesSilent();
      return true;
    } catch (e) {
      state = state.copyWith(errorMessage: 'Failed to save internal note: $e');
      return false;
    }
  }

  void onTemplateSent() {
    loadMessages();
    _ref.read(inboxControllerProvider.notifier).refreshSilent();
  }
}
