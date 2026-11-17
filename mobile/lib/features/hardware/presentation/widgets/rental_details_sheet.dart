import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../../../../app/theme/app_colors.dart';
import '../../domain/models/rental_order_model.dart';
import 'signature_pad_modal.dart';

class RentalDetailsSheet extends StatefulWidget {
  final RentalOrderModel order;
  final Future<bool> Function(String orderId)? onMarkAsReturned;
  final Future<bool> Function({
    required String orderId,
    required String customerName,
    required String signatureSummary,
  })? onRecordSignature;

  const RentalDetailsSheet({
    super.key,
    required this.order,
    this.onMarkAsReturned,
    this.onRecordSignature,
  });

  static Future<void> show(
    BuildContext context, {
    required RentalOrderModel order,
    Future<bool> Function(String orderId)? onMarkAsReturned,
    Future<bool> Function({
      required String orderId,
      required String customerName,
      required String signatureSummary,
    })? onRecordSignature,
  }) {
    return showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => RentalDetailsSheet(
        order: order,
        onMarkAsReturned: onMarkAsReturned,
        onRecordSignature: onRecordSignature,
      ),
    );
  }

  @override
  State<RentalDetailsSheet> createState() => _RentalDetailsSheetState();
}

class _RentalDetailsSheetState extends State<RentalDetailsSheet> {
  late RentalOrderModel _currentOrder;
  bool _isProcessing = false;

  @override
  void initState() {
    super.initState();
    _currentOrder = widget.order;
  }

  String _formatDate(DateTime? dt) {
    if (dt == null) return 'Ongoing (No expiry)';
    return DateFormat('dd MMM yyyy').format(dt);
  }

  void _handleSignature() {
    final customerName = _currentOrder.customer?.name ?? 'Customer';
    SignaturePadModal.show(
      context,
      orderNumber: _currentOrder.orderNumber,
      customerName: customerName,
      onSignatureSaved: (summary) async {
        if (widget.onRecordSignature != null) {
          setState(() => _isProcessing = true);
          final success = await widget.onRecordSignature!(
            orderId: _currentOrder.id,
            customerName: customerName,
            signatureSummary: summary,
          );
          if (mounted) {
            setState(() {
              _isProcessing = false;
              if (success) {
                _currentOrder = _currentOrder.copyWith(
                  agreementRef:
                      '[HANDOVER ACCEPTED & SIGNED] Customer: $customerName | Ref: $summary',
                );
              }
            });
            if (success) {
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                  content: Text('Handover signature recorded successfully'),
                  backgroundColor: AppColors.whatsappGreen,
                ),
              );
            }
          }
        }
      },
    );
  }

  Future<void> _confirmReturnCheckIn() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Confirm Equipment Return'),
        content: Text(
          'Are you sure you want to check in and mark order ${_currentOrder.orderNumber} as RETURNED? All associated hardware items will be restored to AVAILABLE inventory.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(false),
            child: const Text('Cancel'),
          ),
          FilledButton(
            style: FilledButton.styleFrom(
              backgroundColor: AppColors.whatsappGreen,
            ),
            onPressed: () => Navigator.of(ctx).pop(true),
            child: const Text('Confirm Return'),
          ),
        ],
      ),
    );

    if (confirmed == true && widget.onMarkAsReturned != null) {
      setState(() => _isProcessing = true);
      final success = await widget.onMarkAsReturned!(_currentOrder.id);
      if (mounted) {
        setState(() {
          _isProcessing = false;
          if (success) {
            _currentOrder = _currentOrder.copyWith(status: 'RETURNED');
          }
        });
        if (success) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Order marked as RETURNED. Hardware checked in!'),
              backgroundColor: AppColors.whatsappGreen,
            ),
          );
        }
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    return Container(
      decoration: BoxDecoration(
        color: isDark ? AppColors.surfaceDark : Colors.white,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
      ),
      padding: EdgeInsets.only(
        top: 14,
        left: 20,
        right: 20,
        bottom: 20 + MediaQuery.of(context).viewInsets.bottom,
      ),
      child: SafeArea(
        top: false,
        child: ConstrainedBox(
          constraints: BoxConstraints(
            maxHeight: MediaQuery.of(context).size.height * 0.88,
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Top Notch Handle
              Center(
                child: Container(
                  width: 40,
                  height: 4,
                  decoration: BoxDecoration(
                    color: isDark ? Colors.grey[700] : Colors.grey[300],
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
              ),
              const SizedBox(height: 12),

              // Sheet Header
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Expanded(
                    child: Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.all(8),
                          decoration: BoxDecoration(
                            color: AppColors.primary.withValues(alpha: 0.12),
                            borderRadius: BorderRadius.circular(10),
                          ),
                          child: const Icon(
                            Icons.laptop_chromebook_rounded,
                            color: AppColors.primary,
                            size: 22,
                          ),
                        ),
                        const SizedBox(width: 12),
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              _currentOrder.orderNumber,
                              style: const TextStyle(
                                fontSize: 17,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                            Text(
                              'Hardware Rental Lease',
                              style: TextStyle(
                                fontSize: 12,
                                color: isDark
                                    ? AppColors.textSecondaryDark
                                    : AppColors.textSecondaryLight,
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                    decoration: BoxDecoration(
                      color: _currentOrder.statusColor.withValues(alpha: 0.15),
                      borderRadius: BorderRadius.circular(16),
                    ),
                    child: Text(
                      _currentOrder.status,
                      style: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.bold,
                        color: _currentOrder.statusColor,
                      ),
                    ),
                  ),
                  IconButton(
                    icon: const Icon(Icons.close_rounded),
                    onPressed: () => Navigator.of(context).pop(),
                  ),
                ],
              ),
              const SizedBox(height: 14),

              // Content Body Scrollable
              Expanded(
                child: ListView(
                  children: [
                    // Customer & Contact Information
                    _buildSectionHeader('CLIENT INFORMATION', isDark),
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: isDark ? AppColors.backgroundDark : const Color(0xFFF8FAFC),
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(
                          color: isDark ? AppColors.borderDark : AppColors.borderLight,
                        ),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            _currentOrder.customer?.name ?? 'Unknown Customer',
                            style: const TextStyle(
                              fontSize: 15,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          if (_currentOrder.customer?.companyName != null &&
                              _currentOrder.customer!.companyName!.isNotEmpty) ...[
                            const SizedBox(height: 2),
                            Text(
                              _currentOrder.customer!.companyName!,
                              style: TextStyle(
                                fontSize: 12,
                                color: isDark
                                    ? AppColors.textSecondaryDark
                                    : AppColors.textSecondaryLight,
                              ),
                            ),
                          ],
                          const SizedBox(height: 8),
                          if (_currentOrder.customer?.phone != null) ...[
                            Row(
                              children: [
                                const Icon(Icons.phone_outlined, size: 14),
                                const SizedBox(width: 6),
                                Text(
                                  _currentOrder.customer!.phone!,
                                  style: const TextStyle(fontSize: 13),
                                ),
                              ],
                            ),
                            const SizedBox(height: 4),
                          ],
                          if (_currentOrder.customer?.email != null &&
                              _currentOrder.customer!.email.isNotEmpty) ...[
                            Row(
                              children: [
                                const Icon(Icons.email_outlined, size: 14),
                                const SizedBox(width: 6),
                                Text(
                                  _currentOrder.customer!.email,
                                  style: const TextStyle(fontSize: 13),
                                ),
                              ],
                            ),
                            const SizedBox(height: 4),
                          ],
                          if (_currentOrder.deliveryAddress.isNotEmpty) ...[
                            Row(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                const Icon(Icons.pin_drop_outlined, size: 14),
                                const SizedBox(width: 6),
                                Expanded(
                                  child: Text(
                                    _currentOrder.deliveryAddress,
                                    style: const TextStyle(fontSize: 13),
                                  ),
                                ),
                              ],
                            ),
                          ],
                        ],
                      ),
                    ),
                    const SizedBox(height: 18),

                    // Lease Terms & Financials
                    _buildSectionHeader('LEASE TERMS & BILLING', isDark),
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: isDark ? AppColors.backgroundDark : const Color(0xFFF8FAFC),
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(
                          color: isDark ? AppColors.borderDark : AppColors.borderLight,
                        ),
                      ),
                      child: Column(
                        children: [
                          _buildDetailRow('Start Date', _formatDate(_currentOrder.startDate), isDark),
                          const Divider(height: 14),
                          _buildDetailRow('End Date', _formatDate(_currentOrder.endDate), isDark),
                          const Divider(height: 14),
                          _buildDetailRow('Billing Cycle', _currentOrder.billingCycle, isDark),
                          const Divider(height: 14),
                          _buildDetailRow('Monthly Rent', _currentOrder.formattedMonthlyRate, isDark, isHighlight: true),
                          const Divider(height: 14),
                          _buildDetailRow('Security Deposit', _currentOrder.formattedDeposit, isDark),
                        ],
                      ),
                    ),
                    const SizedBox(height: 18),

                    // Fleet Hardware Assets List
                    _buildSectionHeader(
                      'ASSIGNED HARDWARE ASSETS (${_currentOrder.items.length})',
                      isDark,
                    ),
                    if (_currentOrder.items.isEmpty)
                      Container(
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: isDark ? AppColors.backgroundDark : const Color(0xFFF8FAFC),
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(
                            color: isDark ? AppColors.borderDark : AppColors.borderLight,
                          ),
                        ),
                        child: Center(
                          child: Text(
                            'No hardware serial numbers attached to this order.',
                            style: TextStyle(
                              fontSize: 12,
                              color: isDark
                                  ? AppColors.textSecondaryDark
                                  : AppColors.textSecondaryLight,
                            ),
                          ),
                        ),
                      )
                    else
                      ..._currentOrder.items.map((item) {
                        final asset = item.asset;
                        return Container(
                          margin: const EdgeInsets.only(bottom: 8),
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            color: isDark ? AppColors.backgroundDark : const Color(0xFFF8FAFC),
                            borderRadius: BorderRadius.circular(10),
                            border: Border.all(
                              color: isDark ? AppColors.borderDark : AppColors.borderLight,
                            ),
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: [
                                  Expanded(
                                    child: Text(
                                      asset != null ? asset.displayName : 'Asset ID: ${item.assetId}',
                                      style: const TextStyle(
                                        fontSize: 14,
                                        fontWeight: FontWeight.bold,
                                      ),
                                    ),
                                  ),
                                  Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                    decoration: BoxDecoration(
                                      color: item.isReturned
                                          ? Colors.blueGrey.withValues(alpha: 0.15)
                                          : AppColors.whatsappGreen.withValues(alpha: 0.15),
                                      borderRadius: BorderRadius.circular(4),
                                    ),
                                    child: Text(
                                      item.isReturned ? 'RETURNED' : 'DEPLOYED',
                                      style: TextStyle(
                                        fontSize: 10,
                                        fontWeight: FontWeight.bold,
                                        color: item.isReturned
                                            ? Colors.blueGrey
                                            : AppColors.whatsappGreen,
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                              if (asset != null) ...[
                                const SizedBox(height: 4),
                                Row(
                                  children: [
                                    Text(
                                      'S/N: ${asset.serialNumber}',
                                      style: TextStyle(
                                        fontSize: 12,
                                        fontWeight: FontWeight.w600,
                                        fontFamily: 'monospace',
                                        color: isDark ? Colors.amber[300] : Colors.amber[900],
                                      ),
                                    ),
                                    const SizedBox(width: 8),
                                    Text('•', style: TextStyle(color: Colors.grey[500])),
                                    const SizedBox(width: 8),
                                    Text(
                                      asset.assetCode,
                                      style: TextStyle(
                                        fontSize: 11,
                                        color: isDark ? Colors.grey[400] : Colors.grey[600],
                                      ),
                                    ),
                                  ],
                                ),
                                if (asset.specs != null && asset.specs!.isNotEmpty) ...[
                                  const SizedBox(height: 4),
                                  Text(
                                    asset.specs!,
                                    style: TextStyle(
                                      fontSize: 11,
                                      color: isDark
                                          ? AppColors.textSecondaryDark
                                          : AppColors.textSecondaryLight,
                                    ),
                                  ),
                                ],
                              ],
                            ],
                          ),
                        );
                      }),
                    const SizedBox(height: 18),

                    // Handover & Legal Agreement
                    _buildSectionHeader('PROOF OF DELIVERY & HANDOVER', isDark),
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: isDark ? AppColors.backgroundDark : const Color(0xFFF8FAFC),
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(
                          color: isDark ? AppColors.borderDark : AppColors.borderLight,
                        ),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          if (_currentOrder.isSigned) ...[
                            Row(
                              children: [
                                const Icon(Icons.verified_rounded, color: AppColors.whatsappGreen, size: 18),
                                const SizedBox(width: 8),
                                const Text(
                                  'Delivery Acceptance Signed',
                                  style: TextStyle(
                                    fontWeight: FontWeight.bold,
                                    fontSize: 13,
                                    color: AppColors.whatsappGreen,
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 6),
                            Text(
                              _currentOrder.agreementRef ?? '',
                              style: TextStyle(
                                fontSize: 11,
                                color: isDark
                                    ? AppColors.textSecondaryDark
                                    : AppColors.textSecondaryLight,
                              ),
                            ),
                          ] else ...[
                            Text(
                              'Customer signature has not yet been captured for this shipment.',
                              style: TextStyle(
                                fontSize: 12,
                                color: isDark
                                    ? AppColors.textSecondaryDark
                                    : AppColors.textSecondaryLight,
                              ),
                            ),
                            const SizedBox(height: 10),
                            OutlinedButton.icon(
                              onPressed: _handleSignature,
                              icon: const Icon(Icons.draw_rounded, size: 16),
                              label: const Text('Capture On-Site Signature'),
                              style: OutlinedButton.styleFrom(
                                foregroundColor: AppColors.primary,
                                side: const BorderSide(color: AppColors.primary),
                              ),
                            ),
                          ],
                        ],
                      ),
                    ),
                    const SizedBox(height: 24),
                  ],
                ),
              ),

              // Bottom Actions: Return Check-In
              if (_currentOrder.isActive) ...[
                const SizedBox(height: 10),
                FilledButton.icon(
                  onPressed: _isProcessing ? null : _confirmReturnCheckIn,
                  icon: _isProcessing
                      ? const SizedBox(
                          width: 18,
                          height: 18,
                          child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                        )
                      : const Icon(Icons.inventory_rounded, size: 18),
                  label: Text(_isProcessing ? 'Processing...' : 'Complete Equipment Return (Check-In)'),
                  style: FilledButton.styleFrom(
                    backgroundColor: AppColors.primary,
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                  ),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildSectionHeader(String title, bool isDark) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Text(
        title,
        style: TextStyle(
          fontSize: 11,
          fontWeight: FontWeight.bold,
          letterSpacing: 0.8,
          color: isDark ? AppColors.textMutedDark : AppColors.textMutedLight,
        ),
      ),
    );
  }

  Widget _buildDetailRow(String label, String value, bool isDark, {bool isHighlight = false}) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          label,
          style: TextStyle(
            fontSize: 13,
            color: isDark ? AppColors.textSecondaryDark : AppColors.textSecondaryLight,
          ),
        ),
        Text(
          value,
          style: TextStyle(
            fontSize: 13,
            fontWeight: isHighlight ? FontWeight.bold : FontWeight.w600,
            color: isHighlight
                ? AppColors.primary
                : (isDark ? AppColors.textPrimaryDark : AppColors.textPrimaryLight),
          ),
        ),
      ],
    );
  }
}
