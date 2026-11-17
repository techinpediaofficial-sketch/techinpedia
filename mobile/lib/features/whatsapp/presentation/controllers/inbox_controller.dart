import 'dart:async';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/network/api_client.dart';
import '../../../../core/services/notification_service.dart';
import '../../data/repositories/whatsapp_repository.dart';
import '../../domain/models/folder_metrics_model.dart';
import '../../domain/models/whatsapp_conversation_model.dart';

final whatsAppRepositoryProvider = Provider<WhatsAppRepository>((ref) {
  final client = ref.watch(apiClientProvider);
  return WhatsAppRepositoryImpl(client);
});

class InboxState {
  final bool isLoading;
  final bool isRefreshing;
  final List<WhatsAppConversationModel> conversations;
  final FolderMetricsModel metrics;
  final String currentFolder;
  final String searchQuery;
  final String? errorMessage;

  const InboxState({
    this.isLoading = false,
    this.isRefreshing = false,
    this.conversations = const [],
    this.metrics = const FolderMetricsModel(),
    this.currentFolder = 'ALL',
    this.searchQuery = '',
    this.errorMessage,
  });

  InboxState copyWith({
    bool? isLoading,
    bool? isRefreshing,
    List<WhatsAppConversationModel>? conversations,
    FolderMetricsModel? metrics,
    String? currentFolder,
    String? searchQuery,
    String? errorMessage,
  }) {
    return InboxState(
      isLoading: isLoading ?? this.isLoading,
      isRefreshing: isRefreshing ?? this.isRefreshing,
      conversations: conversations ?? this.conversations,
      metrics: metrics ?? this.metrics,
      currentFolder: currentFolder ?? this.currentFolder,
      searchQuery: searchQuery ?? this.searchQuery,
      errorMessage: errorMessage,
    );
  }
}

final inboxControllerProvider = StateNotifierProvider<InboxController, InboxState>((ref) {
  final repository = ref.watch(whatsAppRepositoryProvider);
  return InboxController(repository);
});

class InboxController extends StateNotifier<InboxState> {
  final WhatsAppRepository _repository;
  Timer? _pollingTimer;

  InboxController(this._repository) : super(const InboxState()) {
    loadConversations();
    _startPeriodicRefresh();
  }

  void _startPeriodicRefresh() {
    _pollingTimer?.cancel();
    // Refresh cadence: check every 8 seconds for new incoming messages
    _pollingTimer = Timer.periodic(const Duration(seconds: 8), (_) {
      refreshSilent();
    });
  }

  @override
  void dispose() {
    _pollingTimer?.cancel();
    super.dispose();
  }

  Future<void> loadConversations({bool showLoading = true}) async {
    if (showLoading) {
      state = state.copyWith(isLoading: true, errorMessage: null);
    }
    try {
      final result = await _repository.getConversations(
        folder: state.currentFolder,
        search: state.searchQuery,
      );
      state = state.copyWith(
        isLoading: false,
        isRefreshing: false,
        conversations: result.conversations,
        metrics: result.metrics,
        errorMessage: null,
      );
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        isRefreshing: false,
        errorMessage: e.toString(),
      );
    }
  }

  Future<void> refresh() async {
    state = state.copyWith(isRefreshing: true, errorMessage: null);
    await loadConversations(showLoading: false);
  }

  Future<void> refreshSilent() async {
    try {
      final result = await _repository.getConversations(
        folder: state.currentFolder,
        search: state.searchQuery,
      );

      // Check for incoming customer WhatsApp messages to trigger heads-up notification
      for (final newConv in result.conversations) {
        if (newConv.unreadCount > 0 && newConv.lastMessageSender == 'CONTACT') {
          final oldConv = state.conversations.where((c) => c.id == newConv.id).firstOrNull;
          final isNewUnread = oldConv == null ||
              newConv.unreadCount > oldConv.unreadCount ||
              newConv.lastMessageText != oldConv.lastMessageText;

          if (isNewUnread && (newConv.lastMessageText?.isNotEmpty ?? false)) {
            NotificationService.instance.showWhatsAppNotification(
              title: newConv.displayName,
              body: newConv.lastMessageText!,
              conversationId: newConv.id,
              senderPhone: newConv.waNumber,
            );
          }
        }
      }

      state = state.copyWith(
        conversations: result.conversations,
        metrics: result.metrics,
      );
    } catch (_) {}
  }


  void setFolder(String folder) {
    if (state.currentFolder == folder) return;
    state = state.copyWith(currentFolder: folder);
    loadConversations();
  }

  void setSearchQuery(String query) {
    state = state.copyWith(searchQuery: query);
    loadConversations(showLoading: false);
  }

  void markConversationLocallyRead(String conversationId) {
    final updatedList = state.conversations.map((c) {
      if (c.id == conversationId) {
        return c.copyWith(unreadCount: 0);
      }
      return c;
    }).toList();
    state = state.copyWith(conversations: updatedList);
  }
}
