import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

class PayrollModel {
  final int month;
  final int year;
  final double basicSalary;
  final double hra;
  final double specialAllowance;
  final double grossSalary;
  final double taxDeduction;
  final double lossOfPayDeduction;
  final double otherDeductions;
  final double netSalary;
  final String status; // GENERATED, REVIEWED, APPROVED, PAID, ON_HOLD
  final String? paymentMode;
  final DateTime? paymentDate;
  final String? referenceNumber;

  const PayrollModel({
    required this.month,
    required this.year,
    required this.basicSalary,
    this.hra = 0.0,
    this.specialAllowance = 0.0,
    required this.grossSalary,
    this.taxDeduction = 0.0,
    this.lossOfPayDeduction = 0.0,
    this.otherDeductions = 0.0,
    required this.netSalary,
    required this.status,
    this.paymentMode,
    this.paymentDate,
    this.referenceNumber,
  });

  String get monthName {
    final dt = DateTime(year, month);
    return DateFormat('MMMM yyyy').format(dt);
  }

  String get formattedNetSalary {
    final formatter = NumberFormat.currency(locale: 'en_IN', symbol: '₹', decimalDigits: 0);
    return formatter.format(netSalary);
  }

  String get formattedGrossSalary {
    final formatter = NumberFormat.currency(locale: 'en_IN', symbol: '₹', decimalDigits: 0);
    return formatter.format(grossSalary);
  }

  double get totalDeductions => taxDeduction + lossOfPayDeduction + otherDeductions;

  Color get statusColor {
    switch (status.toUpperCase()) {
      case 'PAID':
        return const Color(0xFF10B981); // Emerald
      case 'APPROVED':
        return const Color(0xFF6366F1); // Indigo
      case 'REVIEWED':
      case 'GENERATED':
        return const Color(0xFFF59E0B); // Amber
      default:
        return const Color(0xFF6B7280);
    }
  }

  factory PayrollModel.fromJson(Map<String, dynamic> json) {
    DateTime? payDate;
    if (json['paymentDate'] != null) {
      payDate = DateTime.tryParse(json['paymentDate'].toString());
    }

    final basic = (json['basicSalary'] as num?)?.toDouble() ?? 0.0;
    final hra = (json['hra'] as num?)?.toDouble() ?? 0.0;
    final special = (json['specialAllowance'] as num?)?.toDouble() ?? 0.0;
    final gross = (json['grossSalary'] as num?)?.toDouble() ?? (basic + hra + special);
    final net = (json['netSalary'] as num?)?.toDouble() ?? gross;

    return PayrollModel(
      month: (json['month'] as num?)?.toInt() ?? DateTime.now().month,
      year: (json['year'] as num?)?.toInt() ?? DateTime.now().year,
      basicSalary: basic,
      hra: hra,
      specialAllowance: special,
      grossSalary: gross,
      taxDeduction: (json['taxDeduction'] as num?)?.toDouble() ?? 0.0,
      lossOfPayDeduction: (json['lossOfPayDeduction'] as num?)?.toDouble() ?? 0.0,
      otherDeductions: (json['otherDeductions'] as num?)?.toDouble() ?? 0.0,
      netSalary: net,
      status: json['status']?.toString() ?? 'GENERATED',
      paymentMode: json['paymentMode']?.toString(),
      paymentDate: payDate,
      referenceNumber: json['referenceNumber']?.toString(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'month': month,
      'year': year,
      'basicSalary': basicSalary,
      'hra': hra,
      'specialAllowance': specialAllowance,
      'grossSalary': grossSalary,
      'taxDeduction': taxDeduction,
      'lossOfPayDeduction': lossOfPayDeduction,
      'otherDeductions': otherDeductions,
      'netSalary': netSalary,
      'status': status,
      'paymentMode': paymentMode,
      'paymentDate': paymentDate?.toIso8601String(),
      'referenceNumber': referenceNumber,
    };
  }
}
