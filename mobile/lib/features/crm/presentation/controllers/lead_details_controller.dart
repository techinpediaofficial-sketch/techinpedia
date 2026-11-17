import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../data/repositories/lead_repository.dart';
import '../../domain/models/lead_model.dart';
import '../../domain/models/lead_note_model.dart';
import '../../domain/models/lead_timeline_model.dart';
import 'leads_controller.dart';

class LeadDetailsState {
  final bool isLoading;
  final bool isUpdating;
  final LeadModel? lead;
  final List<LeadTimelineModel> timeline;
  final List<LeadNoteModel> notes;
  final String? errorMessage;

  const LeadDetailsState({
    this.isLoading = false,
    this.isUpdating = false,
    this.lead,
    this.timeline = const [],
    this.notes = const [],
    this.errorMessage,
  });

  LeadDetailsState copyWith({
    bool? isLoading,
    bool? isUpdating,
    LeadModel? lead,
    List<LeadTimelineModel>? timeline,
    List<LeadNoteModel>? notes,
    String? errorMessage,
  }) {
    return LeadDetailsState(
      isLoading: isLoading ?? this.isLoading,
      isUpdating: isUpdating ?? this.isUpdating,
      lead: lead ?? this.lead,
      timeline: timeline ?? this.timeline,
      notes: notes ?? this.notes,
      errorMessage: errorMessage,
    );
  }
}

final leadDetailsControllerFamily =
    StateNotifierProvider.family<LeadDetailsController, LeadDetailsState, String>((ref, leadId) {
  final repository = ref.watch(leadRepositoryProvider);
  return LeadDetailsController(repository, leadId, ref);
});

class LeadDetailsController extends StateNotifier<LeadDetailsState> {
  final LeadRepository _repository;
  final String leadId;
  final Ref _ref;

  LeadDetailsController(this._repository, this.leadId, this._ref) : super(const LeadDetailsState()) {
    loadDetails();
  }

  Future<void> loadDetails() async {
    state = state.copyWith(isLoading: true, errorMessage: null);
    try {
      final result = await _repository.getLeadDetails(leadId);
      state = state.copyWith(
        isLoading: false,
        lead: result.lead,
        timeline: result.timeline,
        notes: result.notes,
      );
    } catch (e) {
      state = state.copyWith(isLoading: false, errorMessage: e.toString());
    }
  }

  Future<bool> updateStage(String stage) async {
    state = state.copyWith(isUpdating: true, errorMessage: null);
    try {
      final updated = await _repository.updateLead(leadId, status: stage);
      state = state.copyWith(isUpdating: false, lead: updated);
      _ref.read(leadsControllerProvider.notifier).refresh();
      return true;
    } catch (e) {
      state = state.copyWith(isUpdating: false, errorMessage: e.toString());
      return false;
    }
  }

  Future<bool> updateDetails({
    double? estimatedValue,
    String? temperature,
    int? score,
  }) async {
    state = state.copyWith(isUpdating: true, errorMessage: null);
    try {
      final updated = await _repository.updateLead(
        leadId,
        estimatedValue: estimatedValue,
        temperature: temperature,
        score: score,
      );
      state = state.copyWith(isUpdating: false, lead: updated);
      _ref.read(leadsControllerProvider.notifier).refresh();
      return true;
    } catch (e) {
      state = state.copyWith(isUpdating: false, errorMessage: e.toString());
      return false;
    }
  }

  Future<bool> addNote(String content) async {
    if (content.trim().isEmpty) return false;
    try {
      final newNote = await _repository.addLeadNote(leadId, content.trim());
      state = state.copyWith(
        notes: [newNote, ...state.notes],
        lead: state.lead?.copyWith(notesCount: (state.lead?.notesCount ?? 0) + 1),
      );
      return true;
    } catch (e) {
      state = state.copyWith(errorMessage: e.toString());
      return false;
    }
  }
}
