class AdminTicketModel {
  final String id;
  final String ticketNumber;
  final String subject;
  final String clientName;
  final String clientEmail;
  final String? companyName;
  final String priority;
  final String status;
  final String category;
  final DateTime createdAt;

  const AdminTicketModel({
    required this.id,
    required this.ticketNumber,
    required this.subject,
    required this.clientName,
    required this.clientEmail,
    this.companyName,
    required this.priority,
    required this.status,
    required this.category,
    required this.createdAt,
  });

  bool get isOpen => status == 'OPEN';
  bool get isInProgress => status == 'IN_PROGRESS';
  bool get isResolved => status == 'RESOLVED' || status == 'CLOSED';

  factory AdminTicketModel.fromJson(Map<String, dynamic> json) {
    final customer = json['customer'] as Map<String, dynamic>? ?? {};
    final comp = customer['company'] as Map<String, dynamic>? ?? {};

    return AdminTicketModel(
      id: json['id']?.toString() ?? '',
      ticketNumber: json['ticketNumber']?.toString() ?? 'TICK-000',
      subject: json['subject']?.toString() ?? 'Support Request',
      clientName: json['clientName']?.toString() ?? customer['name']?.toString() ?? 'Customer',
      clientEmail: json['clientEmail']?.toString() ?? '',
      companyName: comp['name']?.toString(),
      priority: json['priority']?.toString() ?? 'MEDIUM',
      status: json['status']?.toString() ?? 'OPEN',
      category: json['category']?.toString() ?? 'TECHNICAL',
      createdAt: DateTime.tryParse(json['createdAt']?.toString() ?? '') ?? DateTime.now(),
    );
  }
}
