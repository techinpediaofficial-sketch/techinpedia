import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../data/repositories/hardware_repository.dart';
import '../../domain/models/maintenance_record_model.dart';
import '../../domain/models/rental_order_model.dart';
import 'rental_orders_controller.dart';

class MaintenanceState {
  final bool isLoading;
  final bool isSubmitting;
  final List<MaintenanceRecordModel> records;
  final MaintenanceMetrics metrics;
  final List<RentalAssetModel> availableAssets;
  final String currentStatus;
  final String? errorMessage;

  const MaintenanceState({
    this.isLoading = false,
    this.isSubmitting = false,
    this.records = const [],
    this.metrics = const MaintenanceMetrics(),
    this.availableAssets = const [],
    this.currentStatus = 'ALL',
    this.errorMessage,
  });

  MaintenanceState copyWith({
    bool? isLoading,
    bool? isSubmitting,
    List<MaintenanceRecordModel>? records,
    MaintenanceMetrics? metrics,
    List<RentalAssetModel>? availableAssets,
    String? currentStatus,
    String? errorMessage,
  }) {
    return MaintenanceState(
      isLoading: isLoading ?? this.isLoading,
      isSubmitting: isSubmitting ?? this.isSubmitting,
      records: records ?? this.records,
      metrics: metrics ?? this.metrics,
      availableAssets: availableAssets ?? this.availableAssets,
      currentStatus: currentStatus ?? this.currentStatus,
      errorMessage: errorMessage,
    );
  }
}

final maintenanceControllerProvider =
    StateNotifierProvider<MaintenanceController, MaintenanceState>((ref) {
  final repository = ref.watch(hardwareRepositoryProvider);
  return MaintenanceController(repository);
});

class MaintenanceController extends StateNotifier<MaintenanceState> {
  final HardwareRepository _repository;

  MaintenanceController(this._repository) : super(const MaintenanceState()) {
    loadRecords();
    loadAssets();
  }

  Future<void> loadRecords({bool showLoading = true}) async {
    if (showLoading) {
      state = state.copyWith(isLoading: true, errorMessage: null);
    }
    try {
      final result = await _repository.getMaintenanceRecords(
        status: state.currentStatus,
      );
      state = state.copyWith(
        isLoading: false,
        records: result.records,
        metrics: result.metrics,
        errorMessage: null,
      );
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        errorMessage: e.toString(),
      );
    }
  }

  Future<void> loadAssets() async {
    try {
      final assets = await _repository.getHardwareAssets();
      state = state.copyWith(availableAssets: assets);
    } catch (_) {}
  }

  void setStatusFilter(String status) {
    if (state.currentStatus == status) return;
    state = state.copyWith(currentStatus: status);
    loadRecords();
  }

  Future<bool> reportMaintenance({
    required String assetId,
    required String issue,
    required String technician,
    double cost = 0.0,
  }) async {
    state = state.copyWith(isSubmitting: true, errorMessage: null);
    try {
      final newRecord = await _repository.logMaintenance(
        assetId: assetId,
        issue: issue,
        technician: technician,
        cost: cost,
      );
      state = state.copyWith(
        isSubmitting: false,
        records: [newRecord, ...state.records],
      );
      return true;
    } catch (e) {
      state = state.copyWith(
        isSubmitting: false,
        errorMessage: 'Failed to log maintenance: $e',
      );
      return false;
    }
  }

  Future<bool> resolveRecord({
    required String id,
    required String repairAction,
    double cost = 0.0,
  }) async {
    state = state.copyWith(isSubmitting: true, errorMessage: null);
    try {
      final updated = await _repository.resolveMaintenance(
        id: id,
        repairAction: repairAction,
        cost: cost,
      );
      final updatedList = state.records.map((r) => r.id == id ? updated : r).toList();
      state = state.copyWith(isSubmitting: false, records: updatedList);
      return true;
    } catch (e) {
      state = state.copyWith(
        isSubmitting: false,
        errorMessage: 'Failed to resolve ticket: $e',
      );
      return false;
    }
  }
}
