import 'package:emoji_picker_flutter/emoji_picker_flutter.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../app/theme/app_colors.dart';
import '../../../auth/presentation/controllers/auth_controller.dart';
import '../../../crm/presentation/widgets/lead_details_sheet.dart';
import '../controllers/chat_controller.dart';
import '../widgets/message_bubble.dart';
import '../widgets/template_picker_bottom_sheet.dart';


class ChatScreen extends ConsumerStatefulWidget {
  final String conversationId;

  const ChatScreen({
    super.key,
    required this.conversationId,
  });

  @override
  ConsumerState<ChatScreen> createState() => _ChatScreenState();
}

class _ChatScreenState extends ConsumerState<ChatScreen> {
  final _messageController = TextEditingController();
  final _scrollController = ScrollController();
  final _focusNode = FocusNode();
  bool _isInternalNoteMode = false;
  bool _showEmojiPicker = false;

  @override
  void initState() {
    super.initState();
    _focusNode.addListener(_onFocusChange);
  }

  void _onFocusChange() {
    if (_focusNode.hasFocus && _showEmojiPicker) {
      setState(() {
        _showEmojiPicker = false;
      });
    }
  }

  @override
  void dispose() {
    _focusNode.removeListener(_onFocusChange);
    _messageController.dispose();
    _scrollController.dispose();
    _focusNode.dispose();
    super.dispose();
  }

  void _toggleEmojiPicker() {
    if (_showEmojiPicker) {
      setState(() {
        _showEmojiPicker = false;
      });
      _focusNode.requestFocus();
    } else {
      _focusNode.unfocus();
      Future.delayed(const Duration(milliseconds: 120), () {
        if (mounted) {
          setState(() {
            _showEmojiPicker = true;
          });
        }
      });
    }
  }

  void _scrollToBottom() {

    if (_scrollController.hasClients) {
      _scrollController.animateTo(
        _scrollController.position.maxScrollExtent,
        duration: const Duration(milliseconds: 250),
        curve: Curves.easeOut,
      );
    }
  }

  Future<void> _handleSend() async {
    final text = _messageController.text.trim();
    if (text.isEmpty) return;

    _messageController.clear();

    if (_isInternalNoteMode) {
      final success = await ref
          .read(chatControllerFamily(widget.conversationId).notifier)
          .sendInternalNote(text);
      if (success) {
        setState(() {
          _isInternalNoteMode = false;
        });
        Future.delayed(const Duration(milliseconds: 100), _scrollToBottom);
      }
    } else {
      final success = await ref
          .read(chatControllerFamily(widget.conversationId).notifier)
          .sendMessage(text);

      if (success) {
        Future.delayed(const Duration(milliseconds: 100), _scrollToBottom);
      }
    }
  }

  void _openTemplatePicker(String customerName) {
    TemplatePickerBottomSheet.show(
      context,
      conversationId: widget.conversationId,
      customerName: customerName,
      onTemplateSent: () {
        ref.read(chatControllerFamily(widget.conversationId).notifier).onTemplateSent();
        Future.delayed(const Duration(milliseconds: 200), _scrollToBottom);
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final chatState = ref.watch(chatControllerFamily(widget.conversationId));
    final chatNotifier = ref.read(chatControllerFamily(widget.conversationId).notifier);
    final currentUser = ref.watch(authNotifierProvider).user;
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    final conversation = chatState.conversation;
    final displayName = conversation?.displayName ?? 'Conversation';
    final waNumber = conversation?.waNumber ?? '';
    final isOpen = conversation?.isOpen ?? true;
    final leadId = conversation?.leadId;
    final isKeyboardOpen = MediaQuery.of(context).viewInsets.bottom > 0;
    final effectiveShowEmoji = _showEmojiPicker && !isKeyboardOpen;

    return PopScope(
      canPop: !effectiveShowEmoji,
      onPopInvokedWithResult: (didPop, result) {
        if (didPop) return;
        if (effectiveShowEmoji) {
          setState(() {
            _showEmojiPicker = false;
          });
        }
      },
      child: Scaffold(
        appBar: AppBar(
        titleSpacing: 0,
        title: InkWell(
          onTap: leadId != null ? () => LeadDetailsSheet.show(context, leadId: leadId) : null,
          child: Row(
            children: [
              CircleAvatar(
                radius: 18,
                backgroundColor: AppColors.primary.withValues(alpha: 0.12),
                child: Text(
                  displayName.isNotEmpty ? displayName[0].toUpperCase() : '?',
                  style: const TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.bold,
                    color: AppColors.primary,
                  ),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Flexible(
                          child: Text(
                            displayName,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: const TextStyle(fontSize: 15, fontWeight: FontWeight.bold),
                          ),
                        ),
                        if (leadId != null) ...[
                          const SizedBox(width: 4),
                          const Icon(Icons.arrow_drop_down, size: 18, color: AppColors.primary),
                        ],
                      ],
                    ),
                    Text(
                      waNumber,
                      style: TextStyle(
                        fontSize: 11,
                        color: isDark ? AppColors.textSecondaryDark : AppColors.textSecondaryLight,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
        actions: [
          // 24-Hour Window Chip
          Padding(
            padding: const EdgeInsets.symmetric(vertical: 14.0),
            child: InkWell(
              borderRadius: BorderRadius.circular(12),
              onTap: !chatState.is24hWindowActive ? () => _openTemplatePicker(displayName) : null,
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                decoration: BoxDecoration(
                  color: chatState.is24hWindowActive
                      ? AppColors.whatsappGreen.withValues(alpha: 0.15)
                      : Colors.amber.withValues(alpha: 0.15),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(
                      chatState.is24hWindowActive
                          ? Icons.check_circle_rounded
                          : Icons.warning_amber_rounded,
                      size: 13,
                      color: chatState.is24hWindowActive
                          ? AppColors.whatsappGreen
                          : Colors.amber[800],
                    ),
                    const SizedBox(width: 4),
                    Text(
                      chatState.is24hWindowActive ? '24h Open' : '24h Expired',
                      style: TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.bold,
                        color: chatState.is24hWindowActive
                            ? AppColors.whatsappGreen
                            : Colors.amber[800],
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
          // Actions Menu
          PopupMenuButton<String>(
            icon: const Icon(Icons.more_vert_rounded),
            onSelected: (val) {
              if (val == 'lead_360' && leadId != null) {
                LeadDetailsSheet.show(context, leadId: leadId);
              } else if (val == 'send_template') {
                _openTemplatePicker(displayName);
              } else if (val == 'toggle_note_mode') {
                setState(() {
                  _isInternalNoteMode = !_isInternalNoteMode;
                });
              } else if (val == 'assign_me' && currentUser != null) {
                chatNotifier.updateAssignment(currentUser.id);
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('Assigned conversation to you')),
                );
              } else if (val == 'toggle_status') {
                final newStatus = isOpen ? 'CLOSED' : 'OPEN';
                chatNotifier.updateStatus(newStatus);
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(content: Text('Conversation status set to $newStatus')),
                );
              }
            },
            itemBuilder: (context) => [
              if (leadId != null)
                const PopupMenuItem(
                  value: 'lead_360',
                  child: Row(
                    children: [
                      Icon(Icons.contact_page_outlined, size: 18, color: AppColors.primary),
                      SizedBox(width: 8),
                      Text('Lead 360 Hub & Pipeline'),
                    ],
                  ),
                ),
              const PopupMenuItem(
                value: 'send_template',
                child: Row(
                  children: [
                    Icon(Icons.flash_on_rounded, size: 18, color: AppColors.whatsappGreen),
                    SizedBox(width: 8),
                    Text('Send WhatsApp Template'),
                  ],
                ),
              ),
              PopupMenuItem(
                value: 'toggle_note_mode',
                child: Row(
                  children: [
                    Icon(
                      _isInternalNoteMode ? Icons.chat_bubble_outline : Icons.lock_outline,
                      size: 18,
                      color: Colors.amber[800],
                    ),
                    const SizedBox(width: 8),
                    Text(_isInternalNoteMode ? 'Switch to WhatsApp Chat' : 'Add Team Internal Note'),
                  ],
                ),
              ),
              const PopupMenuDivider(),
              const PopupMenuItem(
                value: 'assign_me',
                child: Row(
                  children: [
                    Icon(Icons.person_add_alt_1_rounded, size: 18),
                    SizedBox(width: 8),
                    Text('Assign to Me'),
                  ],
                ),
              ),
              PopupMenuItem(
                value: 'toggle_status',
                child: Row(
                  children: [
                    Icon(
                      isOpen ? Icons.check_box_outline_blank_rounded : Icons.check_box_rounded,
                      size: 18,
                    ),
                    const SizedBox(width: 8),
                    Text(isOpen ? 'Mark as Closed' : 'Reopen Conversation'),
                  ],
                ),
              ),
            ],
          ),
        ],
      ),
      body: Column(
        children: [
          // 24-Hour Expired Banner with Direct Template Action
          if (!chatState.is24hWindowActive || chatState.meta24hWarning != null) ...[
            Container(
              width: double.infinity,
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
              color: Colors.amber.withValues(alpha: 0.15),
              child: Row(
                children: [
                  Icon(Icons.info_outline_rounded, color: Colors.amber[800], size: 20),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Text(
                      chatState.meta24hWarning ??
                          'The 24-hour customer service window has expired. Free-form messages cannot be delivered. Send an approved template to reopen window.',
                      style: TextStyle(
                        fontSize: 12,
                        color: isDark ? Colors.amber[200] : Colors.amber[900],
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  FilledButton.icon(
                    onPressed: () => _openTemplatePicker(displayName),
                    style: FilledButton.styleFrom(
                      backgroundColor: Colors.amber[800],
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                      visualDensity: VisualDensity.compact,
                    ),
                    icon: const Icon(Icons.flash_on_rounded, size: 14),
                    label: const Text('Template', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold)),
                  ),
                ],
              ),
            ),
          ],

          // Error banner
          if (chatState.errorMessage != null) ...[
            Container(
              width: double.infinity,
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              color: AppColors.priorityHigh.withValues(alpha: 0.1),
              child: Text(
                chatState.errorMessage!,
                style: const TextStyle(color: AppColors.priorityHigh, fontSize: 12),
              ),
            ),
          ],

          // Messages Timeline
          Expanded(
            child: GestureDetector(
              behavior: HitTestBehavior.opaque,
              onTap: () {
                _focusNode.unfocus();
                if (_showEmojiPicker) {
                  setState(() {
                    _showEmojiPicker = false;
                  });
                }
              },
              child: chatState.isLoading
                  ? const Center(child: CircularProgressIndicator())
                  : chatState.messages.isEmpty
                      ? Center(
                          child: Text(
                            'No messages in this conversation yet.',
                            style: TextStyle(
                              color: isDark ? AppColors.textMutedDark : AppColors.textMutedLight,
                            ),
                          ),
                        )
                      : ListView.builder(
                          controller: _scrollController,
                          padding: const EdgeInsets.symmetric(vertical: 12),
                          itemCount: chatState.messages.length,
                          itemBuilder: (context, index) {
                            final msg = chatState.messages[index];
                            return MessageBubble(message: msg);
                          },
                        ),
            ),
          ),

          // Message Composer
          _buildComposer(chatState, displayName, isDark, effectiveShowEmoji),

          // Emoji Keyboard Tray (only when soft keyboard is NOT open)
          if (effectiveShowEmoji)
            SizedBox(
              height: 260,
              child: EmojiPicker(
                textEditingController: _messageController,
                config: Config(
                  height: 260,
                  checkPlatformCompatibility: false,
                  emojiViewConfig: EmojiViewConfig(
                    backgroundColor: isDark ? AppColors.surfaceDark : const Color(0xFFF3F4F6),
                    columns: 8,
                    emojiSizeMax: 28,
                  ),
                  categoryViewConfig: CategoryViewConfig(
                    backgroundColor: isDark ? AppColors.backgroundDark : Colors.white,
                    indicatorColor: AppColors.primary,
                    iconColor: isDark ? Colors.grey : Colors.grey[600]!,
                    iconColorSelected: AppColors.primary,
                    backspaceColor: AppColors.primary,
                  ),
                ),
              ),
            ),
        ],
      ),
    ),
  );
}


  Widget _buildComposer(ChatState state, String displayName, bool isDark, bool isEmojiOpen) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 6),
      decoration: BoxDecoration(
        color: _isInternalNoteMode
            ? (isDark ? Colors.brown[900] : const Color(0xFFFEF3C7))
            : (isDark ? AppColors.surfaceDark : Colors.white),
        border: Border(
          top: BorderSide(
            color: _isInternalNoteMode
                ? Colors.amber.withValues(alpha: 0.5)
                : (isDark ? AppColors.borderDark : AppColors.borderLight),
          ),
        ),
      ),
      child: SafeArea(
        top: false,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            if (_isInternalNoteMode) ...[
              Padding(
                padding: const EdgeInsets.only(bottom: 6),
                child: Row(
                  children: [
                    const Icon(Icons.lock_rounded, size: 14, color: Colors.amber),
                    const SizedBox(width: 4),
                    const Text(
                      'Internal Team Note (Private - Customer will NOT see this)',
                      style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Colors.amber),
                    ),
                    const Spacer(),
                    GestureDetector(
                      onTap: () {
                        setState(() {
                          _isInternalNoteMode = false;
                        });
                      },
                      child: const Icon(Icons.close_rounded, size: 16, color: Colors.amber),
                    ),
                  ],
                ),
              ),
            ],
            Row(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                // Quick Template Action Icon
                IconButton(
                  icon: const Icon(Icons.flash_on_rounded, color: AppColors.whatsappGreen),
                  tooltip: 'Send WhatsApp Template',
                  onPressed: () => _openTemplatePicker(displayName),
                ),
                Expanded(
                  child: Container(
                    decoration: BoxDecoration(
                      color: isDark ? AppColors.backgroundDark : AppColors.backgroundLight,
                      borderRadius: BorderRadius.circular(24),
                      border: Border.all(
                        color: _isInternalNoteMode
                            ? Colors.amber
                            : (isDark ? AppColors.borderDark : AppColors.borderLight),
                      ),
                    ),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.end,
                      children: [
                        IconButton(
                          icon: Icon(
                            isEmojiOpen
                                ? Icons.keyboard_rounded
                                : Icons.sentiment_satisfied_alt_rounded,
                            color: isEmojiOpen
                                ? AppColors.primary
                                : (isDark ? Colors.grey[400] : Colors.grey[600]),
                            size: 22,
                          ),
                          tooltip: 'Emoji',
                          padding: const EdgeInsets.all(8),
                          constraints: const BoxConstraints(minWidth: 36, minHeight: 36),
                          onPressed: _toggleEmojiPicker,
                        ),
                        Expanded(
                          child: TextField(
                            controller: _messageController,
                            focusNode: _focusNode,
                            minLines: 1,
                            maxLines: 4,
                            textCapitalization: TextCapitalization.sentences,
                            onTap: () {
                              if (_showEmojiPicker) {
                                setState(() {
                                  _showEmojiPicker = false;
                                });
                              }
                            },
                            decoration: InputDecoration(
                              hintText: _isInternalNoteMode
                                  ? 'Write private internal note...'
                                  : 'Type a WhatsApp message...',
                              contentPadding: const EdgeInsets.symmetric(horizontal: 4, vertical: 10),
                              border: InputBorder.none,
                              enabledBorder: InputBorder.none,
                              focusedBorder: InputBorder.none,
                            ),
                          ),
                        ),
                        const SizedBox(width: 8),
                      ],
                    ),
                  ),
                ),
                const SizedBox(width: 6),
                Container(
                  decoration: BoxDecoration(
                    color: _isInternalNoteMode ? Colors.amber[800] : AppColors.primary,
                    shape: BoxShape.circle,
                  ),
                  child: IconButton(
                    icon: state.isSending
                        ? const SizedBox(
                            width: 18,
                            height: 18,
                            child: CircularProgressIndicator(
                              strokeWidth: 2,
                              valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                            ),
                          )
                        : Icon(
                            _isInternalNoteMode ? Icons.note_add_rounded : Icons.send_rounded,
                            color: Colors.white,
                            size: 20,
                          ),
                    onPressed: state.isSending ? null : _handleSend,
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

