import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

class AttendancePunchModel {
  final String punchState; // NOT_CHECKED_IN, CHECKED_IN, CHECKED_OUT, NOT_REGISTERED_EMPLOYEE
  final String? employeeId;
  final DateTime? checkIn;
  final DateTime? checkOut;
  final double totalHours;
  final int workMinutes;
  final String status; // PRESENT, LATE, HALF_DAY, ABSENT, ON_LEAVE, HOLIDAY
  final bool isLate;
  final bool isEarlyExit;
  final String? notes;

  const AttendancePunchModel({
    required this.punchState,
    this.employeeId,
    this.checkIn,
    this.checkOut,
    this.totalHours = 0.0,
    this.workMinutes = 0,
    this.status = 'PRESENT',
    this.isLate = false,
    this.isEarlyExit = false,
    this.notes,
  });

  bool get isCheckedIn => punchState == 'CHECKED_IN';
  bool get isCheckedOut => punchState == 'CHECKED_OUT';
  bool get isNotCheckedIn => punchState == 'NOT_CHECKED_IN';

  String get formattedCheckIn {
    if (checkIn == null) return '--:--';
    return DateFormat('hh:mm a').format(checkIn!.toLocal());
  }

  String get formattedCheckOut {
    if (checkOut == null) return '--:--';
    return DateFormat('hh:mm a').format(checkOut!.toLocal());
  }

  String get formattedDuration {
    final hrs = workMinutes ~/ 60;
    final mins = workMinutes % 60;
    if (hrs > 0) {
      return '${hrs}h ${mins.toString().padLeft(2, '0')}m';
    }
    return '${mins}m';
  }

  Color get statusColor {
    switch (status.toUpperCase()) {
      case 'PRESENT':
        return const Color(0xFF10B981); // Emerald
      case 'LATE':
        return const Color(0xFFF59E0B); // Amber
      case 'HALF_DAY':
        return const Color(0xFFF97316); // Orange
      case 'ON_LEAVE':
        return const Color(0xFF3B82F6); // Blue
      case 'ABSENT':
        return const Color(0xFFEF4444); // Red
      default:
        return const Color(0xFF6B7280);
    }
  }

  factory AttendancePunchModel.fromJson(Map<String, dynamic> json) {
    final record = json['record'] as Map<String, dynamic>?;
    final state = json['punchState']?.toString() ?? 'NOT_CHECKED_IN';

    DateTime? checkInDate;
    DateTime? checkOutDate;
    if (record?['checkIn'] != null) {
      checkInDate = DateTime.tryParse(record!['checkIn'].toString());
    }
    if (record?['checkOut'] != null) {
      checkOutDate = DateTime.tryParse(record!['checkOut'].toString());
    }

    return AttendancePunchModel(
      punchState: state,
      employeeId: json['employeeId']?.toString() ?? record?['employeeId']?.toString(),
      checkIn: checkInDate,
      checkOut: checkOutDate,
      totalHours: (record?['totalHours'] as num?)?.toDouble() ?? 0.0,
      workMinutes: (record?['workMinutes'] as num?)?.toInt() ?? 0,
      status: record?['status']?.toString() ?? (state == 'NOT_CHECKED_IN' ? 'ABSENT' : 'PRESENT'),
      isLate: record?['isLate'] == true,
      isEarlyExit: record?['isEarlyExit'] == true,
      notes: record?['notes']?.toString(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'punchState': punchState,
      'employeeId': employeeId,
      'checkIn': checkIn?.toIso8601String(),
      'checkOut': checkOut?.toIso8601String(),
      'totalHours': totalHours,
      'workMinutes': workMinutes,
      'status': status,
      'isLate': isLate,
      'isEarlyExit': isEarlyExit,
      'notes': notes,
    };
  }
}

