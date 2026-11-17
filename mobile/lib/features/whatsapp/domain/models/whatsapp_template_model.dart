class WhatsAppTemplateModel {
  final String id;
  final String name;
  final String category;
  final String language;
  final String status;
  final String? bodyText;
  final String? headerType;
  final List<String> exampleValues;

  const WhatsAppTemplateModel({
    required this.id,
    required this.name,
    required this.category,
    this.language = 'en_US',
    required this.status,
    this.bodyText,
    this.headerType,
    this.exampleValues = const [],
  });

  bool get isApproved => status.toUpperCase() == 'APPROVED';

  int get variableCount {
    if (bodyText == null) return 0;
    final regex = RegExp(r'\{\{(\d+)\}\}');
    final matches = regex.allMatches(bodyText!);
    return matches.map((m) => int.tryParse(m.group(1) ?? '0') ?? 0).fold(0, (max, v) => v > max ? v : max);
  }

  String renderPreview(List<String> params) {
    if (bodyText == null) return '';
    var rendered = bodyText!;
    for (int i = 1; i <= variableCount; i++) {
      final paramValue = (i - 1 < params.length) ? params[i - 1].trim() : '';
      final val = paramValue.isEmpty ? '[Variable $i]' : paramValue;
      rendered = rendered.replaceAll('{{$i}}', val);
    }
    return rendered;
  }

  factory WhatsAppTemplateModel.fromJson(Map<String, dynamic> json) {
    List<String> examples = [];
    if (json['exampleValues'] is List) {
      examples = (json['exampleValues'] as List).map((e) => e.toString()).toList();
    }

    return WhatsAppTemplateModel(
      id: json['id']?.toString() ?? '',
      name: json['name']?.toString() ?? '',
      category: json['category']?.toString() ?? 'UTILITY',
      language: json['language']?.toString() ?? 'en_US',
      status: json['status']?.toString() ?? 'PENDING',
      bodyText: json['bodyText']?.toString() ?? json['body']?.toString(),
      headerType: json['headerType']?.toString(),
      exampleValues: examples,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'category': category,
      'language': language,
      'status': status,
      'bodyText': bodyText,
      'headerType': headerType,
      'exampleValues': exampleValues,
    };
  }
}
