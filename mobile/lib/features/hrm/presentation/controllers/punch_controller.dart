import 'dart:async';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../data/repositories/hrm_repository.dart';
import '../../domain/models/attendance_punch_model.dart';

class PunchState {
  final AttendancePunchModel? punchModel;
  final bool isLoading;
  final bool isPunching;
  final String? errorMessage;
  final String? successMessage;
  final int liveElapsedSeconds;

  const PunchState({
    this.punchModel,
    this.isLoading = false,
    this.isPunching = false,
    this.errorMessage,
    this.successMessage,
    this.liveElapsedSeconds = 0,
  });

  PunchState copyWith({
    AttendancePunchModel? punchModel,
    bool? isLoading,
    bool? isPunching,
    String? errorMessage,
    String? successMessage,
    int? liveElapsedSeconds,
    bool clearMessages = false,
  }) {
    return PunchState(
      punchModel: punchModel ?? this.punchModel,
      isLoading: isLoading ?? this.isLoading,
      isPunching: isPunching ?? this.isPunching,
      errorMessage: clearMessages ? null : (errorMessage ?? this.errorMessage),
      successMessage: clearMessages ? null : (successMessage ?? this.successMessage),
      liveElapsedSeconds: liveElapsedSeconds ?? this.liveElapsedSeconds,
    );
  }

  String get liveFormattedDuration {
    final hrs = liveElapsedSeconds ~/ 3600;
    final mins = (liveElapsedSeconds % 3600) ~/ 60;
    final secs = liveElapsedSeconds % 60;
    return '${hrs.toString().padLeft(2, '0')}:${mins.toString().padLeft(2, '0')}:${secs.toString().padLeft(2, '0')}';
  }
}

final punchControllerProvider = StateNotifierProvider<PunchController, PunchState>((ref) {
  final repo = ref.watch(hrmRepositoryProvider);
  return PunchController(repo);
});

class PunchController extends StateNotifier<PunchState> {
  final HrmRepository _repository;
  Timer? _ticker;

  PunchController(this._repository) : super(const PunchState(isLoading: true)) {
    fetchPunchStatus();
  }

  @override
  void dispose() {
    _ticker?.cancel();
    super.dispose();
  }

  void _startTimer(DateTime checkInTime) {
    _ticker?.cancel();
    final elapsedNow = DateTime.now().difference(checkInTime).inSeconds;
    state = state.copyWith(liveElapsedSeconds: elapsedNow > 0 ? elapsedNow : 0);

    _ticker = Timer.periodic(const Duration(seconds: 1), (timer) {
      state = state.copyWith(liveElapsedSeconds: state.liveElapsedSeconds + 1);
    });
  }

  void _stopTimer() {
    _ticker?.cancel();
    _ticker = null;
  }

  Future<void> fetchPunchStatus() async {
    state = state.copyWith(isLoading: true, clearMessages: true);
    try {
      final punch = await _repository.getPunchStatus();
      state = state.copyWith(punchModel: punch, isLoading: false);

      if (punch.isCheckedIn && punch.checkIn != null) {
        _startTimer(punch.checkIn!);
      } else {
        _stopTimer();
      }
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        errorMessage: 'Failed to retrieve attendance status: $e',
      );
    }
  }

  Future<bool> clockIn({String? notes}) async {
    state = state.copyWith(isPunching: true, clearMessages: true);
    try {
      final punch = await _repository.submitPunch(action: 'CLOCK_IN', notes: notes);
      state = state.copyWith(
        punchModel: punch,
        isPunching: false,
        successMessage: punch.isLate
            ? 'Clocked in successfully (Marked Late: After 09:45 AM)'
            : 'Clocked in successfully on time!',
      );

      if (punch.checkIn != null) {
        _startTimer(punch.checkIn!);
      }
      return true;
    } catch (e) {
      state = state.copyWith(
        isPunching: false,
        errorMessage: e.toString().replaceAll('Exception: ', ''),
      );
      return false;
    }
  }

  Future<bool> clockOut({String? notes}) async {
    state = state.copyWith(isPunching: true, clearMessages: true);
    try {
      final punch = await _repository.submitPunch(action: 'CLOCK_OUT', notes: notes);
      _stopTimer();
      state = state.copyWith(
        punchModel: punch,
        isPunching: false,
        successMessage: 'Clocked out successfully! Total: ${punch.formattedDuration}',
      );
      return true;
    } catch (e) {
      state = state.copyWith(
        isPunching: false,
        errorMessage: e.toString().replaceAll('Exception: ', ''),
      );
      return false;
    }
  }
}
