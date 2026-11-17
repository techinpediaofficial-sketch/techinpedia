import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../app/theme/app_colors.dart';
import '../controllers/maintenance_controller.dart';
import '../controllers/rental_orders_controller.dart';
import '../widgets/log_maintenance_modal.dart';
import '../widgets/rental_order_card.dart';

class HardwareScreen extends ConsumerStatefulWidget {
  const HardwareScreen({super.key});

  @override
  ConsumerState<HardwareScreen> createState() => _HardwareScreenState();
}

class _HardwareScreenState extends ConsumerState<HardwareScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;
  final _searchController = TextEditingController();
  bool _isSearching = false;

  static const List<String> _leaseStatuses = [
    'ALL',
    'ACTIVE',
    'PENDING',
    'RETURNED',
  ];

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    _searchController.dispose();
    super.dispose();
  }

  void _openLogMaintenanceModal(BuildContext context) {
    final maintenanceState = ref.read(maintenanceControllerProvider);
    final maintenanceNotifier = ref.read(maintenanceControllerProvider.notifier);

    LogMaintenanceModal.show(
      context,
      assets: maintenanceState.availableAssets,
      onSubmit: ({
        required String assetId,
        required String issue,
        required String technician,
        double cost = 0.0,
      }) {
        return maintenanceNotifier.reportMaintenance(
          assetId: assetId,
          issue: issue,
          technician: technician,
          cost: cost,
        );
      },
    );
  }

  void _promptResolveTicket(BuildContext context, String recordId) {
    final actionController = TextEditingController();
    final costController = TextEditingController(text: '0');
    final messenger = ScaffoldMessenger.of(context);

    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Resolve Maintenance Ticket'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(
              controller: actionController,
              decoration: const InputDecoration(
                labelText: 'Resolution / Action Taken',
                hintText: 'e.g. Replaced SSD, re-installed OS',
              ),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: costController,
              keyboardType: TextInputType.number,
              decoration: const InputDecoration(
                labelText: 'Final Repair Cost (₹)',
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(),
            child: const Text('Cancel'),
          ),
          FilledButton(
            style: FilledButton.styleFrom(
              backgroundColor: AppColors.whatsappGreen,
            ),
            onPressed: () async {
              if (actionController.text.trim().isEmpty) return;
              final cost = double.tryParse(costController.text.trim()) ?? 0.0;
              Navigator.of(ctx).pop();
              final success = await ref
                  .read(maintenanceControllerProvider.notifier)
                  .resolveRecord(
                    id: recordId,
                    repairAction: actionController.text.trim(),
                    cost: cost,
                  );
              if (mounted && success) {
                messenger.showSnackBar(
                  const SnackBar(
                    content: Text('Ticket resolved successfully'),
                    backgroundColor: AppColors.whatsappGreen,
                  ),
                );
              }
            },
            child: const Text('Mark Resolved'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final ordersState = ref.watch(rentalOrdersControllerProvider);
    final ordersNotifier = ref.read(rentalOrdersControllerProvider.notifier);
    final maintenanceState = ref.watch(maintenanceControllerProvider);
    final maintenanceNotifier = ref.read(maintenanceControllerProvider.notifier);

    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    return Scaffold(
      appBar: AppBar(
        title: _isSearching
            ? TextField(
                controller: _searchController,
                autofocus: true,
                style: TextStyle(
                  color: isDark ? AppColors.textPrimaryDark : AppColors.textPrimaryLight,
                  fontSize: 16,
                ),
                decoration: InputDecoration(
                  hintText: 'Search order number, client, address...',
                  border: InputBorder.none,
                  enabledBorder: InputBorder.none,
                  focusedBorder: InputBorder.none,
                  hintStyle: TextStyle(
                    color: isDark ? AppColors.textMutedDark : AppColors.textMutedLight,
                  ),
                  suffixIcon: IconButton(
                    icon: const Icon(Icons.clear, size: 20),
                    onPressed: () {
                      _searchController.clear();
                      ordersNotifier.setSearchQuery('');
                      setState(() => _isSearching = false);
                    },
                  ),
                ),
                onChanged: (val) => ordersNotifier.setSearchQuery(val),
              )
            : Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(6),
                    decoration: BoxDecoration(
                      color: AppColors.primary.withValues(alpha: 0.15),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: const Icon(
                      Icons.laptop_chromebook_rounded,
                      color: AppColors.primary,
                      size: 20,
                    ),
                  ),
                  const SizedBox(width: 10),
                  const Text(
                    'Hardware & Fleet',
                    style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18),
                  ),
                ],
              ),
        actions: [
          if (!_isSearching)
            IconButton(
              icon: const Icon(Icons.search_rounded),
              tooltip: 'Search',
              onPressed: () => setState(() => _isSearching = true),
            ),
          IconButton(
            icon: const Icon(Icons.refresh_rounded),
            tooltip: 'Refresh',
            onPressed: () {
              ordersNotifier.refresh();
              maintenanceNotifier.loadRecords();
            },
          ),
        ],
        bottom: TabBar(
          controller: _tabController,
          indicatorColor: AppColors.primary,
          labelColor: AppColors.primary,
          unselectedLabelColor:
              isDark ? AppColors.textMutedDark : AppColors.textMutedLight,
          tabs: [
            Tab(
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Icon(Icons.devices_rounded, size: 16),
                  const SizedBox(width: 6),
                  Text('Rental Leases (${ordersState.orders.length})'),
                ],
              ),
            ),
            Tab(
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Icon(Icons.build_rounded, size: 16),
                  const SizedBox(width: 6),
                  Text('Maintenance (${maintenanceState.records.length})'),
                ],
              ),
            ),
          ],
        ),
      ),
      body: TabBarView(
        controller: _tabController,
        children: [
          // Tab 1: Rental Leases
          _buildRentalLeasesTab(ordersState, ordersNotifier, isDark),

          // Tab 2: Field Maintenance
          _buildMaintenanceTab(maintenanceState, maintenanceNotifier, isDark),
        ],
      ),
      floatingActionButton: _tabController.index == 1
          ? FloatingActionButton.extended(
              onPressed: () => _openLogMaintenanceModal(context),
              icon: const Icon(Icons.add_rounded),
              label: const Text('Log Issue'),
              backgroundColor: AppColors.primary,
              foregroundColor: Colors.white,
            )
          : null,
    );
  }

  Widget _buildRentalLeasesTab(
    RentalOrdersState state,
    RentalOrdersController notifier,
    bool isDark,
  ) {
    return Column(
      children: [
        const SizedBox(height: 10),
        // Metrics Summary Banner
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16),
          child: Row(
            children: [
              _buildMetricCard(
                title: 'ACTIVE LEASES',
                value: '${state.metrics.active}',
                icon: Icons.check_circle_outline_rounded,
                color: AppColors.whatsappGreen,
                isDark: isDark,
              ),
              const SizedBox(width: 8),
              _buildMetricCard(
                title: 'RUNRATE',
                value: '₹${state.metrics.monthlyRunrate.toStringAsFixed(0)}',
                icon: Icons.trending_up_rounded,
                color: AppColors.primary,
                isDark: isDark,
              ),
              const SizedBox(width: 8),
              _buildMetricCard(
                title: 'DEPOSITS',
                value: '₹${state.metrics.totalDeposits.toStringAsFixed(0)}',
                icon: Icons.account_balance_wallet_outlined,
                color: Colors.amber[800]!,
                isDark: isDark,
              ),
            ],
          ),
        ),
        const SizedBox(height: 12),

        // Status Filter Chips
        SizedBox(
          height: 36,
          child: ListView.separated(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: 16),
            itemCount: _leaseStatuses.length,
            separatorBuilder: (context, index) => const SizedBox(width: 8),
            itemBuilder: (context, index) {
              final status = _leaseStatuses[index];
              final isSelected = state.currentStatus == status;
              return FilterChip(
                selected: isSelected,
                showCheckmark: false,
                label: Text(
                  status,
                  style: TextStyle(
                    fontSize: 11,
                    fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                    color: isSelected
                        ? Colors.white
                        : (isDark ? AppColors.textPrimaryDark : AppColors.textPrimaryLight),
                  ),
                ),
                selectedColor: AppColors.primary,
                onSelected: (_) => notifier.setStatusFilter(status),
              );
            },
          ),
        ),
        const SizedBox(height: 8),
        Divider(
          height: 1,
          color: isDark ? AppColors.borderDark : AppColors.borderLight,
        ),

        // Leases List
        Expanded(
          child: _buildOrdersList(state, notifier, isDark),
        ),
      ],
    );
  }

  Widget _buildOrdersList(
    RentalOrdersState state,
    RentalOrdersController notifier,
    bool isDark,
  ) {
    if (state.isLoading) {
      return const Center(child: CircularProgressIndicator());
    }

    if (state.errorMessage != null && state.orders.isEmpty) {
      return RefreshIndicator(
        onRefresh: () => notifier.refresh(),
        child: Center(
          child: SingleChildScrollView(
            physics: const AlwaysScrollableScrollPhysics(),
            padding: const EdgeInsets.all(24),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Icon(Icons.error_outline_rounded, size: 48, color: AppColors.priorityHigh),
                const SizedBox(height: 12),
                const Text('Unable to load rental leases',
                    style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                const SizedBox(height: 6),
                Text(
                  state.errorMessage!,
                  textAlign: TextAlign.center,
                  maxLines: 4,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(fontSize: 13),
                ),
                const SizedBox(height: 16),
                ElevatedButton.icon(
                  onPressed: () => notifier.refresh(),
                  icon: const Icon(Icons.refresh),
                  label: const Text('Retry'),
                ),
              ],
            ),
          ),
        ),
      );
    }

    if (state.orders.isEmpty) {
      return RefreshIndicator(
        onRefresh: () => notifier.refresh(),
        child: ListView(
          physics: const AlwaysScrollableScrollPhysics(),
          children: [
            SizedBox(
              height: MediaQuery.of(context).size.height * 0.45,
              child: Center(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(
                      Icons.devices_other_rounded,
                      size: 56,
                      color: isDark ? AppColors.textMutedDark : AppColors.textMutedLight,
                    ),
                    const SizedBox(height: 12),
                    const Text('No hardware leases found',
                        style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                    const SizedBox(height: 6),
                    Text(
                      state.searchQuery.isNotEmpty
                          ? 'Try changing your search terms'
                          : 'Orders created in admin panel will appear here',
                      style: TextStyle(
                        fontSize: 13,
                        color: isDark ? AppColors.textMutedDark : AppColors.textMutedLight,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      );
    }

    return RefreshIndicator(
      onRefresh: () => notifier.refresh(),
      child: ListView.separated(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        itemCount: state.orders.length,
        separatorBuilder: (context, index) => const SizedBox(height: 10),
        itemBuilder: (context, index) {
          final order = state.orders[index];
          return RentalOrderCard(
            order: order,
            onMarkAsReturned: notifier.markAsReturned,
            onRecordSignature: notifier.recordSignature,
          );
        },
      ),
    );
  }

  Widget _buildMaintenanceTab(
    MaintenanceState state,
    MaintenanceController notifier,
    bool isDark,
  ) {
    if (state.isLoading) {
      return const Center(child: CircularProgressIndicator());
    }

    return RefreshIndicator(
      onRefresh: () => notifier.loadRecords(),
      child: state.records.isEmpty
          ? ListView(
              physics: const AlwaysScrollableScrollPhysics(),
              children: [
                SizedBox(
                  height: MediaQuery.of(context).size.height * 0.45,
                  child: Center(
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(
                          Icons.build_circle_outlined,
                          size: 56,
                          color: isDark ? AppColors.textMutedDark : AppColors.textMutedLight,
                        ),
                        const SizedBox(height: 12),
                        const Text('No maintenance tickets recorded',
                            style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                        const SizedBox(height: 6),
                        Text(
                          'Tap "+ Log Issue" below to record field repair work',
                          style: TextStyle(
                            fontSize: 13,
                            color: isDark ? AppColors.textMutedDark : AppColors.textMutedLight,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            )
          : ListView.separated(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              itemCount: state.records.length,
              separatorBuilder: (context, index) => const SizedBox(height: 10),
              itemBuilder: (context, index) {
                final record = state.records[index];
                return Card(
                  elevation: 0,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(14),
                    side: BorderSide(
                      color: isDark ? AppColors.borderDark : AppColors.borderLight,
                    ),
                  ),
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text(
                              record.asset != null
                                  ? record.asset!.displayName
                                  : 'Asset ID: ${record.assetId}',
                              style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15),
                            ),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                              decoration: BoxDecoration(
                                color: record.statusColor.withValues(alpha: 0.15),
                                borderRadius: BorderRadius.circular(6),
                              ),
                              child: Text(
                                record.status,
                                style: TextStyle(
                                  fontSize: 11,
                                  fontWeight: FontWeight.bold,
                                  color: record.statusColor,
                                ),
                              ),
                            ),
                          ],
                        ),
                        if (record.asset != null) ...[
                          const SizedBox(height: 4),
                          Text(
                            'S/N: ${record.asset!.serialNumber} • ${record.asset!.assetCode}',
                            style: TextStyle(
                              fontSize: 12,
                              color: isDark ? Colors.amber[300] : Colors.amber[900],
                              fontFamily: 'monospace',
                            ),
                          ),
                        ],
                        const SizedBox(height: 8),
                        Text(
                          record.issue,
                          style: const TextStyle(fontSize: 13),
                        ),
                        if (record.repairAction != null && record.repairAction!.isNotEmpty) ...[
                          const SizedBox(height: 6),
                          Container(
                            padding: const EdgeInsets.all(8),
                            decoration: BoxDecoration(
                              color: isDark ? AppColors.backgroundDark : const Color(0xFFF1F5F9),
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: Row(
                              children: [
                                const Icon(Icons.check_circle_outline, size: 14, color: AppColors.whatsappGreen),
                                const SizedBox(width: 6),
                                Expanded(
                                  child: Text(
                                    'Resolution: ${record.repairAction}',
                                    style: const TextStyle(fontSize: 12),
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],
                        const SizedBox(height: 10),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text(
                              'Tech: ${record.technician ?? "Field Ops"} • ₹${record.cost.toStringAsFixed(0)}',
                              style: TextStyle(
                                fontSize: 12,
                                color: isDark ? AppColors.textSecondaryDark : AppColors.textSecondaryLight,
                              ),
                            ),
                            if (!record.isResolved)
                              TextButton.icon(
                                onPressed: () => _promptResolveTicket(context, record.id),
                                icon: const Icon(Icons.done_all_rounded, size: 14),
                                label: const Text('Resolve', style: TextStyle(fontSize: 12)),
                                style: TextButton.styleFrom(
                                  visualDensity: VisualDensity.compact,
                                  foregroundColor: AppColors.whatsappGreen,
                                ),
                              ),
                          ],
                        ),
                      ],
                    ),
                  ),
                );
              },
            ),
    );
  }

  Widget _buildMetricCard({
    required String title,
    required String value,
    required IconData icon,
    required Color color,
    required bool isDark,
  }) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 10),
        decoration: BoxDecoration(
          color: isDark ? AppColors.surfaceDark : AppColors.backgroundLight,
          borderRadius: BorderRadius.circular(10),
          border: Border.all(
            color: isDark ? AppColors.borderDark : AppColors.borderLight,
          ),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(icon, size: 13, color: color),
                const SizedBox(width: 4),
                Text(
                  title,
                  style: TextStyle(
                    fontSize: 9,
                    fontWeight: FontWeight.bold,
                    color: isDark ? AppColors.textMutedDark : AppColors.textMutedLight,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 4),
            Text(
              value,
              style: TextStyle(
                fontSize: 13,
                fontWeight: FontWeight.bold,
                color: isDark ? AppColors.textPrimaryDark : AppColors.textPrimaryLight,
              ),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
          ],
        ),
      ),
    );
  }
}
