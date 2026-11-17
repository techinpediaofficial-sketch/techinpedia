import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../data/repositories/hrm_repository.dart';
import '../../domain/models/leave_balance_model.dart';
import '../../domain/models/leave_request_model.dart';

class LeavesState {
  final List<LeaveBalanceModel> balances;
  final List<LeaveRequestModel> leaveRequests;
  final String selectedFilter; // ALL, PENDING, APPROVED, REJECTED
  final int pendingCount;
  final int approvedCount;
  final int rejectedCount;
  final bool isLoading;
  final bool isSubmitting;
  final String? errorMessage;
  final String? successMessage;

  const LeavesState({
    this.balances = const [],
    this.leaveRequests = const [],
    this.selectedFilter = 'ALL',
    this.pendingCount = 0,
    this.approvedCount = 0,
    this.rejectedCount = 0,
    this.isLoading = false,
    this.isSubmitting = false,
    this.errorMessage,
    this.successMessage,
  });

  List<LeaveRequestModel> get filteredRequests {
    if (selectedFilter == 'ALL') return leaveRequests;
    return leaveRequests
        .where((r) => r.status.toUpperCase() == selectedFilter.toUpperCase())
        .toList();
  }

  LeavesState copyWith({
    List<LeaveBalanceModel>? balances,
    List<LeaveRequestModel>? leaveRequests,
    String? selectedFilter,
    int? pendingCount,
    int? approvedCount,
    int? rejectedCount,
    bool? isLoading,
    bool? isSubmitting,
    String? errorMessage,
    String? successMessage,
    bool clearMessages = false,
  }) {
    return LeavesState(
      balances: balances ?? this.balances,
      leaveRequests: leaveRequests ?? this.leaveRequests,
      selectedFilter: selectedFilter ?? this.selectedFilter,
      pendingCount: pendingCount ?? this.pendingCount,
      approvedCount: approvedCount ?? this.approvedCount,
      rejectedCount: rejectedCount ?? this.rejectedCount,
      isLoading: isLoading ?? this.isLoading,
      isSubmitting: isSubmitting ?? this.isSubmitting,
      errorMessage: clearMessages ? null : (errorMessage ?? this.errorMessage),
      successMessage: clearMessages ? null : (successMessage ?? this.successMessage),
    );
  }
}

final leavesControllerProvider = StateNotifierProvider<LeavesController, LeavesState>((ref) {
  final repo = ref.watch(hrmRepositoryProvider);
  return LeavesController(repo);
});

class LeavesController extends StateNotifier<LeavesState> {
  final HrmRepository _repository;

  LeavesController(this._repository) : super(const LeavesState(isLoading: true)) {
    fetchLeaves();
  }

  void setFilter(String filter) {
    state = state.copyWith(selectedFilter: filter);
  }

  Future<void> fetchLeaves({int? year}) async {
    state = state.copyWith(isLoading: true, clearMessages: true);
    try {
      final res = await _repository.getLeavesData(year: year);
      state = state.copyWith(
        balances: res.balances,
        leaveRequests: res.leaveRequests,
        pendingCount: res.pendingCount,
        approvedCount: res.approvedCount,
        rejectedCount: res.rejectedCount,
        isLoading: false,
      );
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        errorMessage: 'Failed to load leave records: $e',
      );
    }
  }

  Future<bool> applyLeave({
    required String leaveType,
    required DateTime startDate,
    required DateTime endDate,
    required String reason,
    double? daysCount,
  }) async {
    state = state.copyWith(isSubmitting: true, clearMessages: true);
    try {
      final newReq = await _repository.applyLeave(
        leaveType: leaveType,
        startDate: startDate,
        endDate: endDate,
        reason: reason,
        daysCount: daysCount,
      );

      final updatedList = [newReq, ...state.leaveRequests];
      state = state.copyWith(
        leaveRequests: updatedList,
        pendingCount: state.pendingCount + 1,
        isSubmitting: false,
        successMessage: 'Leave request submitted successfully for approval!',
      );

      // Refresh balances in background
      fetchLeaves();
      return true;
    } catch (e) {
      state = state.copyWith(
        isSubmitting: false,
        errorMessage: e.toString().replaceAll('Exception: ', ''),
      );
      return false;
    }
  }
}
