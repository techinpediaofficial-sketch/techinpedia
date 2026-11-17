import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../data/repositories/admin_repository.dart';
import '../../domain/models/attendance_roster_model.dart';

class AttendanceRosterState {
  final bool isLoading;
  final String? error;
  final List<AttendanceRosterModel> records;

  const AttendanceRosterState({
    required this.isLoading,
    this.error,
    this.records = const [],
  });

  int get presentCount => records.where((r) => r.isPresent).length;
  int get lateCount => records.where((r) => r.isLate).length;
  int get onLeaveCount => records.where((r) => r.isOnLeave).length;

  AttendanceRosterState copyWith({
    bool? isLoading,
    String? error,
    List<AttendanceRosterModel>? records,
  }) {
    return AttendanceRosterState(
      isLoading: isLoading ?? this.isLoading,
      error: error,
      records: records ?? this.records,
    );
  }
}

final attendanceRosterControllerProvider =
    StateNotifierProvider<AttendanceRosterController, AttendanceRosterState>((ref) {
  final repo = ref.watch(adminRepositoryProvider);
  return AttendanceRosterController(repo);
});

class AttendanceRosterController extends StateNotifier<AttendanceRosterState> {
  final AdminRepository _repo;

  AttendanceRosterController(this._repo) : super(const AttendanceRosterState(isLoading: true)) {
    loadRoster();
  }

  Future<void> loadRoster() async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      final list = await _repo.getTodayAttendanceRoster();
      state = state.copyWith(isLoading: false, records: list);
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e.toString());
    }
  }
}
