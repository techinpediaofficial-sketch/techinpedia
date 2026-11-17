class AdminInvoiceModel {
  final String id;
  final String invoiceNumber;
  final String clientName;
  final String clientEmail;
  final String? companyName;
  final double totalAmount;
  final double amountPaid;
  final double balanceDue;
  final String status;
  final DateTime dueDate;
  final DateTime createdAt;

  const AdminInvoiceModel({
    required this.id,
    required this.invoiceNumber,
    required this.clientName,
    required this.clientEmail,
    this.companyName,
    required this.totalAmount,
    required this.amountPaid,
    required this.balanceDue,
    required this.status,
    required this.dueDate,
    required this.createdAt,
  });

  bool get isPaid => status == 'PAID';
  bool get isPending => status == 'PENDING' || status == 'SENT';
  bool get isOverdue => status == 'OVERDUE' || (isPending && dueDate.isBefore(DateTime.now()));

  factory AdminInvoiceModel.fromJson(Map<String, dynamic> json) {
    return AdminInvoiceModel(
      id: json['id']?.toString() ?? '',
      invoiceNumber: json['invoiceNumber']?.toString() ?? 'INV-000',
      clientName: json['clientName']?.toString() ?? 'Client',
      clientEmail: json['clientEmail']?.toString() ?? '',
      companyName: json['companyName']?.toString(),
      totalAmount: (json['totalAmount'] as num?)?.toDouble() ?? 0.0,
      amountPaid: (json['amountPaid'] as num?)?.toDouble() ?? 0.0,
      balanceDue: (json['balanceDue'] as num?)?.toDouble() ?? 0.0,
      status: json['status']?.toString() ?? 'PENDING',
      dueDate: DateTime.tryParse(json['dueDate']?.toString() ?? '') ?? DateTime.now(),
      createdAt: DateTime.tryParse(json['createdAt']?.toString() ?? '') ?? DateTime.now(),
    );
  }
}
