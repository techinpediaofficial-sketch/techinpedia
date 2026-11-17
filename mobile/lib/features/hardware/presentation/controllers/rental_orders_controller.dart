import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/network/api_client.dart';
import '../../data/repositories/hardware_repository.dart';
import '../../domain/models/rental_order_model.dart';

final hardwareRepositoryProvider = Provider<HardwareRepository>((ref) {
  final client = ref.watch(apiClientProvider);
  return HardwareRepositoryImpl(client);
});

class RentalOrdersState {
  final bool isLoading;
  final bool isRefreshing;
  final List<RentalOrderModel> orders;
  final RentalOrderMetrics metrics;
  final String currentStatus;
  final String searchQuery;
  final String? errorMessage;

  const RentalOrdersState({
    this.isLoading = false,
    this.isRefreshing = false,
    this.orders = const [],
    this.metrics = const RentalOrderMetrics(),
    this.currentStatus = 'ALL',
    this.searchQuery = '',
    this.errorMessage,
  });

  RentalOrdersState copyWith({
    bool? isLoading,
    bool? isRefreshing,
    List<RentalOrderModel>? orders,
    RentalOrderMetrics? metrics,
    String? currentStatus,
    String? searchQuery,
    String? errorMessage,
  }) {
    return RentalOrdersState(
      isLoading: isLoading ?? this.isLoading,
      isRefreshing: isRefreshing ?? this.isRefreshing,
      orders: orders ?? this.orders,
      metrics: metrics ?? this.metrics,
      currentStatus: currentStatus ?? this.currentStatus,
      searchQuery: searchQuery ?? this.searchQuery,
      errorMessage: errorMessage,
    );
  }
}

final rentalOrdersControllerProvider =
    StateNotifierProvider<RentalOrdersController, RentalOrdersState>((ref) {
  final repository = ref.watch(hardwareRepositoryProvider);
  return RentalOrdersController(repository);
});

class RentalOrdersController extends StateNotifier<RentalOrdersState> {
  final HardwareRepository _repository;

  RentalOrdersController(this._repository) : super(const RentalOrdersState()) {
    loadOrders();
  }

  Future<void> loadOrders({bool showLoading = true}) async {
    if (showLoading) {
      state = state.copyWith(isLoading: true, errorMessage: null);
    }
    try {
      final result = await _repository.getRentalOrders(
        status: state.currentStatus,
        search: state.searchQuery,
      );
      state = state.copyWith(
        isLoading: false,
        isRefreshing: false,
        orders: result.orders,
        metrics: result.metrics,
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
    await loadOrders(showLoading: false);
  }

  void setStatusFilter(String status) {
    if (state.currentStatus == status) return;
    state = state.copyWith(currentStatus: status);
    loadOrders();
  }

  void setSearchQuery(String query) {
    state = state.copyWith(searchQuery: query);
    loadOrders(showLoading: false);
  }

  Future<bool> markAsReturned(String orderId) async {
    try {
      final updated = await _repository.updateRentalStatus(
        id: orderId,
        status: 'RETURNED',
      );
      final updatedList = state.orders.map((o) => o.id == orderId ? updated : o).toList();
      state = state.copyWith(orders: updatedList);
      return true;
    } catch (e) {
      state = state.copyWith(errorMessage: 'Failed to update order status: $e');
      return false;
    }
  }

  Future<bool> recordSignature({
    required String orderId,
    required String customerName,
    required String signatureSummary,
  }) async {
    try {
      final updated = await _repository.recordCustomerSignature(
        id: orderId,
        customerName: customerName,
        signatureSummary: signatureSummary,
      );
      final updatedList = state.orders.map((o) => o.id == orderId ? updated : o).toList();
      state = state.copyWith(orders: updatedList);
      return true;
    } catch (e) {
      state = state.copyWith(errorMessage: 'Failed to record customer signature: $e');
      return false;
    }
  }
}
