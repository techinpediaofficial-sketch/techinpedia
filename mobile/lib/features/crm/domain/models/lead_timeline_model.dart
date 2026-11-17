class LeadTimelineModel {
  final String id;
  final String type;
  final String title;
  final String? description;
  final String? actorEmail;
  final DateTime createdAt;

  const LeadTimelineModel({
    required this.id,
    required this.type,
    required this.title,
    this.description,
    this.actorEmail,
    required this.createdAt,
  });

  factory LeadTimelineModel.fromJson(Map<String, dynamic> json) {
    DateTime parseDate(dynamic val) {
      if (val == null) return DateTime.now();
      try {
        return DateTime.parse(val.toString());
      } catch (_) {
        return DateTime.now();
      }
    }

    return LeadTimelineModel(
      id: json['id']?.toString() ?? '',
      type: json['type']?.toString() ?? 'SYSTEM',
      title: json['title']?.toString() ?? 'Activity',
      description: json['description']?.toString(),
      actorEmail: json['actorEmail']?.toString(),
      createdAt: parseDate(json['createdAt']),
    );
  }
}
