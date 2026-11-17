import '../../../../core/constants/api_endpoints.dart';
import '../../../../core/network/api_client.dart';
import '../../domain/models/folder_metrics_model.dart';
import '../../domain/models/whatsapp_conversation_model.dart';
import '../../domain/models/whatsapp_message_model.dart';
import '../../domain/models/whatsapp_template_model.dart';

abstract class WhatsAppRepository {
  Future<({List<WhatsAppConversationModel> conversations, FolderMetricsModel metrics})> getConversations({
    String folder = 'ALL',
    String? search,
  });

  Future<({List<WhatsAppMessageModel> messages, WhatsAppConversationModel conversation, bool is24hWindowActive})>
      getMessages(String conversationId);

  Future<String> sendMessage({
    required String conversationId,
    required String text,
  });

  Future<WhatsAppConversationModel> updateConversation({
    required String id,
    String? assignedUserId,
    String? status,
    String? priority,
  });

  Future<List<WhatsAppTemplateModel>> getTemplates();

  Future<String> sendTemplateMessage({
    required String conversationId,
    required String templateName,
    required List<String> templateParams,
    String? language,
  });

  Future<WhatsAppMessageModel> sendInternalNote({
    required String conversationId,
    required String text,
  });
}

class WhatsAppRepositoryImpl implements WhatsAppRepository {
  final ApiClient _apiClient;

  WhatsAppRepositoryImpl(this._apiClient);

  @override
  Future<({List<WhatsAppConversationModel> conversations, FolderMetricsModel metrics})> getConversations({
    String folder = 'ALL',
    String? search,
  }) async {
    final queryParams = <String, dynamic>{
      'folder': folder,
      if (search != null && search.trim().isNotEmpty) 'search': search.trim(),
    };

    final response = await _apiClient.get(
      ApiEndpoints.conversations,
      queryParameters: queryParams,
    );

    final data = response.data;
    final convList = (data['conversations'] as List<dynamic>?)
            ?.map((e) => WhatsAppConversationModel.fromJson(e as Map<String, dynamic>))
            .toList() ??
        [];

    final metrics = data['folderMetrics'] is Map<String, dynamic>
        ? FolderMetricsModel.fromJson(data['folderMetrics'] as Map<String, dynamic>)
        : const FolderMetricsModel();

    return (conversations: convList, metrics: metrics);
  }

  @override
  Future<({List<WhatsAppMessageModel> messages, WhatsAppConversationModel conversation, bool is24hWindowActive})>
      getMessages(String conversationId) async {
    final response = await _apiClient.get(
      ApiEndpoints.messages,
      queryParameters: {'conversationId': conversationId},
    );

    final data = response.data;
    final msgList = (data['messages'] as List<dynamic>?)
            ?.map((e) => WhatsAppMessageModel.fromJson(e as Map<String, dynamic>))
            .toList() ??
        [];

    final convJson = data['conversation'] as Map<String, dynamic>;
    final conv = WhatsAppConversationModel.fromJson(convJson);
    final is24hActive = data['is24hWindowActive'] == true;

    return (messages: msgList, conversation: conv, is24hWindowActive: is24hActive);
  }

  @override
  Future<String> sendMessage({
    required String conversationId,
    required String text,
  }) async {
    final response = await _apiClient.post(
      ApiEndpoints.messages,
      data: {
        'conversationId': conversationId,
        'type': 'text',
        'text': text.trim(),
      },
    );

    final data = response.data;
    return data['messageId']?.toString() ?? 'sent';
  }

  @override
  Future<WhatsAppConversationModel> updateConversation({
    required String id,
    String? assignedUserId,
    String? status,
    String? priority,
  }) async {
    final body = <String, dynamic>{'id': id};
    if (assignedUserId != null) body['assignedUserId'] = assignedUserId;
    if (status != null) body['status'] = status;
    if (priority != null) body['priority'] = priority;

    final response = await _apiClient.patch(
      ApiEndpoints.conversations,
      data: body,
    );

    final data = response.data;
    return WhatsAppConversationModel.fromJson(data['conversation'] as Map<String, dynamic>);
  }

  @override
  Future<List<WhatsAppTemplateModel>> getTemplates() async {
    final response = await _apiClient.get(ApiEndpoints.templates);
    final data = response.data;
    if (data is Map<String, dynamic> && data['templates'] is List) {
      return (data['templates'] as List)
          .map((item) => WhatsAppTemplateModel.fromJson(item as Map<String, dynamic>))
          .where((t) => t.isApproved)
          .toList();
    }
    return [];
  }

  @override
  Future<String> sendTemplateMessage({
    required String conversationId,
    required String templateName,
    required List<String> templateParams,
    String? language,
  }) async {
    final payload = <String, dynamic>{
      'conversationId': conversationId,
      'type': 'template',
      'templateName': templateName,
      'templateParams': templateParams,
    };
    if (language != null) payload['language'] = language;

    final response = await _apiClient.post(
      ApiEndpoints.messages,
      data: payload,
    );

    final data = response.data;
    return data['messageId']?.toString() ?? 'sent';
  }

  @override
  Future<WhatsAppMessageModel> sendInternalNote({
    required String conversationId,
    required String text,
  }) async {
    final response = await _apiClient.post(
      ApiEndpoints.messages,
      data: {
        'conversationId': conversationId,
        'text': text.trim(),
        'isInternalNote': true,
      },
    );

    final data = response.data;
    final msgData = data['message'] as Map<String, dynamic>;
    return WhatsAppMessageModel.fromJson(msgData);
  }
}
