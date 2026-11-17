import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../data/repositories/hrm_repository.dart';
import '../../domain/models/payroll_model.dart';

class PayrollState {
  final List<PayrollModel> records;
  final PayrollModel? selectedRecord;
  final bool isLoading;
  final String? errorMessage;

  const PayrollState({
    this.records = const [],
    this.selectedRecord,
    this.isLoading = false,
    this.errorMessage,
  });

  PayrollState copyWith({
    List<PayrollModel>? records,
    PayrollModel? selectedRecord,
    bool? isLoading,
    String? errorMessage,
    bool clearMessages = false,
  }) {
    return PayrollState(
      records: records ?? this.records,
      selectedRecord: selectedRecord ?? this.selectedRecord,
      isLoading: isLoading ?? this.isLoading,
      errorMessage: clearMessages ? null : (errorMessage ?? this.errorMessage),
    );
  }
}

final payrollControllerProvider = StateNotifierProvider<PayrollController, PayrollState>((ref) {
  final repo = ref.watch(hrmRepositoryProvider);
  return PayrollController(repo);
});

class PayrollController extends StateNotifier<PayrollState> {
  final HrmRepository _repository;

  PayrollController(this._repository) : super(const PayrollState(isLoading: true)) {
    fetchPayroll();
  }

  void selectRecord(PayrollModel record) {
    state = state.copyWith(selectedRecord: record);
  }

  Future<void> fetchPayroll({int? month, int? year}) async {
    state = state.copyWith(isLoading: true, clearMessages: true);
    try {
      final records = await _repository.getPayrollRecords(month: month, year: year);
      state = state.copyWith(
        records: records,
        selectedRecord: records.isNotEmpty ? records.first : null,
        isLoading: false,
      );
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        errorMessage: 'Failed to load payroll records: $e',
      );
    }
  }
}
