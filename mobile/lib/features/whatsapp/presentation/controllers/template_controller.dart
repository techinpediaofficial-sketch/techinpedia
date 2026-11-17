import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../data/repositories/whatsapp_repository.dart';
import '../../domain/models/whatsapp_template_model.dart';
import 'inbox_controller.dart';

class TemplatePickerState {
  final bool isLoading;
  final bool isSending;
  final List<WhatsAppTemplateModel> templates;
  final WhatsAppTemplateModel? selectedTemplate;
  final Map<int, String> parameters;
  final String? errorMessage;
  final bool sendSuccess;

  const TemplatePickerState({
    this.isLoading = false,
    this.isSending = false,
    this.templates = const [],
    this.selectedTemplate,
    this.parameters = const {},
    this.errorMessage,
    this.sendSuccess = false,
  });

  TemplatePickerState copyWith({
    bool? isLoading,
    bool? isSending,
    List<WhatsAppTemplateModel>? templates,
    WhatsAppTemplateModel? selectedTemplate,
    Map<int, String>? parameters,
    String? errorMessage,
    bool? sendSuccess,
  }) {
    return TemplatePickerState(
      isLoading: isLoading ?? this.isLoading,
      isSending: isSending ?? this.isSending,
      templates: templates ?? this.templates,
      selectedTemplate: selectedTemplate ?? this.selectedTemplate,
      parameters: parameters ?? this.parameters,
      errorMessage: errorMessage,
      sendSuccess: sendSuccess ?? this.sendSuccess,
    );
  }
}

final templatePickerControllerProvider =
    StateNotifierProvider.autoDispose<TemplatePickerController, TemplatePickerState>((ref) {
  final repository = ref.watch(whatsAppRepositoryProvider);
  return TemplatePickerController(repository);
});

class TemplatePickerController extends StateNotifier<TemplatePickerState> {
  final WhatsAppRepository _repository;

  TemplatePickerController(this._repository) : super(const TemplatePickerState()) {
    loadTemplates();
  }

  Future<void> loadTemplates() async {
    state = state.copyWith(isLoading: true, errorMessage: null);
    try {
      final list = await _repository.getTemplates();
      state = state.copyWith(isLoading: false, templates: list);
    } catch (e) {
      state = state.copyWith(isLoading: false, errorMessage: e.toString());
    }
  }

  void selectTemplate(WhatsAppTemplateModel template, {String? defaultCustomerName}) {
    final defaultParams = <int, String>{};
    if (defaultCustomerName != null && defaultCustomerName.isNotEmpty) {
      defaultParams[1] = defaultCustomerName;
    }

    state = state.copyWith(
      selectedTemplate: template,
      parameters: defaultParams,
      errorMessage: null,
      sendSuccess: false,
    );
  }

  void updateParam(int index, String value) {
    final current = Map<int, String>.from(state.parameters);
    current[index] = value;
    state = state.copyWith(parameters: current);
  }

  Future<bool> sendTemplate(String conversationId) async {
    final template = state.selectedTemplate;
    if (template == null) return false;

    state = state.copyWith(isSending: true, errorMessage: null);

    try {
      final paramList = <String>[];
      final count = template.variableCount;
      for (int i = 1; i <= count; i++) {
        paramList.add(state.parameters[i]?.trim() ?? '');
      }

      await _repository.sendTemplateMessage(
        conversationId: conversationId,
        templateName: template.name,
        templateParams: paramList,
        language: template.language,
      );

      state = state.copyWith(isSending: false, sendSuccess: true);
      return true;
    } catch (e) {
      state = state.copyWith(isSending: false, errorMessage: e.toString());
      return false;
    }
  }
}
