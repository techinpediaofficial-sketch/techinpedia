class WhatsAppConversationModel {
  final String id;
  final String? companyId;
  final String waNumber;
  final String customerName;
  final String? contactId;
  final String? leadId;
  final String? customerId;
  final String? assignedUserId;
  final String? assignedTeam;
  final String status;
  final String priority;
  final int unreadCount;
  final String? lastMessageText;
  final String? lastMessageSender;
  final DateTime? lastMessageAt;
  final DateTime? lastCustomerActivityAt;
  final bool is24hWindowActive;
  final String? assignedUserName;

  const WhatsAppConversationModel({
    required this.id,
    this.companyId,
    required this.waNumber,
    required this.customerName,
    this.contactId,
    this.leadId,
    this.customerId,
    this.assignedUserId,
    this.assignedTeam,
    this.status = 'OPEN',
    this.priority = 'MEDIUM',
    this.unreadCount = 0,
    this.lastMessageText,
    this.lastMessageSender,
    this.lastMessageAt,
    this.lastCustomerActivityAt,
    this.is24hWindowActive = false,
    this.assignedUserName,
  });

  bool get isOpen => status == 'OPEN';
  bool get isHighPriority => priority == 'HIGH' || priority == 'URGENT';
  bool get hasUnread => unreadCount > 0;
  String get displayName => customerName.isNotEmpty ? customerName : waNumber;
  DateTime? get updatedAt => lastMessageAt ?? lastCustomerActivityAt;

  factory WhatsAppConversationModel.fromJson(Map<String, dynamic> json) {
    DateTime? parseDate(dynamic val) {
      if (val == null) return null;
      try {
        return DateTime.parse(val.toString());
      } catch (_) {
        return null;
      }
    }

    String? assignedName;
    if (json['assignedUser'] is Map<String, dynamic>) {
      assignedName = json['assignedUser']['name']?.toString();
    }

    return WhatsAppConversationModel(
      id: json['id']?.toString() ?? '',
      companyId: json['companyId']?.toString(),
      waNumber: json['waNumber']?.toString() ?? '',
      customerName: json['customerName']?.toString() ?? 'Customer',
      contactId: json['contactId']?.toString(),
      leadId: json['leadId']?.toString(),
      customerId: json['customerId']?.toString(),
      assignedUserId: json['assignedUserId']?.toString(),
      assignedTeam: json['assignedTeam']?.toString(),
      status: json['status']?.toString() ?? 'OPEN',
      priority: json['priority']?.toString() ?? 'MEDIUM',
      unreadCount: (json['unreadCount'] as num?)?.toInt() ?? 0,
      lastMessageText: json['lastMessageText']?.toString(),
      lastMessageSender: json['lastMessageSender']?.toString(),
      lastMessageAt: parseDate(json['lastMessageAt'] ?? json['updatedAt']),
      lastCustomerActivityAt: parseDate(json['lastCustomerActivityAt']),
      is24hWindowActive: json['is24hWindowActive'] == true,
      assignedUserName: assignedName,
    );
  }

  WhatsAppConversationModel copyWith({
    String? assignedUserId,
    String? assignedUserName,
    String? status,
    String? priority,
    int? unreadCount,
    String? lastMessageText,
    String? lastMessageSender,
    DateTime? lastMessageAt,
  }) {
    return WhatsAppConversationModel(
      id: id,
      companyId: companyId,
      waNumber: waNumber,
      customerName: customerName,
      contactId: contactId,
      leadId: leadId,
      customerId: customerId,
      assignedUserId: assignedUserId ?? this.assignedUserId,
      assignedTeam: assignedTeam,
      status: status ?? this.status,
      priority: priority ?? this.priority,
      unreadCount: unreadCount ?? this.unreadCount,
      lastMessageText: lastMessageText ?? this.lastMessageText,
      lastMessageSender: lastMessageSender ?? this.lastMessageSender,
      lastMessageAt: lastMessageAt ?? this.lastMessageAt,
      lastCustomerActivityAt: lastCustomerActivityAt,
      is24hWindowActive: is24hWindowActive,
      assignedUserName: assignedUserName ?? this.assignedUserName,
    );
  }
}
