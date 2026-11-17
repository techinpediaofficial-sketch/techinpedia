import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../../../app/theme/app_colors.dart';
import '../../domain/models/admin_ticket_model.dart';
import '../controllers/tickets_controller.dart';

class TicketsScreen extends ConsumerWidget {
  const TicketsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(ticketsControllerProvider);
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    final dateFmt = DateFormat('dd MMM yyyy, hh:mm a');

    return Scaffold(
      appBar: AppBar(
        title: const Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Support Helpdesk',
              style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18),
            ),
            Text(
              'Customer Tickets & SLA Queue',
              style: TextStyle(fontSize: 12, color: Colors.grey),
            ),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh_rounded),
            tooltip: 'Refresh',
            onPressed: () => ref.read(ticketsControllerProvider.notifier).loadTickets(),
          ),
        ],
      ),
      body: Column(
        children: [
          // Filter Chips
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            child: Row(
              children: [
                _buildStatusChip(ref, 'ALL', 'All (${state.tickets.length})', state.selectedStatus),
                const SizedBox(width: 8),
                _buildStatusChip(ref, 'OPEN', 'Open (${state.openCount})', state.selectedStatus),
                const SizedBox(width: 8),
                _buildStatusChip(ref, 'IN_PROGRESS', 'In Progress (${state.inProgressCount})', state.selectedStatus),
                const SizedBox(width: 8),
                _buildStatusChip(ref, 'RESOLVED', 'Resolved (${state.resolvedCount})', state.selectedStatus),
              ],
            ),
          ),
          const Divider(height: 1),

          // Tickets List
          Expanded(
            child: state.isLoading
                ? const Center(child: CircularProgressIndicator())
                : state.error != null
                    ? Center(
                        child: Padding(
                          padding: const EdgeInsets.all(24.0),
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              const Icon(Icons.error_outline_rounded, color: Colors.red, size: 48),
                              const SizedBox(height: 12),
                              Text(
                                state.error!,
                                textAlign: TextAlign.center,
                                style: const TextStyle(fontSize: 14),
                              ),
                              const SizedBox(height: 16),
                              FilledButton.tonal(
                                onPressed: () => ref.read(ticketsControllerProvider.notifier).loadTickets(),
                                child: const Text('Retry'),
                              ),
                            ],
                          ),
                        ),
                      )
                    : state.tickets.isEmpty
                        ? Center(
                            child: Column(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Icon(
                                  Icons.support_agent_rounded,
                                  size: 64,
                                  color: isDark ? Colors.white24 : Colors.grey[300],
                                ),
                                const SizedBox(height: 12),
                                Text(
                                  'No tickets found for this filter.',
                                  style: TextStyle(
                                    fontSize: 15,
                                    fontWeight: FontWeight.w600,
                                    color: isDark ? AppColors.textSecondaryDark : AppColors.textSecondaryLight,
                                  ),
                                ),
                              ],
                            ),
                          )
                        : RefreshIndicator(
                            onRefresh: () => ref.read(ticketsControllerProvider.notifier).loadTickets(),
                            child: ListView.separated(
                              padding: const EdgeInsets.all(16),
                              itemCount: state.tickets.length,
                              separatorBuilder: (_, _) => const SizedBox(height: 12),
                              itemBuilder: (context, index) {
                                final ticket = state.tickets[index];
                                return _buildTicketCard(context, ref, ticket, isDark, dateFmt);
                              },
                            ),
                          ),
          ),
        ],
      ),
    );
  }

  Widget _buildStatusChip(WidgetRef ref, String statusKey, String label, String currentStatus) {
    final isSelected = currentStatus == statusKey;
    return ChoiceChip(
      selected: isSelected,
      label: Text(label),
      labelStyle: TextStyle(
        fontSize: 12,
        fontWeight: isSelected ? FontWeight.bold : FontWeight.w500,
        color: isSelected ? Colors.white : null,
      ),
      selectedColor: AppColors.primary,
      onSelected: (_) {
        ref.read(ticketsControllerProvider.notifier).setStatus(statusKey);
      },
    );
  }

  Widget _buildTicketCard(
    BuildContext context,
    WidgetRef ref,
    AdminTicketModel ticket,
    bool isDark,
    DateFormat dateFmt,
  ) {
    Color priorityColor;
    if (ticket.priority == 'URGENT' || ticket.priority == 'HIGH') {
      priorityColor = Colors.red;
    } else if (ticket.priority == 'MEDIUM') {
      priorityColor = Colors.orange;
    } else {
      priorityColor = Colors.blue;
    }

    Color statusColor;
    if (ticket.isResolved) {
      statusColor = AppColors.emerald;
    } else if (ticket.isInProgress) {
      statusColor = Colors.blue;
    } else {
      statusColor = Colors.amber;
    }

    return Card(
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
        side: BorderSide(
          color: isDark ? AppColors.borderDark : AppColors.borderLight,
        ),
      ),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Top: Ticket Number, Priority & Category
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                      decoration: BoxDecoration(
                        color: AppColors.primary.withValues(alpha: 0.12),
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: Text(
                        ticket.ticketNumber,
                        style: const TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.bold,
                          color: AppColors.primary,
                        ),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                      decoration: BoxDecoration(
                        color: priorityColor.withValues(alpha: 0.15),
                        borderRadius: BorderRadius.circular(6),
                        border: Border.all(color: priorityColor.withValues(alpha: 0.3)),
                      ),
                      child: Text(
                        ticket.priority,
                        style: TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.bold,
                          color: priorityColor,
                        ),
                      ),
                    ),
                  ],
                ),
                InkWell(
                  borderRadius: BorderRadius.circular(8),
                  onTap: () => _showStatusActionSheet(context, ref, ticket),
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      color: statusColor.withValues(alpha: 0.15),
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(color: statusColor.withValues(alpha: 0.3)),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Text(
                          ticket.status.replaceAll('_', ' '),
                          style: TextStyle(
                            color: statusColor,
                            fontSize: 11,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        const SizedBox(width: 4),
                        Icon(Icons.arrow_drop_down, size: 16, color: statusColor),
                      ],
                    ),
                  ),
                ),
              ],
            ),

            const SizedBox(height: 12),

            // Subject
            Text(
              ticket.subject,
              style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15),
            ),
            const SizedBox(height: 4),

            // Client Info
            Row(
              children: [
                const Icon(Icons.person_outline, size: 14, color: Colors.grey),
                const SizedBox(width: 4),
                Text(
                  ticket.clientName,
                  style: TextStyle(
                    fontSize: 12,
                    color: isDark ? AppColors.textSecondaryDark : AppColors.textSecondaryLight,
                  ),
                ),
                if (ticket.companyName != null && ticket.companyName!.isNotEmpty) ...[
                  const Text(' • ', style: TextStyle(color: Colors.grey)),
                  Text(
                    ticket.companyName!,
                    style: TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                      color: isDark ? AppColors.textSecondaryDark : AppColors.textSecondaryLight,
                    ),
                  ),
                ],
              ],
            ),

            const SizedBox(height: 10),
            const Divider(height: 1),
            const SizedBox(height: 10),

            // Bottom timestamp & quick email reply
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  dateFmt.format(ticket.createdAt),
                  style: TextStyle(
                    fontSize: 11,
                    color: isDark ? AppColors.textSecondaryDark : AppColors.textSecondaryLight,
                  ),
                ),
                if (ticket.clientEmail.isNotEmpty)
                  IconButton(
                    icon: const Icon(Icons.reply_rounded, size: 20, color: AppColors.primary),
                    tooltip: 'Reply via Email',
                    onPressed: () {
                      final subject = Uri.encodeComponent('Re: [${ticket.ticketNumber}] ${ticket.subject}');
                      final uri = Uri.parse('mailto:${ticket.clientEmail}?subject=$subject');
                      launchUrl(uri);
                    },
                  ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  void _showStatusActionSheet(BuildContext context, WidgetRef ref, AdminTicketModel ticket) {
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (ctx) {
        return SafeArea(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const SizedBox(height: 12),
              Container(
                width: 36,
                height: 4,
                decoration: BoxDecoration(
                  color: Colors.grey.withValues(alpha: 0.4),
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
              const SizedBox(height: 12),
              Text(
                'Update Status for ${ticket.ticketNumber}',
                style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
              ),
              const SizedBox(height: 12),
              ListTile(
                leading: const Icon(Icons.hourglass_top_rounded, color: Colors.amber),
                title: const Text('Mark as OPEN'),
                selected: ticket.isOpen,
                onTap: () {
                  Navigator.pop(ctx);
                  ref.read(ticketsControllerProvider.notifier).updateStatus(ticket.id, 'OPEN');
                },
              ),
              ListTile(
                leading: const Icon(Icons.pending_actions_rounded, color: Colors.blue),
                title: const Text('Mark as IN PROGRESS'),
                selected: ticket.isInProgress,
                onTap: () {
                  Navigator.pop(ctx);
                  ref.read(ticketsControllerProvider.notifier).updateStatus(ticket.id, 'IN_PROGRESS');
                },
              ),
              ListTile(
                leading: const Icon(Icons.check_circle_rounded, color: AppColors.emerald),
                title: const Text('Mark as RESOLVED'),
                selected: ticket.isResolved,
                onTap: () {
                  Navigator.pop(ctx);
                  ref.read(ticketsControllerProvider.notifier).updateStatus(ticket.id, 'RESOLVED');
                },
              ),
              const SizedBox(height: 8),
            ],
          ),
        );
      },
    );
  }
}
