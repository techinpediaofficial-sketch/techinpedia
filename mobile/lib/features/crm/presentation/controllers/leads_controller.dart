import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../data/repositories/lead_repository.dart';
import '../../domain/models/lead_model.dart';

class LeadsState {
  final bool isLoading;
  final bool isRefreshing;
  final List<LeadModel> leads;
  final String selectedStatus;
  final String searchQuery;
  final String? errorMessage;

  const LeadsState({
    this.isLoading = false,
    this.isRefreshing = false,
    this.leads = const [],
    this.selectedStatus = 'ALL',
    this.searchQuery = '',
    this.errorMessage,
  });

  LeadsState copyWith({
    bool? isLoading,
    bool? isRefreshing,
    List<LeadModel>? leads,
    String? selectedStatus,
    String? searchQuery,
    String? errorMessage,
  }) {
    return LeadsState(
      isLoading: isLoading ?? this.isLoading,
      isRefreshing: isRefreshing ?? this.isRefreshing,
      leads: leads ?? this.leads,
      selectedStatus: selectedStatus ?? this.selectedStatus,
      searchQuery: searchQuery ?? this.searchQuery,
      errorMessage: errorMessage,
    );
  }
}

final leadsControllerProvider = StateNotifierProvider<LeadsController, LeadsState>((ref) {
  final repository = ref.watch(leadRepositoryProvider);
  return LeadsController(repository);
});

class LeadsController extends StateNotifier<LeadsState> {
  final LeadRepository _repository;

  LeadsController(this._repository) : super(const LeadsState()) {
    loadLeads();
  }

  Future<void> loadLeads({bool showLoading = true}) async {
    if (showLoading) {
      state = state.copyWith(isLoading: true, errorMessage: null);
    }
    try {
      final list = await _repository.getLeads(
        status: state.selectedStatus,
        search: state.searchQuery,
      );
      state = state.copyWith(
        isLoading: false,
        isRefreshing: false,
        leads: list,
        errorMessage: null,
      );
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        isRefreshing: false,
        errorMessage: e.toString(),
      );
    }
  }

  Future<void> refresh() async {
    state = state.copyWith(isRefreshing: true, errorMessage: null);
    await loadLeads(showLoading: false);
  }

  void setStatus(String status) {
    if (state.selectedStatus == status) return;
    state = state.copyWith(selectedStatus: status);
    loadLeads();
  }

  void setSearchQuery(String query) {
    state = state.copyWith(searchQuery: query);
    loadLeads(showLoading: false);
  }
}
