import 'package:flutter/material.dart';
import '../../../../app/theme/app_colors.dart';
import 'rental_order_model.dart';

class MaintenanceMetrics {
  final int total;
  final int active;
  final double totalRepairCost;

  const MaintenanceMetrics({
    this.total = 0,
    this.active = 0,
    this.totalRepairCost = 0.0,
  });

  factory MaintenanceMetrics.fromJson(Map<String, dynamic> json) {
    return MaintenanceMetrics(
      total: json['total'] as int? ?? 0,
      active: json['active'] as int? ?? 0,
      totalRepairCost: (json['totalRepairCost'] as num?)?.toDouble() ?? 0.0,
    );
  }
}

class MaintenanceRecordModel {
  final String id;
  final String assetId;
  final String issue;
  final String? repairAction;
  final double cost;
  final String? technician;
  final String status;
  final DateTime loggedAt;
  final DateTime? resolvedAt;
  final RentalAssetModel? asset;

  const MaintenanceRecordModel({
    required this.id,
    required this.assetId,
    required this.issue,
    this.repairAction,
    required this.cost,
    this.technician,
    required this.status,
    required this.loggedAt,
    this.resolvedAt,
    this.asset,
  });

  factory MaintenanceRecordModel.fromJson(Map<String, dynamic> json) {
    return MaintenanceRecordModel(
      id: json['id'] as String? ?? '',
      assetId: json['assetId'] as String? ?? '',
      issue: json['issue'] as String? ?? '',
      repairAction: json['repairAction'] as String?,
      cost: (json['cost'] as num?)?.toDouble() ?? 0.0,
      technician: json['technician'] as String?,
      status: (json['status'] as String? ?? 'IN_PROGRESS').toUpperCase(),
      loggedAt: json['loggedAt'] != null
          ? DateTime.tryParse(json['loggedAt']) ?? DateTime.now()
          : DateTime.now(),
      resolvedAt: json['resolvedAt'] != null ? DateTime.tryParse(json['resolvedAt']) : null,
      asset: json['asset'] != null ? RentalAssetModel.fromJson(json['asset']) : null,
    );
  }

  bool get isResolved => status == 'RESOLVED';

  Color get statusColor {
    switch (status) {
      case 'RESOLVED':
        return AppColors.whatsappGreen;
      case 'IN_PROGRESS':
        return Colors.amber[800]!;
      case 'REPORTED':
        return Colors.blue;
      case 'SCRAPPED':
        return AppColors.priorityHigh;
      default:
        return Colors.grey;
    }
  }
}
