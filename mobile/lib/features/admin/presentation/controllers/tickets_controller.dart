import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../data/repositories/admin_repository.dart';
import '../../domain/models/admin_ticket_model.dart';

class TicketsState {
  final bool isLoading;
  final String? error;
  final String selectedStatus; // 'ALL', 'OPEN', 'IN_PROGRESS', 'RESOLVED'
  final List<AdminTicketModel> tickets;

  const TicketsState({
    required this.isLoading,
    this.error,
    this.selectedStatus = 'ALL',
    this.tickets = const [],
  });

  int get openCount => tickets.where((t) => t.isOpen).length;
  int get inProgressCount => tickets.where((t) => t.isInProgress).length;
  int get resolvedCount => tickets.where((t) => t.isResolved).length;

  TicketsState copyWith({
    bool? isLoading,
    String? error,
    String? selectedStatus,
    List<AdminTicketModel>? tickets,
  }) {
    return TicketsState(
      isLoading: isLoading ?? this.isLoading,
      error: error,
      selectedStatus: selectedStatus ?? this.selectedStatus,
      tickets: tickets ?? this.tickets,
    );
  }
}

final ticketsControllerProvider =
    StateNotifierProvider<TicketsController, TicketsState>((ref) {
  final repo = ref.watch(adminRepositoryProvider);
  return TicketsController(repo);
});

class TicketsController extends StateNotifier<TicketsState> {
  final AdminRepository _repo;

  TicketsController(this._repo) : super(const TicketsState(isLoading: true)) {
    loadTickets();
  }

  Future<void> loadTickets() async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      final list = await _repo.getTickets(status: state.selectedStatus);
      state = state.copyWith(isLoading: false, tickets: list);
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e.toString());
    }
  }

  void setStatus(String status) {
    if (state.selectedStatus == status) return;
    state = state.copyWith(selectedStatus: status);
    loadTickets();
  }

  Future<void> updateStatus(String ticketId, String newStatus) async {
    try {
      await _repo.updateTicketStatus(ticketId: ticketId, status: newStatus);
      await loadTickets();
    } catch (e) {
      state = state.copyWith(error: e.toString());
    }
  }
}
