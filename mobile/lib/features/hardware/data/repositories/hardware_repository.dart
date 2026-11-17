import '../../../../core/constants/api_endpoints.dart';
import '../../../../core/network/api_client.dart';
import '../../domain/models/maintenance_record_model.dart';
import '../../domain/models/rental_order_model.dart';

abstract class HardwareRepository {
  Future<({List<RentalOrderModel> orders, RentalOrderMetrics metrics})> getRentalOrders({
    String? status,
    String? search,
  });

  Future<RentalOrderModel> getRentalOrderDetails(String id);

  Future<RentalOrderModel> updateRentalStatus({
    required String id,
    required String status,
    String? agreementRef,
  });

  Future<RentalOrderModel> recordCustomerSignature({
    required String id,
    required String customerName,
    required String signatureSummary,
  });

  Future<({List<MaintenanceRecordModel> records, MaintenanceMetrics metrics})> getMaintenanceRecords({
    String? status,
  });

  Future<MaintenanceRecordModel> logMaintenance({
    required String assetId,
    required String issue,
    required String technician,
    double cost = 0.0,
  });

  Future<MaintenanceRecordModel> resolveMaintenance({
    required String id,
    required String repairAction,
    double cost = 0.0,
  });

  Future<List<RentalAssetModel>> getHardwareAssets();
}

class HardwareRepositoryImpl implements HardwareRepository {
  final ApiClient _apiClient;

  HardwareRepositoryImpl(this._apiClient);

  @override
  Future<({List<RentalOrderModel> orders, RentalOrderMetrics metrics})> getRentalOrders({
    String? status,
    String? search,
  }) async {
    final queryParams = <String, dynamic>{};
    if (status != null && status != 'ALL') queryParams['status'] = status;
    if (search != null && search.trim().isNotEmpty) queryParams['search'] = search.trim();

    final response = await _apiClient.get(
      ApiEndpoints.rentalOrders,
      queryParameters: queryParams,
    );

    final data = response.data;
    if (data == null || data['orders'] == null) {
      return (orders: <RentalOrderModel>[], metrics: const RentalOrderMetrics());
    }

    final rawOrders = data['orders'] as List<dynamic>? ?? [];
    final orders = rawOrders
        .map((o) => RentalOrderModel.fromJson(o as Map<String, dynamic>))
        .toList();

    final metrics = data['metrics'] != null
        ? RentalOrderMetrics.fromJson(data['metrics'] as Map<String, dynamic>)
        : const RentalOrderMetrics();

    return (orders: orders, metrics: metrics);
  }

  @override
  Future<RentalOrderModel> getRentalOrderDetails(String id) async {
    final response = await _apiClient.get(ApiEndpoints.rentalOrderDetails(id));
    final data = response.data;
    final rawOrder = data['order'] ?? data;
    return RentalOrderModel.fromJson(rawOrder as Map<String, dynamic>);
  }

  @override
  Future<RentalOrderModel> updateRentalStatus({
    required String id,
    required String status,
    String? agreementRef,
  }) async {
    final body = <String, dynamic>{
      'status': status,
    };
    if (agreementRef != null) body['agreementRef'] = agreementRef;

    final response = await _apiClient.patch(
      ApiEndpoints.rentalOrderDetails(id),
      data: body,
    );

    final data = response.data;
    final rawOrder = data['order'] ?? data;
    return RentalOrderModel.fromJson(rawOrder as Map<String, dynamic>);
  }

  @override
  Future<RentalOrderModel> recordCustomerSignature({
    required String id,
    required String customerName,
    required String signatureSummary,
  }) async {
    final now = DateTime.now();
    final signatureNote =
        '[HANDOVER ACCEPTED & SIGNED] Customer: $customerName | Verified: ${now.toIso8601String()} | Ref: $signatureSummary';

    final response = await _apiClient.patch(
      ApiEndpoints.rentalOrderDetails(id),
      data: {
        'agreementRef': signatureNote,
      },
    );

    final data = response.data;
    final rawOrder = data['order'] ?? data;
    return RentalOrderModel.fromJson(rawOrder as Map<String, dynamic>);
  }

  @override
  Future<({List<MaintenanceRecordModel> records, MaintenanceMetrics metrics})> getMaintenanceRecords({
    String? status,
  }) async {
    final queryParams = <String, dynamic>{};
    if (status != null && status != 'ALL') queryParams['status'] = status;

    final response = await _apiClient.get(
      ApiEndpoints.hardwareMaintenance,
      queryParameters: queryParams,
    );

    final data = response.data;
    if (data == null || data['records'] == null) {
      return (records: <MaintenanceRecordModel>[], metrics: const MaintenanceMetrics());
    }

    final rawRecords = data['records'] as List<dynamic>? ?? [];
    final records = rawRecords
        .map((r) => MaintenanceRecordModel.fromJson(r as Map<String, dynamic>))
        .toList();

    final metrics = data['metrics'] != null
        ? MaintenanceMetrics.fromJson(data['metrics'] as Map<String, dynamic>)
        : const MaintenanceMetrics();

    return (records: records, metrics: metrics);
  }

  @override
  Future<MaintenanceRecordModel> logMaintenance({
    required String assetId,
    required String issue,
    required String technician,
    double cost = 0.0,
  }) async {
    final response = await _apiClient.post(
      ApiEndpoints.hardwareMaintenance,
      data: {
        'assetId': assetId,
        'issue': issue,
        'technician': technician,
        'cost': cost,
      },
    );

    final data = response.data;
    final raw = data['record'] ?? data;
    return MaintenanceRecordModel.fromJson(raw as Map<String, dynamic>);
  }

  @override
  Future<MaintenanceRecordModel> resolveMaintenance({
    required String id,
    required String repairAction,
    double cost = 0.0,
  }) async {
    final response = await _apiClient.patch(
      ApiEndpoints.maintenanceDetails(id),
      data: {
        'status': 'RESOLVED',
        'repairAction': repairAction,
        'cost': cost,
      },
    );

    final data = response.data;
    final raw = data['record'] ?? data;
    return MaintenanceRecordModel.fromJson(raw as Map<String, dynamic>);
  }

  @override
  Future<List<RentalAssetModel>> getHardwareAssets() async {
    final response = await _apiClient.get(ApiEndpoints.hardwareAssets);
    final data = response.data;
    final rawAssets = (data['assets'] ?? data) as List<dynamic>? ?? [];
    return rawAssets
        .map((a) => RentalAssetModel.fromJson(a as Map<String, dynamic>))
        .toList();
  }
}
