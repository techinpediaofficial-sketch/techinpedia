class LeadNoteModel {
  final String id;
  final String content;
  final String? authorName;
  final DateTime createdAt;

  const LeadNoteModel({
    required this.id,
    required this.content,
    this.authorName,
    required this.createdAt,
  });

  factory LeadNoteModel.fromJson(Map<String, dynamic> json) {
    DateTime parseDate(dynamic val) {
      if (val == null) return DateTime.now();
      try {
        return DateTime.parse(val.toString());
      } catch (_) {
        return DateTime.now();
      }
    }

    String? author;
    if (json['user'] is Map<String, dynamic>) {
      author = json['user']['name']?.toString() ?? json['user']['email']?.toString();
    }

    return LeadNoteModel(
      id: json['id']?.toString() ?? '',
      content: json['content']?.toString() ?? json['note']?.toString() ?? '',
      authorName: author,
      createdAt: parseDate(json['createdAt']),
    );
  }
}
