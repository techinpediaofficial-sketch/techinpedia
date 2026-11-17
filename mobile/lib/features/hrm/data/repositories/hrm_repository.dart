import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/constants/api_endpoints.dart';
import '../../../../core/network/api_client.dart';
import '../../domain/models/attendance_punch_model.dart';
import '../../domain/models/leave_balance_model.dart';
import '../../domain/models/leave_request_model.dart';
import '../../domain/models/payroll_model.dart';

final hrmRepositoryProvider = Provider<HrmRepository>((ref) {
  final client = ref.watch(apiClientProvider);
  return HrmRepositoryImpl(client);
});

class LeavesDataResult {
  final List<LeaveBalanceModel> balances;
  final List<LeaveRequestModel> leaveRequests;
  final int pendingCount;
  final int approvedCount;
  final int rejectedCount;

  const LeavesDataResult({
    this.balances = const [],
    this.leaveRequests = const [],
    this.pendingCount = 0,
    this.approvedCount = 0,
    this.rejectedCount = 0,
  });
}

abstract class HrmRepository {
  Future<AttendancePunchModel> getPunchStatus();
  Future<AttendancePunchModel> submitPunch({
    required String action, // CLOCK_IN or CLOCK_OUT
    String? notes,
  });
  Future<LeavesDataResult> getLeavesData({
    int? year,
    String? status,
  });
  Future<LeaveRequestModel> applyLeave({
    required String leaveType,
    required DateTime startDate,
    required DateTime endDate,
    required String reason,
    double? daysCount,
  });
  Future<List<PayrollModel>> getPayrollRecords({
    int? month,
    int? year,
  });
}

class HrmRepositoryImpl implements HrmRepository {
  final ApiClient _client;

  HrmRepositoryImpl(this._client);

  @override
  Future<AttendancePunchModel> getPunchStatus() async {
    final response = await _client.get(ApiEndpoints.attendancePunch);
    if (response.data is Map<String, dynamic>) {
      return AttendancePunchModel.fromJson(response.data as Map<String, dynamic>);
    }
    return const AttendancePunchModel(punchState: 'NOT_CHECKED_IN');
  }

  @override
  Future<AttendancePunchModel> submitPunch({
    required String action,
    String? notes,
  }) async {
    final response = await _client.post(
      ApiEndpoints.attendancePunch,
      data: {
        'action': action,
        if (notes != null && notes.isNotEmpty) 'notes': notes,
      },
    );

    if (response.data is Map<String, dynamic>) {
      return AttendancePunchModel.fromJson(response.data as Map<String, dynamic>);
    }
    return const AttendancePunchModel(punchState: 'NOT_CHECKED_IN');
  }

  @override
  Future<LeavesDataResult> getLeavesData({
    int? year,
    String? status,
  }) async {
    final queryParams = <String, dynamic>{};
    if (year != null) queryParams['year'] = year;
    if (status != null && status != 'ALL') queryParams['status'] = status;

    final response = await _client.get(
      ApiEndpoints.leaves,
      queryParameters: queryParams,
    );

    final data = response.data as Map<String, dynamic>? ?? {};

    List<LeaveBalanceModel> balances = [];
    if (data['balances'] is List) {
      balances = (data['balances'] as List)
          .map((b) => LeaveBalanceModel.fromJson(b as Map<String, dynamic>))
          .toList();
    }

    List<LeaveRequestModel> requests = [];
    if (data['leaveRequests'] is List) {
      requests = (data['leaveRequests'] as List)
          .map((r) => LeaveRequestModel.fromJson(r as Map<String, dynamic>))
          .toList();
    }

    final metrics = data['metrics'] as Map<String, dynamic>? ?? {};

    return LeavesDataResult(
      balances: balances,
      leaveRequests: requests,
      pendingCount: (metrics['pendingCount'] as num?)?.toInt() ?? 0,
      approvedCount: (metrics['approvedCount'] as num?)?.toInt() ?? 0,
      rejectedCount: (metrics['rejectedCount'] as num?)?.toInt() ?? 0,
    );
  }

  @override
  Future<LeaveRequestModel> applyLeave({
    required String leaveType,
    required DateTime startDate,
    required DateTime endDate,
    required String reason,
    double? daysCount,
  }) async {
    final payload = <String, dynamic>{
      'leaveType': leaveType,
      'startDate': startDate.toIso8601String(),
      'endDate': endDate.toIso8601String(),
      'reason': reason,
    };
    if (daysCount != null) {
      payload['daysCount'] = daysCount;
    }

    final response = await _client.post(
      ApiEndpoints.leaves,
      data: payload,
    );

    final data = response.data as Map<String, dynamic>? ?? {};
    final reqJson = (data['leaveRequest'] as Map<String, dynamic>?) ?? data;
    return LeaveRequestModel.fromJson(reqJson);
  }

  @override
  Future<List<PayrollModel>> getPayrollRecords({
    int? month,
    int? year,
  }) async {
    final queryParams = <String, dynamic>{};
    if (month != null) queryParams['month'] = month;
    if (year != null) queryParams['year'] = year;

    final response = await _client.get(
      ApiEndpoints.payroll,
      queryParameters: queryParams,
    );

    final data = response.data as Map<String, dynamic>? ?? {};
    if (data['payrolls'] is List) {
      return (data['payrolls'] as List)
          .map((p) => PayrollModel.fromJson(p as Map<String, dynamic>))
          .toList();
    }
    return [];
  }
}
