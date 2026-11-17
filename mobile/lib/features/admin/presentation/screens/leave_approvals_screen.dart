import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import '../../../../app/theme/app_colors.dart';
import '../../domain/models/leave_approval_model.dart';
import '../controllers/leave_approvals_controller.dart';

class LeaveApprovalsScreen extends ConsumerWidget {
  const LeaveApprovalsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(leaveApprovalsControllerProvider);
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    final dateFmt = DateFormat('dd MMM yyyy');

    return Scaffold(
      appBar: AppBar(
        title: const Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Leave Approvals',
              style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18),
            ),
            Text(
              'Staff Absence Management',
              style: TextStyle(fontSize: 12, color: Colors.grey),
            ),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh_rounded),
            tooltip: 'Refresh',
            onPressed: () => ref.read(leaveApprovalsControllerProvider.notifier).loadLeaves(),
          ),
        ],
      ),
      body: Column(
        children: [
          // Filter Chips
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            child: SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              child: Row(
                children: [
                  _buildFilterChip(ref, 'PENDING', 'Pending (${state.leaves.where((l) => l.isPending).length})', state.selectedFilter),
                  const SizedBox(width: 8),
                  _buildFilterChip(ref, 'APPROVED', 'Approved', state.selectedFilter),
                  const SizedBox(width: 8),
                  _buildFilterChip(ref, 'REJECTED', 'Rejected', state.selectedFilter),
                  const SizedBox(width: 8),
                  _buildFilterChip(ref, 'ALL', 'All Leaves', state.selectedFilter),
                ],
              ),
            ),
          ),
          const Divider(height: 1),

          // Content Area
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
                                onPressed: () => ref.read(leaveApprovalsControllerProvider.notifier).loadLeaves(),
                                child: const Text('Retry'),
                              ),
                            ],
                          ),
                        ),
                      )
                    : state.leaves.isEmpty
                        ? Center(
                            child: Column(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Icon(
                                  Icons.check_circle_outline_rounded,
                                  size: 64,
                                  color: isDark ? Colors.white24 : Colors.grey[300],
                                ),
                                const SizedBox(height: 12),
                                Text(
                                  state.selectedFilter == 'PENDING'
                                      ? 'No pending leave requests!'
                                      : 'No leaves found for this filter.',
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
                            onRefresh: () => ref.read(leaveApprovalsControllerProvider.notifier).loadLeaves(),
                            child: ListView.separated(
                              padding: const EdgeInsets.all(16),
                              itemCount: state.leaves.length,
                              separatorBuilder: (_, _) => const SizedBox(height: 14),
                              itemBuilder: (context, index) {
                                final leave = state.leaves[index];
                                return _buildLeaveCard(context, ref, leave, isDark, dateFmt);
                              },
                            ),
                          ),
          ),
        ],
      ),
    );
  }

  Widget _buildFilterChip(WidgetRef ref, String filterKey, String label, String currentFilter) {
    final isSelected = currentFilter == filterKey;
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
        ref.read(leaveApprovalsControllerProvider.notifier).setFilter(filterKey);
      },
    );
  }

  Widget _buildLeaveCard(
    BuildContext context,
    WidgetRef ref,
    LeaveApprovalModel leave,
    bool isDark,
    DateFormat dateFmt,
  ) {
    Color statusColor;
    IconData statusIcon;
    if (leave.isApproved) {
      statusColor = AppColors.emerald;
      statusIcon = Icons.check_circle_rounded;
    } else if (leave.isRejected) {
      statusColor = Colors.red;
      statusIcon = Icons.cancel_rounded;
    } else {
      statusColor = Colors.amber;
      statusIcon = Icons.hourglass_top_rounded;
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
            // Top: Employee & Status Badge
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                CircleAvatar(
                  radius: 20,
                  backgroundColor: AppColors.primary.withValues(alpha: 0.15),
                  child: Text(
                    leave.employeeName.isNotEmpty ? leave.employeeName[0].toUpperCase() : 'E',
                    style: const TextStyle(fontWeight: FontWeight.bold, color: AppColors.primary),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        leave.employeeName,
                        style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        '${leave.employeeCode} • ${leave.departmentName}',
                        style: TextStyle(
                          fontSize: 12,
                          color: isDark ? AppColors.textSecondaryDark : AppColors.textSecondaryLight,
                        ),
                      ),
                    ],
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 4),
                  decoration: BoxDecoration(
                    color: statusColor.withValues(alpha: 0.15),
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: statusColor.withValues(alpha: 0.3)),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(statusIcon, size: 13, color: statusColor),
                      const SizedBox(width: 4),
                      Text(
                        leave.status,
                        style: TextStyle(
                          color: statusColor,
                          fontSize: 11,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),

            const SizedBox(height: 14),

            // Date Range & Duration Banner
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              decoration: BoxDecoration(
                color: isDark ? Colors.white.withValues(alpha: 0.05) : Colors.grey.withValues(alpha: 0.08),
                borderRadius: BorderRadius.circular(10),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Row(
                    children: [
                      const Icon(Icons.date_range_rounded, size: 16, color: AppColors.primary),
                      const SizedBox(width: 6),
                      Text(
                        '${dateFmt.format(leave.startDate)} - ${dateFmt.format(leave.endDate)}',
                        style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600),
                      ),
                    ],
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                    decoration: BoxDecoration(
                      color: AppColors.primary.withValues(alpha: 0.15),
                      borderRadius: BorderRadius.circular(6),
                    ),
                    child: Text(
                      '${leave.daysCount} Day${leave.daysCount > 1 ? 's' : ''} (${leave.leaveType})',
                      style: const TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.bold,
                        color: AppColors.primary,
                      ),
                    ),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 10),

            // Reason
            Text(
              'Reason: "${leave.reason}"',
              style: TextStyle(
                fontSize: 13,
                fontStyle: FontStyle.italic,
                color: isDark ? AppColors.textSecondaryDark : AppColors.textSecondaryLight,
              ),
            ),

            // Approve / Reject Actions (Only if PENDING)
            if (leave.isPending) ...[
              const SizedBox(height: 16),
              const Divider(height: 1),
              const SizedBox(height: 12),
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton.icon(
                      style: OutlinedButton.styleFrom(
                        foregroundColor: Colors.red,
                        side: const BorderSide(color: Colors.red),
                        padding: const EdgeInsets.symmetric(vertical: 10),
                      ),
                      icon: const Icon(Icons.close_rounded, size: 16),
                      label: const Text('Reject', style: TextStyle(fontWeight: FontWeight.bold)),
                      onPressed: () => _confirmAction(context, ref, leave, 'REJECTED'),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: FilledButton.icon(
                      style: FilledButton.styleFrom(
                        backgroundColor: AppColors.emerald,
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(vertical: 10),
                      ),
                      icon: const Icon(Icons.check_rounded, size: 16),
                      label: const Text('Approve', style: TextStyle(fontWeight: FontWeight.bold)),
                      onPressed: () => _confirmAction(context, ref, leave, 'APPROVED'),
                    ),
                  ),
                ],
              ),
            ],
          ],
        ),
      ),
    );
  }

  void _confirmAction(BuildContext context, WidgetRef ref, LeaveApprovalModel leave, String targetStatus) {
    final isApprove = targetStatus == 'APPROVED';
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text(isApprove ? 'Approve Leave Request?' : 'Reject Leave Request?'),
        content: Text(
          isApprove
              ? 'Are you sure you want to approve ${leave.daysCount} day(s) leave for ${leave.employeeName}?'
              : 'Are you sure you want to reject the leave request for ${leave.employeeName}?',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Cancel'),
          ),
          FilledButton(
            style: FilledButton.styleFrom(
              backgroundColor: isApprove ? AppColors.emerald : Colors.red,
            ),
            onPressed: () async {
              Navigator.pop(ctx);
              final success = await ref
                  .read(leaveApprovalsControllerProvider.notifier)
                  .reviewLeave(leaveId: leave.id, status: targetStatus);
              if (context.mounted) {
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(
                    content: Text(
                      success
                          ? 'Leave request successfully ${isApprove ? 'approved' : 'rejected'}.'
                          : 'Failed to update leave request.',
                    ),
                    backgroundColor: success ? (isApprove ? AppColors.emerald : Colors.red) : Colors.red,
                  ),
                );
              }
            },
            child: Text(isApprove ? 'Approve' : 'Reject'),
          ),
        ],
      ),
    );
  }
}
