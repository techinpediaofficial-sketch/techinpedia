import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import '../../../../app/theme/app_colors.dart';
import '../../../auth/presentation/controllers/auth_controller.dart';
import '../controllers/admin_dashboard_controller.dart';
import '../controllers/leave_approvals_controller.dart';
import '../controllers/tickets_controller.dart';

class AdminDashboardScreen extends ConsumerWidget {
  const AdminDashboardScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = ref.watch(authNotifierProvider).user;
    final dashboardState = ref.watch(adminDashboardControllerProvider);
    final leavesState = ref.watch(leaveApprovalsControllerProvider);
    final ticketsState = ref.watch(ticketsControllerProvider);
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    final currencyFmt = NumberFormat.currency(locale: 'en_IN', symbol: '₹', decimalDigits: 0);

    final d = dashboardState.data;
    final pendingLeavesCount = leavesState.leaves.where((l) => l.isPending).length;
    final openTicketsCount = ticketsState.openCount;

    return Scaffold(
      appBar: AppBar(
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                const Text(
                  'TechInPedia',
                  style: TextStyle(fontWeight: FontWeight.w900, fontSize: 18),
                ),
                const SizedBox(width: 8),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
                  decoration: BoxDecoration(
                    color: AppColors.primary.withValues(alpha: 0.15),
                    borderRadius: BorderRadius.circular(6),
                    border: Border.all(color: AppColors.primary.withValues(alpha: 0.3)),
                  ),
                  child: const Text(
                    'ADMIN OS',
                    style: TextStyle(
                      fontSize: 10,
                      fontWeight: FontWeight.bold,
                      color: AppColors.primary,
                      letterSpacing: 0.5,
                    ),
                  ),
                ),
              ],
            ),
            Text(
              user?.name ?? 'Executive Console',
              style: TextStyle(
                fontSize: 12,
                color: isDark ? AppColors.textSecondaryDark : AppColors.textSecondaryLight,
              ),
            ),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh_rounded),
            tooltip: 'Refresh Metrics',
            onPressed: () {
              ref.read(adminDashboardControllerProvider.notifier).loadDashboard();
              ref.read(leaveApprovalsControllerProvider.notifier).loadLeaves();
              ref.read(ticketsControllerProvider.notifier).loadTickets();
            },
          ),
          IconButton(
            icon: const Icon(Icons.account_circle_outlined),
            tooltip: 'Profile & Settings',
            onPressed: () => context.push('/profile'),
          ),
        ],
      ),
      body: dashboardState.isLoading
          ? const Center(child: CircularProgressIndicator())
          : RefreshIndicator(
              onRefresh: () async {
                await Future.wait([
                  ref.read(adminDashboardControllerProvider.notifier).loadDashboard(),
                  ref.read(leaveApprovalsControllerProvider.notifier).loadLeaves(),
                  ref.read(ticketsControllerProvider.notifier).loadTickets(),
                ]);
              },
              child: ListView(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
                children: [
                  // Action Alert Banners if pending items exist
                  if (pendingLeavesCount > 0)
                    Container(
                      margin: const EdgeInsets.only(bottom: 14),
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: Colors.amber.withValues(alpha: 0.12),
                        borderRadius: BorderRadius.circular(14),
                        border: Border.all(color: Colors.amber.withValues(alpha: 0.4)),
                      ),
                      child: Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.all(8),
                            decoration: BoxDecoration(
                              color: Colors.amber.withValues(alpha: 0.2),
                              borderRadius: BorderRadius.circular(10),
                            ),
                            child: const Icon(Icons.pending_actions_rounded, color: Colors.amber, size: 20),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  '$pendingLeavesCount Leave Request${pendingLeavesCount > 1 ? 's' : ''} Pending',
                                  style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
                                ),
                                const Text(
                                  'Staff members awaiting manager approval',
                                  style: TextStyle(fontSize: 11, color: Colors.grey),
                                ),
                              ],
                            ),
                          ),
                          FilledButton.tonal(
                            style: FilledButton.styleFrom(
                              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                              visualDensity: VisualDensity.compact,
                            ),
                            onPressed: () => context.push('/admin/leaves'),
                            child: const Text('Review', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                          ),
                        ],
                      ),
                    ),

                  // Top Revenue & MRR Card
                  Container(
                    padding: const EdgeInsets.all(18),
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        colors: isDark
                            ? [const Color(0xFF312E81), const Color(0xFF1E1B4B)]
                            : [const Color(0xFF4F46E5), const Color(0xFF4338CA)],
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                      ),
                      borderRadius: BorderRadius.circular(20),
                      boxShadow: [
                        BoxShadow(
                          color: AppColors.primary.withValues(alpha: 0.3),
                          blurRadius: 14,
                          offset: const Offset(0, 6),
                        ),
                      ],
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            const Text(
                              'MONTHLY RECURRING RUNRATE',
                              style: TextStyle(
                                color: Colors.white70,
                                fontSize: 11,
                                fontWeight: FontWeight.w700,
                                letterSpacing: 0.8,
                              ),
                            ),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                              decoration: BoxDecoration(
                                color: Colors.white.withValues(alpha: 0.2),
                                borderRadius: BorderRadius.circular(12),
                              ),
                              child: const Row(
                                children: [
                                  Icon(Icons.trending_up_rounded, color: Colors.white, size: 14),
                                  SizedBox(width: 4),
                                  Text(
                                    'Active MRR',
                                    style: TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.bold),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 8),
                        Text(
                          currencyFmt.format(d.financials.monthlyRecurringRevenue),
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 30,
                            fontWeight: FontWeight.w900,
                            letterSpacing: -0.5,
                          ),
                        ),
                        const SizedBox(height: 14),
                        const Divider(color: Colors.white24, height: 1),
                        const SizedBox(height: 12),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            _buildWhiteMiniMetric('Invoiced', currencyFmt.format(d.financials.totalInvoiced)),
                            _buildWhiteMiniMetric('Collected', currencyFmt.format(d.financials.totalCollected)),
                            _buildWhiteMiniMetric('Due', currencyFmt.format(d.financials.outstandingDue)),
                          ],
                        ),
                      ],
                    ),
                  ),

                  const SizedBox(height: 20),

                  // Operations & Team Snapshot (2x2 Grid)
                  GridView.count(
                    crossAxisCount: 2,
                    crossAxisSpacing: 12,
                    mainAxisSpacing: 12,
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    childAspectRatio: 1.45,
                    children: [
                      _buildMetricTile(
                        context,
                        title: 'Staff Headcount',
                        value: '${d.workforce.totalHeadcount}',
                        subtitle: 'Active Workforce',
                        icon: Icons.badge_rounded,
                        color: Colors.blue,
                        onTap: () => context.push('/admin/employees'),
                      ),
                      _buildMetricTile(
                        context,
                        title: 'Sales Pipeline',
                        value: '${d.pipeline.openDealsCount}',
                        subtitle: '${d.pipeline.winRate}% Win Rate',
                        icon: Icons.pie_chart_rounded,
                        color: Colors.purple,
                        onTap: () => context.push('/admin/invoices'),
                      ),
                      _buildMetricTile(
                        context,
                        title: 'Helpdesk Tickets',
                        value: '$openTicketsCount Open',
                        subtitle: '${d.delivery.ticketSlaRate}% SLA Resolved',
                        icon: Icons.support_agent_rounded,
                        color: Colors.orange,
                        onTap: () => context.push('/admin/tickets'),
                      ),
                      _buildMetricTile(
                        context,
                        title: 'Live Attendance',
                        value: 'Daily Roster',
                        subtitle: 'Punches & Grace',
                        icon: Icons.access_time_filled_rounded,
                        color: AppColors.emerald,
                        onTap: () => context.push('/admin/attendance-roster'),
                      ),
                    ],
                  ),

                  const SizedBox(height: 24),

                  // Admin Command Shortcuts
                  Text(
                    'EXECUTIVE COMMAND HUB',
                    style: TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w800,
                      color: isDark ? AppColors.textSecondaryDark : AppColors.textSecondaryLight,
                      letterSpacing: 0.8,
                    ),
                  ),
                  const SizedBox(height: 12),

                  _buildCommandShortcutTile(
                    context,
                    title: 'Leave Approvals Desk',
                    description: 'Review and approve/reject staff leave requests',
                    icon: Icons.event_available_rounded,
                    color: Colors.amber,
                    badgeCount: pendingLeavesCount,
                    onTap: () => context.push('/admin/leaves'),
                  ),
                  const SizedBox(height: 10),

                  _buildCommandShortcutTile(
                    context,
                    title: 'Company Staff Directory',
                    description: 'Full employee roster, roles, designations & BU units',
                    icon: Icons.people_alt_rounded,
                    color: Colors.blue,
                    onTap: () => context.push('/admin/employees'),
                  ),
                  const SizedBox(height: 10),

                  _buildCommandShortcutTile(
                    context,
                    title: 'Invoices & Client Billing',
                    description: 'Track client receivables, paid and overdue bills',
                    icon: Icons.receipt_long_rounded,
                    color: AppColors.emerald,
                    onTap: () => context.push('/admin/invoices'),
                  ),
                  const SizedBox(height: 10),

                  _buildCommandShortcutTile(
                    context,
                    title: 'Customer Support Tickets',
                    description: 'Enterprise ticket queues, customer SLA resolution',
                    icon: Icons.confirmation_number_rounded,
                    color: Colors.orange,
                    badgeCount: openTicketsCount,
                    onTap: () => context.push('/admin/tickets'),
                  ),
                  const SizedBox(height: 10),

                  _buildCommandShortcutTile(
                    context,
                    title: 'Daily Attendance Roster',
                    description: 'Today’s employee clock-in log, late flags & hours',
                    icon: Icons.calendar_today_rounded,
                    color: Colors.teal,
                    onTap: () => context.push('/admin/attendance-roster'),
                  ),
                  const SizedBox(height: 24),
                ],
              ),
            ),
    );
  }

  Widget _buildWhiteMiniMetric(String label, String value) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: const TextStyle(color: Colors.white60, fontSize: 10, fontWeight: FontWeight.bold)),
        const SizedBox(height: 2),
        Text(value, style: const TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.w800)),
      ],
    );
  }

  Widget _buildMetricTile(
    BuildContext context, {
    required String title,
    required String value,
    required String subtitle,
    required IconData icon,
    required Color color,
    required VoidCallback onTap,
  }) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(16),
      child: Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: isDark ? AppColors.surfaceDark : AppColors.surfaceLight,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color: isDark ? AppColors.borderDark : AppColors.borderLight,
          ),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  title,
                  style: TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.w600,
                    color: isDark ? AppColors.textSecondaryDark : AppColors.textSecondaryLight,
                  ),
                ),
                Container(
                  padding: const EdgeInsets.all(5),
                  decoration: BoxDecoration(
                    color: color.withValues(alpha: 0.12),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Icon(icon, color: color, size: 16),
                ),
              ],
            ),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  value,
                  style: const TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.w900,
                  ),
                ),
                Text(
                  subtitle,
                  style: TextStyle(
                    fontSize: 10,
                    color: isDark ? AppColors.textMutedDark : AppColors.textMutedLight,
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildCommandShortcutTile(
    BuildContext context, {
    required String title,
    required String description,
    required IconData icon,
    required Color color,
    int? badgeCount,
    required VoidCallback onTap,
  }) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(16),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        decoration: BoxDecoration(
          color: isDark ? AppColors.surfaceDark : AppColors.surfaceLight,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color: isDark ? AppColors.borderDark : AppColors.borderLight,
          ),
        ),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: color.withValues(alpha: 0.12),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Icon(icon, color: color, size: 22),
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Text(
                        title,
                        style: const TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      if (badgeCount != null && badgeCount > 0) ...[
                        const SizedBox(width: 8),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 1),
                          decoration: BoxDecoration(
                            color: Colors.redAccent,
                            borderRadius: BorderRadius.circular(10),
                          ),
                          child: Text(
                            '$badgeCount',
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 10,
                              fontWeight: FontWeight.w900,
                            ),
                          ),
                        ),
                      ],
                    ],
                  ),
                  const SizedBox(height: 2),
                  Text(
                    description,
                    style: TextStyle(
                      fontSize: 11,
                      color: isDark ? AppColors.textSecondaryDark : AppColors.textSecondaryLight,
                    ),
                  ),
                ],
              ),
            ),
            const Icon(Icons.chevron_right_rounded, color: Colors.grey, size: 20),
          ],
        ),
      ),
    );
  }
}
