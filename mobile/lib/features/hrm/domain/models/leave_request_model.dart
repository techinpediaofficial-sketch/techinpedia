import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

class LeaveRequestModel {
  final String id;
  final String employeeId;
  final String leaveType; // CASUAL, SICK, PAID, UNPAID, WFH
  final DateTime startDate;
  final DateTime endDate;
  final double daysCount;
  final String reason;
  final String status; // PENDING, APPROVED, REJECTED
  final String? approvedBy;
  final DateTime createdAt;
  final String? employeeName;
  final String? employeeCode;

  const LeaveRequestModel({
    required this.id,
    required this.employeeId,
    required this.leaveType,
    required this.startDate,
    required this.endDate,
    required this.daysCount,
    required this.reason,
    required this.status,
    this.approvedBy,
    required this.createdAt,
    this.employeeName,
    this.employeeCode,
  });

  bool get isPending => status.toUpperCase() == 'PENDING';
  bool get isApproved => status.toUpperCase() == 'APPROVED';
  bool get isRejected => status.toUpperCase() == 'REJECTED';

  String get formattedRange {
    final start = DateFormat('MMM dd, yyyy').format(startDate.toLocal());
    final end = DateFormat('MMM dd, yyyy').format(endDate.toLocal());
    if (start == end) return start;
    return '$start — $end';
  }

  Color get statusColor {
    switch (status.toUpperCase()) {
      case 'APPROVED':
        return const Color(0xFF10B981); // Emerald
      case 'PENDING':
        return const Color(0xFFF59E0B); // Amber
      case 'REJECTED':
        return const Color(0xFFEF4444); // Red
      default:
        return const Color(0xFF6B7280);
    }
  }

  factory LeaveRequestModel.fromJson(Map<String, dynamic> json) {
    final emp = json['employee'] as Map<String, dynamic>?;

    return LeaveRequestModel(
      id: json['id']?.toString() ?? '',
      employeeId: json['employeeId']?.toString() ?? emp?['id']?.toString() ?? '',
      leaveType: json['leaveType']?.toString() ?? 'CASUAL',
      startDate: DateTime.tryParse(json['startDate']?.toString() ?? '') ?? DateTime.now(),
      endDate: DateTime.tryParse(json['endDate']?.toString() ?? '') ?? DateTime.now(),
      daysCount: (json['daysCount'] as num?)?.toDouble() ?? 1.0,
      reason: json['reason']?.toString() ?? '',
      status: json['status']?.toString() ?? 'PENDING',
      approvedBy: json['approvedBy']?.toString(),
      createdAt: DateTime.tryParse(json['createdAt']?.toString() ?? '') ?? DateTime.now(),
      employeeName: emp?['name']?.toString(),
      employeeCode: emp?['employeeCode']?.toString(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'employeeId': employeeId,
      'leaveType': leaveType,
      'startDate': startDate.toIso8601String(),
      'endDate': endDate.toIso8601String(),
      'daysCount': daysCount,
      'reason': reason,
      'status': status,
      'approvedBy': approvedBy,
      'createdAt': createdAt.toIso8601String(),
      'employeeName': employeeName,
      'employeeCode': employeeCode,
    };
  }
}
