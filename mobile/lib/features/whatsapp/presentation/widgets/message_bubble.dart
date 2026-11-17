import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../../../../app/theme/app_colors.dart';
import '../../domain/models/whatsapp_message_model.dart';

class MessageBubble extends StatelessWidget {
  final WhatsAppMessageModel message;

  const MessageBubble({
    super.key,
    required this.message,
  });

  String _formatTime(DateTime? dateTime) {
    if (dateTime == null) return '';
    return DateFormat('hh:mm a').format(dateTime);
  }

  Widget _buildStatusIcon(String status) {
    switch (status.toUpperCase()) {
      case 'READ':
        return const Icon(Icons.done_all_rounded, size: 15, color: Colors.blueAccent);
      case 'DELIVERED':
        return const Icon(Icons.done_all_rounded, size: 15, color: Colors.white70);
      case 'SENT':
        return const Icon(Icons.done_rounded, size: 15, color: Colors.white70);
      case 'PENDING':
      case 'SENDING':
        return const Icon(Icons.access_time_rounded, size: 14, color: Colors.white60);
      case 'FAILED':
        return const Icon(Icons.error_outline_rounded, size: 15, color: AppColors.priorityHigh);
      default:
        return const SizedBox.shrink();
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    // 1. SYSTEM / AUTOMATION MESSAGE
    if (message.isSystemMessage) {
      return Center(
        child: Container(
          margin: const EdgeInsets.symmetric(vertical: 8, horizontal: 24),
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
          decoration: BoxDecoration(
            color: isDark ? AppColors.bubbleSystemDark : AppColors.bubbleSystemLight,
            borderRadius: BorderRadius.circular(8),
            border: Border.all(
              color: isDark
                  ? Colors.amber.withValues(alpha: 0.3)
                  : Colors.amber.withValues(alpha: 0.5),
            ),
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(
                    Icons.smart_toy_outlined,
                    size: 14,
                    color: isDark ? Colors.amber[200] : Colors.amber[900],
                  ),
                  const SizedBox(width: 5),
                  Text(
                    'Automated Workflow Message',
                    style: TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.bold,
                      color: isDark ? Colors.amber[200] : Colors.amber[900],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 4),
              Text(
                message.textBody ?? '',
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontSize: 12,
                  color: isDark ? Colors.amber[100] : Colors.brown[900],
                ),
              ),
              const SizedBox(height: 2),
              Text(
                _formatTime(message.createdAt),
                style: TextStyle(
                  fontSize: 10,
                  color: isDark ? Colors.amber[300] : Colors.brown[600],
                ),
              ),
            ],
          ),
        ),
      );
    }

    // 2. INTERNAL TEAM NOTE (Private - Agent Only)
    if (message.type == 'internal_note') {
      return Center(
        child: Container(
          margin: const EdgeInsets.symmetric(vertical: 8, horizontal: 20),
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
          decoration: BoxDecoration(
            color: isDark ? AppColors.bubbleSystemDark : const Color(0xFFFEF3C7),
            borderRadius: BorderRadius.circular(10),
            border: Border.all(
              color: Colors.amber.withValues(alpha: 0.5),
              width: 1,
            ),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Icon(Icons.lock_rounded, size: 14, color: Colors.amber),
                  const SizedBox(width: 5),
                  Text(
                    'Team Internal Note (Private)',
                    style: TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.bold,
                      color: isDark ? Colors.amber[200] : Colors.brown[900],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 6),
              Text(
                message.textBody ?? '',
                style: TextStyle(
                  fontSize: 13,
                  color: isDark ? Colors.amber[100] : Colors.brown[900],
                ),
              ),
              const SizedBox(height: 4),
              Row(
                mainAxisAlignment: MainAxisAlignment.end,
                children: [
                  Text(
                    _formatTime(message.createdAt),
                    style: TextStyle(
                      fontSize: 10,
                      color: isDark ? Colors.amber[300] : Colors.brown[600],
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      );
    }

    // 3. REGULAR INBOUND / OUTBOUND MESSAGES
    final isOutbound = message.isOutbound;

    return Align(
      alignment: isOutbound ? Alignment.centerRight : Alignment.centerLeft,
      child: Container(
        constraints: BoxConstraints(
          maxWidth: MediaQuery.of(context).size.width * 0.78,
        ),
        margin: const EdgeInsets.symmetric(vertical: 4, horizontal: 16),
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
        decoration: BoxDecoration(
          color: isOutbound
              ? (isDark ? AppColors.primary : AppColors.primary)
              : (isDark ? AppColors.surfaceDark : AppColors.bubbleInboundLight),
          borderRadius: BorderRadius.only(
            topLeft: const Radius.circular(14),
            topRight: const Radius.circular(14),
            bottomLeft: Radius.circular(isOutbound ? 14 : 2),
            bottomRight: Radius.circular(isOutbound ? 2 : 14),
          ),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.04),
              offset: const Offset(0, 1),
              blurRadius: 2,
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Sender indicator if outbound
            if (isOutbound && message.senderType.isNotEmpty) ...[
              Text(
                message.senderType == 'AGENT' ? 'You' : message.senderType,
                style: const TextStyle(
                  fontSize: 11,
                  fontWeight: FontWeight.w600,
                  color: Colors.white70,
                ),
              ),
              const SizedBox(height: 2),
            ],

            // Message text
            Text(
              message.textBody ?? '',
              style: TextStyle(
                fontSize: 14.5,
                height: 1.35,
                color: isOutbound
                    ? Colors.white
                    : (isDark ? AppColors.textPrimaryDark : AppColors.textPrimaryLight),
              ),
            ),
            const SizedBox(height: 4),

            // Time & Status Checkmarks
            Row(
              mainAxisSize: MainAxisSize.min,
              mainAxisAlignment: MainAxisAlignment.end,
              children: [
                Text(
                  _formatTime(message.createdAt),
                  style: TextStyle(
                    fontSize: 10.5,
                    color: isOutbound
                        ? Colors.white70
                        : (isDark ? AppColors.textMutedDark : AppColors.textMutedLight),
                  ),
                ),
                if (isOutbound) ...[
                  const SizedBox(width: 4),
                  _buildStatusIcon(message.status),
                ],
              ],
            ),
          ],
        ),
      ),
    );
  }
}
