import 'package:flutter/material.dart';

class LeadModel {
  final String id;
  final String name;
  final String email;
  final String phone;
  final String? company;
  final String? service;
  final String status; // NEW, CONTACTED, QUALIFIED, PROPOSAL_SENT, NEGOTIATION, WON, LOST
  final int score;
  final String? budget;
  final double? estimatedValue;
  final String temperature; // HOT, WARM, COLD
  final String? assignedUserName;
  final DateTime createdAt;
  final int notesCount;
  final String? businessUnitId;

  const LeadModel({
    required this.id,
    required this.name,
    required this.email,
    required this.phone,
    this.company,
    this.service,
    this.status = 'NEW',
    this.score = 50,
    this.budget,
    this.estimatedValue,
    this.temperature = 'WARM',
    this.assignedUserName,
    required this.createdAt,
    this.notesCount = 0,
    this.businessUnitId,
  });

  String get displayName => name.isNotEmpty ? name : phone;

  Color get temperatureColor {
    switch (temperature.toUpperCase()) {
      case 'HOT':
        return const Color(0xFFEF4444); // Red
      case 'WARM':
        return const Color(0xFFF59E0B); // Amber
      case 'COLD':
      default:
        return const Color(0xFF3B82F6); // Blue
    }
  }

  Color get statusColor {
    switch (status.toUpperCase()) {
      case 'WON':
        return const Color(0xFF10B981); // Emerald Green
      case 'LOST':
        return const Color(0xFF64748B); // Slate Gray
      case 'NEGOTIATION':
      case 'PROPOSAL_SENT':
        return const Color(0xFF8B5CF6); // Purple
      case 'QUALIFIED':
        return const Color(0xFF3B82F6); // Blue
      case 'CONTACTED':
        return const Color(0xFF06B6D4); // Cyan
      case 'NEW':
      default:
        return const Color(0xFFF59E0B); // Amber
    }
  }

  String get statusLabel {
    switch (status.toUpperCase()) {
      case 'PROPOSAL_SENT':
        return 'Proposal Sent';
      case 'NEW':
        return 'New Lead';
      case 'CONTACTED':
        return 'Contacted';
      case 'QUALIFIED':
        return 'Qualified';
      case 'NEGOTIATION':
        return 'Negotiation';
      case 'WON':
        return 'Won';
      case 'LOST':
        return 'Lost';
      default:
        return status;
    }
  }

  factory LeadModel.fromJson(Map<String, dynamic> json) {
    DateTime parseDate(dynamic val) {
      if (val == null) return DateTime.now();
      try {
        return DateTime.parse(val.toString());
      } catch (_) {
        return DateTime.now();
      }
    }

    String? assignedName;
    if (json['assignedUser'] is Map<String, dynamic>) {
      assignedName = json['assignedUser']['name']?.toString();
    } else if (json['assignedEmployee'] is Map<String, dynamic>) {
      assignedName = json['assignedEmployee']['name']?.toString();
    }

    double? parseValue(dynamic val) {
      if (val == null) return null;
      if (val is num) return val.toDouble();
      return double.tryParse(val.toString());
    }

    int notes = 0;
    if (json['notes'] is List) {
      notes = (json['notes'] as List).length;
    } else if (json['_count'] is Map && json['_count']['notes'] != null) {
      notes = (json['_count']['notes'] as num).toInt();
    }

    return LeadModel(
      id: json['id']?.toString() ?? '',
      name: json['name']?.toString() ?? 'Lead',
      email: json['email']?.toString() ?? '',
      phone: json['phone']?.toString() ?? '',
      company: json['company']?.toString(),
      service: json['service']?.toString(),
      status: json['status']?.toString() ?? 'NEW',
      score: (json['score'] as num?)?.toInt() ?? 50,
      budget: json['budget']?.toString(),
      estimatedValue: parseValue(json['estimatedValue']),
      temperature: json['temperature']?.toString() ?? 'WARM',
      assignedUserName: assignedName,
      createdAt: parseDate(json['createdAt']),
      notesCount: notes,
      businessUnitId: json['businessUnitId']?.toString(),
    );
  }

  LeadModel copyWith({
    String? status,
    int? score,
    double? estimatedValue,
    String? temperature,
    String? assignedUserName,
    int? notesCount,
  }) {
    return LeadModel(
      id: id,
      name: name,
      email: email,
      phone: phone,
      company: company,
      service: service,
      status: status ?? this.status,
      score: score ?? this.score,
      budget: budget,
      estimatedValue: estimatedValue ?? this.estimatedValue,
      temperature: temperature ?? this.temperature,
      assignedUserName: assignedUserName ?? this.assignedUserName,
      createdAt: createdAt,
      notesCount: notesCount ?? this.notesCount,
      businessUnitId: businessUnitId,
    );
  }
}
