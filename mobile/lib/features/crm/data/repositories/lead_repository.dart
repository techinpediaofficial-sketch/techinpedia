import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/constants/api_endpoints.dart';
import '../../../../core/network/api_client.dart';
import '../../domain/models/lead_model.dart';
import '../../domain/models/lead_note_model.dart';
import '../../domain/models/lead_timeline_model.dart';

final leadRepositoryProvider = Provider<LeadRepository>((ref) {
  final client = ref.watch(apiClientProvider);
  return LeadRepositoryImpl(client);
});

class LeadDetailsResult {
  final LeadModel lead;
  final List<LeadTimelineModel> timeline;
  final List<LeadNoteModel> notes;

  const LeadDetailsResult({
    required this.lead,
    this.timeline = const [],
    this.notes = const [],
  });
}

abstract class LeadRepository {
  Future<List<LeadModel>> getLeads({
    String? status,
    String? search,
    int page = 1,
    int limit = 25,
  });

  Future<LeadDetailsResult> getLeadDetails(String id);

  Future<LeadModel> updateLead(
    String id, {
    String? status,
    double? estimatedValue,
    String? temperature,
    int? score,
    String? assignedUserId,
  });

  Future<LeadNoteModel> addLeadNote(String id, String content);
}

class LeadRepositoryImpl implements LeadRepository {
  final ApiClient _client;

  LeadRepositoryImpl(this._client);

  @override
  Future<List<LeadModel>> getLeads({
    String? status,
    String? search,
    int page = 1,
    int limit = 25,
  }) async {
    final queryParams = <String, dynamic>{
      'page': page,
      'limit': limit,
    };

    if (status != null && status.isNotEmpty && status != 'ALL') {
      queryParams['status'] = status;
    }
    if (search != null && search.trim().isNotEmpty) {
      queryParams['search'] = search.trim();
    }

    final response = await _client.get(
      ApiEndpoints.leads,
      queryParameters: queryParams,
    );

    final data = response.data;
    if (data is Map<String, dynamic> && data['enquiries'] is List) {
      return (data['enquiries'] as List)
          .map((item) => LeadModel.fromJson(item as Map<String, dynamic>))
          .toList();
    } else if (data is List) {
      return data.map((item) => LeadModel.fromJson(item as Map<String, dynamic>)).toList();
    }
    return [];
  }

  @override
  Future<LeadDetailsResult> getLeadDetails(String id) async {
    final response = await _client.get(ApiEndpoints.leadDetails(id));
    final data = response.data;

    final enquiryData = data is Map<String, dynamic> && data['enquiry'] is Map
        ? data['enquiry'] as Map<String, dynamic>
        : data as Map<String, dynamic>;

    final lead = LeadModel.fromJson(enquiryData);

    List<LeadTimelineModel> timeline = [];
    if (enquiryData['timelineEvents'] is List) {
      timeline = (enquiryData['timelineEvents'] as List)
          .map((t) => LeadTimelineModel.fromJson(t as Map<String, dynamic>))
          .toList();
    }

    List<LeadNoteModel> notes = [];
    if (enquiryData['notes'] is List) {
      notes = (enquiryData['notes'] as List)
          .map((n) => LeadNoteModel.fromJson(n as Map<String, dynamic>))
          .toList();
    }

    return LeadDetailsResult(
      lead: lead,
      timeline: timeline,
      notes: notes,
    );
  }

  @override
  Future<LeadModel> updateLead(
    String id, {
    String? status,
    double? estimatedValue,
    String? temperature,
    int? score,
    String? assignedUserId,
  }) async {
    final payload = <String, dynamic>{};
    if (status != null) payload['status'] = status;
    if (estimatedValue != null) payload['estimatedValue'] = estimatedValue;
    if (temperature != null) payload['temperature'] = temperature;
    if (score != null) payload['score'] = score;
    if (assignedUserId != null) payload['assignedUserId'] = assignedUserId;

    final response = await _client.patch(
      ApiEndpoints.leadDetails(id),
      data: payload,
    );

    final data = response.data;
    final updated = data is Map<String, dynamic> && data['enquiry'] is Map
        ? data['enquiry'] as Map<String, dynamic>
        : data as Map<String, dynamic>;

    return LeadModel.fromJson(updated);
  }

  @override
  Future<LeadNoteModel> addLeadNote(String id, String content) async {
    final response = await _client.post(
      ApiEndpoints.leadNotes(id),
      data: {'content': content.trim()},
    );

    final data = response.data;
    final noteData = data is Map<String, dynamic> && data['note'] is Map
        ? data['note'] as Map<String, dynamic>
        : data as Map<String, dynamic>;

    return LeadNoteModel.fromJson(noteData);
  }
}
