import 'package:flutter/material.dart';
import '../../domain/models/leave_balance_model.dart';

class LeaveBalanceGrid extends StatelessWidget {
  final List<LeaveBalanceModel> balances;

  const LeaveBalanceGrid({super.key, required this.balances});

  @override
  Widget build(BuildContext context) {
    if (balances.isEmpty) {
      return const SizedBox.shrink();
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Padding(
          padding: EdgeInsets.symmetric(horizontal: 4, vertical: 8),
          child: Text(
            'Leave Balances (Annual Quota)',
            style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
          ),
        ),
        GridView.builder(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
            crossAxisCount: 2,
            crossAxisSpacing: 12,
            mainAxisSpacing: 12,
            childAspectRatio: 1.6,
          ),
          itemCount: balances.length,
          itemBuilder: (context, index) {
            final b = balances[index];
            return _BalanceCard(balance: b);
          },
        ),
      ],
    );
  }
}

class _BalanceCard extends StatelessWidget {
  final LeaveBalanceModel balance;

  const _BalanceCard({required this.balance});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final total = balance.totalAllocated + balance.carriedForward;
    final progress = total > 0 ? (balance.available / total).clamp(0.0, 1.0) : 0.0;

    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: theme.colorScheme.surface,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: balance.color.withValues(alpha: 0.2)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.02),
            blurRadius: 6,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                balance.displayName,
                style: TextStyle(
                  fontSize: 11,
                  fontWeight: FontWeight.w600,
                  color: theme.colorScheme.onSurfaceVariant,
                ),
              ),
              Container(
                width: 8,
                height: 8,
                decoration: BoxDecoration(
                  color: balance.color,
                  shape: BoxShape.circle,
                ),
              ),
            ],
          ),
          Row(
            crossAxisAlignment: CrossAxisAlignment.baseline,
            textBaseline: TextBaseline.alphabetic,
            children: [
              Text(
                balance.available.toStringAsFixed(balance.available % 1 == 0 ? 0 : 1),
                style: TextStyle(
                  fontSize: 22,
                  fontWeight: FontWeight.w900,
                  color: balance.color,
                ),
              ),
              const SizedBox(width: 4),
              Text(
                '/ ${total.toStringAsFixed(total % 1 == 0 ? 0 : 1)} days',
                style: TextStyle(
                  fontSize: 11,
                  color: theme.colorScheme.onSurfaceVariant,
                ),
              ),
            ],
          ),
          ClipRRect(
            borderRadius: BorderRadius.circular(4),
            child: LinearProgressIndicator(
              value: progress,
              backgroundColor: balance.color.withValues(alpha: 0.12),
              valueColor: AlwaysStoppedAnimation<Color>(balance.color),
              minHeight: 4,
            ),
          ),
        ],
      ),
    );
  }
}
