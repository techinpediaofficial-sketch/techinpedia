import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../../../app/theme/app_colors.dart';
import '../../domain/models/admin_invoice_model.dart';
import '../controllers/invoices_controller.dart';

class InvoicesScreen extends ConsumerWidget {
  const InvoicesScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(invoicesControllerProvider);
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    final currencyFmt = NumberFormat.currency(locale: 'en_IN', symbol: '₹', decimalDigits: 0);
    final dateFmt = DateFormat('dd MMM yyyy');

    return Scaffold(
      appBar: AppBar(
        title: const Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Invoices & Billing',
              style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18),
            ),
            Text(
              'Receivables & Cash Flow',
              style: TextStyle(fontSize: 12, color: Colors.grey),
            ),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh_rounded),
            tooltip: 'Refresh',
            onPressed: () => ref.read(invoicesControllerProvider.notifier).loadInvoices(),
          ),
        ],
      ),
      body: Column(
        children: [
          // Top Summary Banner
          Container(
            margin: const EdgeInsets.all(16),
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: isDark
                    ? [const Color(0xFF1E293B), const Color(0xFF0F172A)]
                    : [const Color(0xFF3B82F6), const Color(0xFF1D4ED8)],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
              borderRadius: BorderRadius.circular(16),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                _buildSummaryCol('Invoiced', currencyFmt.format(state.totalInvoiced)),
                Container(height: 32, width: 1, color: Colors.white24),
                _buildSummaryCol('Collected', currencyFmt.format(state.totalPaid)),
                Container(height: 32, width: 1, color: Colors.white24),
                _buildSummaryCol('Outstanding', currencyFmt.format(state.totalOutstanding)),
              ],
            ),
          ),

          // Status Filter Chips
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: Row(
              children: [
                _buildStatusChip(ref, 'ALL', 'All Invoices (${state.invoices.length})', state.selectedStatus),
                const SizedBox(width: 8),
                _buildStatusChip(ref, 'PENDING', 'Pending', state.selectedStatus),
                const SizedBox(width: 8),
                _buildStatusChip(ref, 'PAID', 'Paid', state.selectedStatus),
                const SizedBox(width: 8),
                _buildStatusChip(ref, 'OVERDUE', 'Overdue', state.selectedStatus),
              ],
            ),
          ),
          const SizedBox(height: 10),
          const Divider(height: 1),

          // Invoices List
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
                                onPressed: () => ref.read(invoicesControllerProvider.notifier).loadInvoices(),
                                child: const Text('Retry'),
                              ),
                            ],
                          ),
                        ),
                      )
                    : state.invoices.isEmpty
                        ? Center(
                            child: Column(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Icon(
                                  Icons.receipt_long_outlined,
                                  size: 64,
                                  color: isDark ? Colors.white24 : Colors.grey[300],
                                ),
                                const SizedBox(height: 12),
                                Text(
                                  'No invoices found for this filter.',
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
                            onRefresh: () => ref.read(invoicesControllerProvider.notifier).loadInvoices(),
                            child: ListView.separated(
                              padding: const EdgeInsets.all(16),
                              itemCount: state.invoices.length,
                              separatorBuilder: (_, _) => const SizedBox(height: 12),
                              itemBuilder: (context, index) {
                                final inv = state.invoices[index];
                                return _buildInvoiceCard(context, inv, isDark, currencyFmt, dateFmt);
                              },
                            ),
                          ),
          ),
        ],
      ),
    );
  }

  Widget _buildSummaryCol(String label, String value) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: const TextStyle(color: Colors.white70, fontSize: 11, fontWeight: FontWeight.bold),
        ),
        const SizedBox(height: 4),
        Text(
          value,
          style: const TextStyle(color: Colors.white, fontSize: 14, fontWeight: FontWeight.w800),
        ),
      ],
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
        ref.read(invoicesControllerProvider.notifier).setStatus(statusKey);
      },
    );
  }

  Widget _buildInvoiceCard(
    BuildContext context,
    AdminInvoiceModel inv,
    bool isDark,
    NumberFormat currencyFmt,
    DateFormat dateFmt,
  ) {
    Color statusColor;
    IconData statusIcon;
    if (inv.isPaid) {
      statusColor = AppColors.emerald;
      statusIcon = Icons.check_circle_rounded;
    } else if (inv.isOverdue) {
      statusColor = Colors.red;
      statusIcon = Icons.warning_rounded;
    } else {
      statusColor = Colors.amber;
      statusIcon = Icons.schedule_rounded;
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
            // Top: Invoice Number & Status
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(8),
                      decoration: BoxDecoration(
                        color: AppColors.primary.withValues(alpha: 0.12),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: const Icon(Icons.receipt_outlined, color: AppColors.primary, size: 18),
                    ),
                    const SizedBox(width: 10),
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          inv.invoiceNumber,
                          style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 14),
                        ),
                        Text(
                          'Due ${dateFmt.format(inv.dueDate)}',
                          style: TextStyle(
                            fontSize: 11,
                            color: inv.isOverdue ? Colors.red : (isDark ? AppColors.textSecondaryDark : AppColors.textSecondaryLight),
                            fontWeight: inv.isOverdue ? FontWeight.bold : FontWeight.normal,
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: statusColor.withValues(alpha: 0.15),
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: statusColor.withValues(alpha: 0.3)),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(statusIcon, size: 12, color: statusColor),
                      const SizedBox(width: 4),
                      Text(
                        inv.status,
                        style: TextStyle(
                          color: statusColor,
                          fontSize: 11,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),

            const SizedBox(height: 12),

            // Client Info
            Text(
              inv.clientName,
              style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15),
            ),
            if (inv.companyName != null && inv.companyName!.isNotEmpty)
              Text(
                inv.companyName!,
                style: TextStyle(
                  fontSize: 12,
                  color: isDark ? AppColors.textSecondaryDark : AppColors.textSecondaryLight,
                ),
              ),

            const SizedBox(height: 12),
            const Divider(height: 1),
            const SizedBox(height: 12),

            // Amount breakdown
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Total Amount',
                      style: TextStyle(
                        fontSize: 11,
                        color: isDark ? AppColors.textSecondaryDark : AppColors.textSecondaryLight,
                      ),
                    ),
                    Text(
                      currencyFmt.format(inv.totalAmount),
                      style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w700),
                    ),
                  ],
                ),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Paid',
                      style: TextStyle(
                        fontSize: 11,
                        color: isDark ? AppColors.textSecondaryDark : AppColors.textSecondaryLight,
                      ),
                    ),
                    Text(
                      currencyFmt.format(inv.amountPaid),
                      style: const TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w700,
                        color: AppColors.emerald,
                      ),
                    ),
                  ],
                ),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    Text(
                      'Balance Due',
                      style: TextStyle(
                        fontSize: 11,
                        color: isDark ? AppColors.textSecondaryDark : AppColors.textSecondaryLight,
                      ),
                    ),
                    Text(
                      currencyFmt.format(inv.balanceDue),
                      style: TextStyle(
                        fontSize: 15,
                        fontWeight: FontWeight.w900,
                        color: inv.balanceDue > 0 ? (inv.isOverdue ? Colors.red : Colors.orange) : AppColors.emerald,
                      ),
                    ),
                  ],
                ),
              ],
            ),

            // Contact Client if balance is due
            if (inv.balanceDue > 0 && inv.clientEmail.isNotEmpty) ...[
              const SizedBox(height: 12),
              SizedBox(
                width: double.infinity,
                child: FilledButton.tonalIcon(
                  style: FilledButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: 8),
                    visualDensity: VisualDensity.compact,
                  ),
                  icon: const Icon(Icons.send_rounded, size: 15),
                  label: const Text('Send Reminder Email', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                  onPressed: () {
                    final subject = Uri.encodeComponent('Payment Reminder: Invoice ${inv.invoiceNumber}');
                    final body = Uri.encodeComponent(
                      'Dear ${inv.clientName},\n\nThis is a polite reminder regarding pending Invoice ${inv.invoiceNumber} with outstanding balance of ${currencyFmt.format(inv.balanceDue)} due on ${dateFmt.format(inv.dueDate)}.\n\nThank you,\nTechInPedia Accounts Team',
                    );
                    final uri = Uri.parse('mailto:${inv.clientEmail}?subject=$subject&body=$body');
                    launchUrl(uri);
                  },
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}
