class WhatsAppMessageModel {
  final String id;
  final String conversationId;
  final String? metaMessageId;
  final String direction; // INBOUND, OUTBOUND
  final String senderType; // CONTACT, AGENT, SYSTEM
  final String? senderUserId;
  final String type; // text, template, image, document
  final String? textBody;
  final String? mediaUrl;
  final String status; // SENT, DELIVERED, READ, FAILED
  final DateTime createdAt;

  const WhatsAppMessageModel({
    required this.id,
    required this.conversationId,
    this.metaMessageId,
    required this.direction,
    required this.senderType,
    this.senderUserId,
    this.type = 'text',
    this.textBody,
    this.mediaUrl,
    this.status = 'SENT',
    required this.createdAt,
  });

  bool get isInbound => direction == 'INBOUND';
  bool get isOutbound => direction == 'OUTBOUND';
  bool get isSystem => senderType == 'SYSTEM';
  bool get isSystemMessage => senderType == 'SYSTEM';
  bool get isAgent => senderType == 'AGENT';

  factory WhatsAppMessageModel.fromJson(Map<String, dynamic> json) {
    DateTime parseDate(dynamic val) {
      if (val == null) return DateTime.now();
      try {
        return DateTime.parse(val.toString());
      } catch (_) {
        return DateTime.now();
      }
    }

    return WhatsAppMessageModel(
      id: json['id']?.toString() ?? '',
      conversationId: json['conversationId']?.toString() ?? '',
      metaMessageId: json['metaMessageId']?.toString(),
      direction: json['direction']?.toString() ?? 'INBOUND',
      senderType: json['senderType']?.toString() ?? 'CONTACT',
      senderUserId: json['senderUserId']?.toString(),
      type: json['type']?.toString() ?? 'text',
      textBody: json['textBody']?.toString(),
      mediaUrl: json['mediaUrl']?.toString(),
      status: json['status']?.toString() ?? 'SENT',
      createdAt: parseDate(json['createdAt'] ?? json['sentAt']),
    );
  }
}
