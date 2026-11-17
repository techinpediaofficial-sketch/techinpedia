import 'package:flutter/material.dart';
import '../../../../app/theme/app_colors.dart';

class RentalAssetModel {
  final String id;
  final String assetCode;
  final String serialNumber;
  final String assetType;
  final String brand;
  final String model;
  final String? specs;
  final String status;
  final String? location;

  const RentalAssetModel({
    required this.id,
    required this.assetCode,
    required this.serialNumber,
    required this.assetType,
    required this.brand,
    required this.model,
    this.specs,
    required this.status,
    this.location,
  });

  factory RentalAssetModel.fromJson(Map<String, dynamic> json) {
    return RentalAssetModel(
      id: json['id'] as String? ?? '',
      assetCode: json['assetCode'] as String? ?? 'N/A',
      serialNumber: json['serialNumber'] as String? ?? 'N/A',
      assetType: json['assetType'] as String? ?? 'DEVICE',
      brand: json['brand'] as String? ?? '',
      model: json['model'] as String? ?? '',
      specs: json['specs'] as String?,
      status: json['status'] as String? ?? 'AVAILABLE',
      location: json['location'] as String?,
    );
  }

  String get displayName => '$brand $model'.trim().isNotEmpty ? '$brand $model'.trim() : assetCode;
}

class RentalOrderItemModel {
  final String id;
  final String rentalOrderId;
  final String assetId;
  final double rate;
  final DateTime? returnedAt;
  final RentalAssetModel? asset;

  const RentalOrderItemModel({
    required this.id,
    required this.rentalOrderId,
    required this.assetId,
    required this.rate,
    this.returnedAt,
    this.asset,
  });

  factory RentalOrderItemModel.fromJson(Map<String, dynamic> json) {
    return RentalOrderItemModel(
      id: json['id'] as String? ?? '',
      rentalOrderId: json['rentalOrderId'] as String? ?? '',
      assetId: json['assetId'] as String? ?? '',
      rate: (json['rate'] as num?)?.toDouble() ?? 0.0,
      returnedAt: json['returnedAt'] != null ? DateTime.tryParse(json['returnedAt']) : null,
      asset: json['asset'] != null ? RentalAssetModel.fromJson(json['asset']) : null,
    );
  }

  bool get isReturned => returnedAt != null;
}

class RentalCustomerModel {
  final String id;
  final String name;
  final String? companyName;
  final String email;
  final String? phone;
  final String? notes;

  const RentalCustomerModel({
    required this.id,
    required this.name,
    this.companyName,
    required this.email,
    this.phone,
    this.notes,
  });

  factory RentalCustomerModel.fromJson(Map<String, dynamic> json) {
    String? companyName;
    if (json['company'] is Map) {
      companyName = json['company']['name'] as String?;
    }

    return RentalCustomerModel(
      id: json['id'] as String? ?? '',
      name: json['name'] as String? ?? 'Unknown Customer',
      companyName: companyName,
      email: json['email'] as String? ?? '',
      phone: json['phone'] as String?,
      notes: json['notes'] as String?,
    );
  }

  String get displayTitle => companyName != null && companyName!.isNotEmpty
      ? '$name ($companyName)'
      : name;
}

class RentalOrderMetrics {
  final int total;
  final int active;
  final double monthlyRunrate;
  final double totalDeposits;

  const RentalOrderMetrics({
    this.total = 0,
    this.active = 0,
    this.monthlyRunrate = 0.0,
    this.totalDeposits = 0.0,
  });

  factory RentalOrderMetrics.fromJson(Map<String, dynamic> json) {
    return RentalOrderMetrics(
      total: json['total'] as int? ?? 0,
      active: json['active'] as int? ?? 0,
      monthlyRunrate: (json['monthlyRunrate'] as num?)?.toDouble() ?? 0.0,
      totalDeposits: (json['totalDeposits'] as num?)?.toDouble() ?? 0.0,
    );
  }
}

class RentalOrderModel {
  final String id;
  final String orderNumber;
  final String customerId;
  final DateTime startDate;
  final DateTime? endDate;
  final String billingCycle;
  final double monthlyRate;
  final double securityDeposit;
  final String deliveryAddress;
  final String status;
  final String? agreementRef;
  final RentalCustomerModel? customer;
  final List<RentalOrderItemModel> items;

  const RentalOrderModel({
    required this.id,
    required this.orderNumber,
    required this.customerId,
    required this.startDate,
    this.endDate,
    required this.billingCycle,
    required this.monthlyRate,
    required this.securityDeposit,
    required this.deliveryAddress,
    required this.status,
    this.agreementRef,
    this.customer,
    this.items = const [],
  });

  factory RentalOrderModel.fromJson(Map<String, dynamic> json) {
    final rawItems = json['items'] as List<dynamic>? ?? [];
    final items = rawItems
        .map((item) => RentalOrderItemModel.fromJson(item as Map<String, dynamic>))
        .toList();

    return RentalOrderModel(
      id: json['id'] as String? ?? '',
      orderNumber: json['orderNumber'] as String? ?? 'N/A',
      customerId: json['customerId'] as String? ?? '',
      startDate: json['startDate'] != null
          ? DateTime.tryParse(json['startDate']) ?? DateTime.now()
          : DateTime.now(),
      endDate: json['endDate'] != null ? DateTime.tryParse(json['endDate']) : null,
      billingCycle: json['billingCycle'] as String? ?? 'MONTHLY',
      monthlyRate: (json['monthlyRate'] as num?)?.toDouble() ?? 0.0,
      securityDeposit: (json['securityDeposit'] as num?)?.toDouble() ?? 0.0,
      deliveryAddress: json['deliveryAddress'] as String? ?? '',
      status: (json['status'] as String? ?? 'ACTIVE').toUpperCase(),
      agreementRef: json['agreementRef'] as String?,
      customer: json['customer'] != null
          ? RentalCustomerModel.fromJson(json['customer'] as Map<String, dynamic>)
          : null,
      items: items,
    );
  }

  int get totalUnits => items.isNotEmpty ? items.length : 1;

  bool get isOngoingLease => endDate == null;

  bool get isActive => status == 'ACTIVE';

  bool get isReturned => status == 'RETURNED';

  bool get isSigned =>
      agreementRef != null &&
      (agreementRef!.contains('SIGNATURE') ||
          agreementRef!.contains('SIGNED') ||
          agreementRef!.contains('Accepted') ||
          agreementRef!.contains('Handover confirmed'));

  String get formattedMonthlyRate => '₹${monthlyRate.toStringAsFixed(0)}/mo';

  String get formattedDeposit => '₹${securityDeposit.toStringAsFixed(0)}';

  Color get statusColor {
    switch (status) {
      case 'ACTIVE':
        return AppColors.whatsappGreen;
      case 'PENDING':
        return Colors.amber[800]!;
      case 'RETURNED':
        return Colors.blueGrey;
      case 'CANCELLED':
        return AppColors.priorityHigh;
      default:
        return AppColors.primary;
    }
  }

  RentalOrderModel copyWith({
    String? status,
    String? agreementRef,
  }) {
    return RentalOrderModel(
      id: id,
      orderNumber: orderNumber,
      customerId: customerId,
      startDate: startDate,
      endDate: endDate,
      billingCycle: billingCycle,
      monthlyRate: monthlyRate,
      securityDeposit: securityDeposit,
      deliveryAddress: deliveryAddress,
      status: status ?? this.status,
      agreementRef: agreementRef ?? this.agreementRef,
      customer: customer,
      items: items,
    );
  }
}
