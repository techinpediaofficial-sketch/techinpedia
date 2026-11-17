import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../data/repositories/admin_repository.dart';
import '../../domain/models/admin_invoice_model.dart';

class InvoicesState {
  final bool isLoading;
  final String? error;
  final String selectedStatus; // 'ALL', 'PENDING', 'PAID', 'OVERDUE'
  final List<AdminInvoiceModel> invoices;

  const InvoicesState({
    required this.isLoading,
    this.error,
    this.selectedStatus = 'ALL',
    this.invoices = const [],
  });

  double get totalInvoiced => invoices.fold(0.0, (acc, inv) => acc + inv.totalAmount);
  double get totalPaid => invoices.fold(0.0, (acc, inv) => acc + inv.amountPaid);
  double get totalOutstanding => invoices.fold(0.0, (acc, inv) => acc + inv.balanceDue);

  InvoicesState copyWith({
    bool? isLoading,
    String? error,
    String? selectedStatus,
    List<AdminInvoiceModel>? invoices,
  }) {
    return InvoicesState(
      isLoading: isLoading ?? this.isLoading,
      error: error,
      selectedStatus: selectedStatus ?? this.selectedStatus,
      invoices: invoices ?? this.invoices,
    );
  }
}

final invoicesControllerProvider =
    StateNotifierProvider<InvoicesController, InvoicesState>((ref) {
  final repo = ref.watch(adminRepositoryProvider);
  return InvoicesController(repo);
});

class InvoicesController extends StateNotifier<InvoicesState> {
  final AdminRepository _repo;

  InvoicesController(this._repo) : super(const InvoicesState(isLoading: true)) {
    loadInvoices();
  }

  Future<void> loadInvoices() async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      final list = await _repo.getInvoices(status: state.selectedStatus);
      state = state.copyWith(isLoading: false, invoices: list);
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e.toString());
    }
  }

  void setStatus(String status) {
    if (state.selectedStatus == status) return;
    state = state.copyWith(selectedStatus: status);
    loadInvoices();
  }
}
