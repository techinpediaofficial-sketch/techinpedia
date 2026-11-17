import 'package:flutter/material.dart';

class LeaveBalanceModel {
  final String leaveType; // CASUAL, SICK, PAID, UNPAID
  final int year;
  final double totalAllocated;
  final double used;
  final double pending;
  final double carriedForward;

  const LeaveBalanceModel({
    required this.leaveType,
    required this.year,
    required this.totalAllocated,
    this.used = 0.0,
    this.pending = 0.0,
    this.carriedForward = 0.0,
  });

  double get available {
    final rem = totalAllocated + carriedForward - used - pending;
    return rem < 0 ? 0.0 : rem;
  }

  String get displayName {
    switch (leaveType.toUpperCase()) {
      case 'CASUAL':
        return 'Casual Leave';
      case 'SICK':
        return 'Sick Leave';
      case 'PAID':
        return 'Earned / Paid Leave';
      case 'UNPAID':
        return 'Loss of Pay (LWP)';
      default:
        return leaveType;
    }
  }

  Color get color {
    switch (leaveType.toUpperCase()) {
      case 'CASUAL':
        return const Color(0xFF6366F1); // Indigo
      case 'SICK':
        return const Color(0xFFEC4899); // Pink
      case 'PAID':
        return const Color(0xFF10B981); // Emerald
      case 'UNPAID':
        return const Color(0xFFF59E0B); // Amber
      default:
        return const Color(0xFF6B7280);
    }
  }

  factory LeaveBalanceModel.fromJson(Map<String, dynamic> json) {
    return LeaveBalanceModel(
      leaveType: json['leaveType']?.toString() ?? 'CASUAL',
      year: (json['year'] as num?)?.toInt() ?? DateTime.now().year,
      totalAllocated: (json['totalAllocated'] as num?)?.toDouble() ?? 0.0,
      used: (json['used'] as num?)?.toDouble() ?? 0.0,
      pending: (json['pending'] as num?)?.toDouble() ?? 0.0,
      carriedForward: (json['carriedForward'] as num?)?.toDouble() ?? 0.0,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'leaveType': leaveType,
      'year': year,
      'totalAllocated': totalAllocated,
      'used': used,
      'pending': pending,
      'carriedForward': carriedForward,
      'available': available,
    };
  }
}
