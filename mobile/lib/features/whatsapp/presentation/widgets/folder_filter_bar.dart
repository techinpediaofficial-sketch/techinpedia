import 'package:flutter/material.dart';
import '../../../../app/theme/app_colors.dart';
import '../../domain/models/folder_metrics_model.dart';

class FolderFilterBar extends StatelessWidget {
  final String selectedFolder;
  final FolderMetricsModel metrics;
  final ValueChanged<String> onFolderSelected;

  const FolderFilterBar({
    super.key,
    required this.selectedFolder,
    required this.metrics,
    required this.onFolderSelected,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    final folders = [
      {'key': 'ALL', 'label': 'All', 'count': metrics.total},
      {'key': 'UNREAD', 'label': 'Unread', 'count': metrics.unread},
      {'key': 'MINE', 'label': 'Mine', 'count': metrics.mine},
      {'key': 'OPEN', 'label': 'Open', 'count': metrics.open},
      {'key': 'CLOSED', 'label': 'Closed', 'count': metrics.closed},
      if (metrics.unassigned > 0)
        {'key': 'UNASSIGNED', 'label': 'Unassigned', 'count': metrics.unassigned},
    ];

    return SizedBox(
      height: 44,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 16.0),
        itemCount: folders.length,
        separatorBuilder: (context, index) => const SizedBox(width: 8),
        itemBuilder: (context, index) {
          final item = folders[index];
          final key = item['key'] as String;
          final label = item['label'] as String;
          final count = item['count'] as int;
          final isSelected = selectedFolder == key;

          return FilterChip(
            selected: isSelected,
            showCheckmark: false,
            label: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  label,
                  style: TextStyle(
                    fontSize: 13,
                    fontWeight: isSelected ? FontWeight.bold : FontWeight.w500,
                    color: isSelected
                        ? Colors.white
                        : (isDark ? AppColors.textSecondaryDark : AppColors.textSecondaryLight),
                  ),
                ),
                if (count > 0) ...[
                  const SizedBox(width: 6),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 1.5),
                    decoration: BoxDecoration(
                      color: isSelected
                          ? Colors.white.withValues(alpha: 0.25)
                          : (key == 'UNREAD'
                              ? AppColors.whatsappGreen.withValues(alpha: 0.15)
                              : (isDark ? AppColors.borderDark : AppColors.borderLight)),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: Text(
                      count > 99 ? '99+' : '$count',
                      style: TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.bold,
                        color: isSelected
                            ? Colors.white
                            : (key == 'UNREAD'
                                ? AppColors.whatsappGreen
                                : (isDark ? AppColors.textPrimaryDark : AppColors.textPrimaryLight)),
                      ),
                    ),
                  ),
                ],
              ],
            ),
            backgroundColor: isDark ? AppColors.surfaceDark : Colors.white,
            selectedColor: AppColors.primary,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(20),
              side: BorderSide(
                color: isSelected
                    ? AppColors.primary
                    : (isDark ? AppColors.borderDark : AppColors.borderLight),
              ),
            ),
            onSelected: (_) => onFolderSelected(key),
          );
        },
      ),
    );
  }
}
