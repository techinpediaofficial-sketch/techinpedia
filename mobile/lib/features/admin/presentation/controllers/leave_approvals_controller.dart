import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../data/repositories/admin_repository.dart';
import '../../domain/models/leave_approval_model.dart';

class LeaveApprovalsState {
  final bool isLoading;
  final String? error;
  final String selectedFilter; // 'ALL', 'PENDING', 'APPROVED', 'REJECTED'
  final List<LeaveApprovalModel> leaves;
  final bool isReviewing;

  const LeaveApprovalsState({
    required this.isLoading,
    this.error,
    this.selectedFilter = 'PENDING',
    this.leaves = const [],
    this.isReviewing = false,
  });

  LeaveApprovalsState copyWith({
    bool? isLoading,
    String? error,
    String? selectedFilter,
    List<LeaveApprovalModel>? leaves,
    bool? isReviewing,
  }) {
    return LeaveApprovalsState(
      isLoading: isLoading ?? this.isLoading,
      error: error,
      selectedFilter: selectedFilter ?? this.selectedFilter,
      leaves: leaves ?? this.leaves,
      isReviewing: isReviewing ?? this.isReviewing,
    );
  }
}

final leaveApprovalsControllerProvider =
    StateNotifierProvider<LeaveApprovalsController, LeaveApprovalsState>((ref) {
  final repo = ref.watch(adminRepositoryProvider);
  return LeaveApprovalsController(repo);
});

class LeaveApprovalsController extends StateNotifier<LeaveApprovalsState> {
  final AdminRepository _repo;

  LeaveApprovalsController(this._repo)
      : super(const LeaveApprovalsState(isLoading: true)) {
    loadLeaves();
  }

  Future<void> loadLeaves() async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      final list = await _repo.getLeaveRequests(status: state.selectedFilter);
      state = state.copyWith(isLoading: false, leaves: list);
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e.toString());
    }
  }

  void setFilter(String filter) {
    if (state.selectedFilter == filter) return;
    state = state.copyWith(selectedFilter: filter);
    loadLeaves();
  }

  Future<bool> reviewLeave({
    required String leaveId,
    required String status,
  }) async {
    state = state.copyWith(isReviewing: true);
    try {
      await _repo.reviewLeaveRequest(leaveId: leaveId, status: status);
      await loadLeaves();
      return true;
    } catch (e) {
      state = state.copyWith(error: e.toString());
      return false;
    } finally {
      state = state.copyWith(isReviewing: false);
    }
  }
}
