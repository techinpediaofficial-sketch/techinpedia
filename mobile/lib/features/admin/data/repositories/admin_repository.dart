import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/network/api_client.dart';
import '../../domain/models/admin_employee_model.dart';
import '../../domain/models/admin_invoice_model.dart';
import '../../domain/models/admin_ticket_model.dart';
import '../../domain/models/attendance_roster_model.dart';
import '../../domain/models/executive_dashboard_model.dart';
import '../../domain/models/leave_approval_model.dart';

final adminRepositoryProvider = Provider<AdminRepository>((ref) {
  final apiClient = ref.watch(apiClientProvider);
  return AdminRepository(apiClient);
});

class AdminRepository {
  final ApiClient _client;

  AdminRepository(this._client);

  /// Fetch Executive Command Center Metrics & KPIs
  Future<ExecutiveDashboardModel> getExecutiveDashboard() async {
    final response = await _client.get('/api/dashboards/executive');
    final data = response.data as Map<String, dynamic>;
    return ExecutiveDashboardModel.fromJson(data);
  }

  /// Fetch Staff Leave Requests
  Future<List<LeaveApprovalModel>> getLeaveRequests({String? status}) async {
    final queryParams = <String, dynamic>{};
    if (status != null && status != 'ALL') {
      queryParams['status'] = status;
    }

    final response = await _client.get(
      '/api/hr/leaves',
      queryParameters: queryParams,
    );
    final data = response.data as Map<String, dynamic>;
    final list = data['leaveRequests'] as List<dynamic>? ?? [];
    return list.map((item) => LeaveApprovalModel.fromJson(item as Map<String, dynamic>)).toList();
  }

  /// Approve or Reject a Staff Leave Request
  Future<void> reviewLeaveRequest({
    required String leaveId,
    required String status,
  }) async {
    await _client.patch(
      '/api/hr/leaves',
      data: {
        'leaveId': leaveId,
        'status': status,
      },
    );
  }

  /// Fetch Full Company Employee Directory
  Future<List<AdminEmployeeModel>> getEmployees({
    String? search,
    String? departmentId,
    String? businessUnitId,
  }) async {
    final queryParams = <String, dynamic>{'limit': 100};
    if (search != null && search.isNotEmpty) queryParams['search'] = search;
    if (departmentId != null && departmentId.isNotEmpty) queryParams['departmentId'] = departmentId;
    if (businessUnitId != null && businessUnitId.isNotEmpty) queryParams['businessUnitId'] = businessUnitId;

    final response = await _client.get(
      '/api/hr/employees',
      queryParameters: queryParams,
    );
    final data = response.data as Map<String, dynamic>;
    final list = data['employees'] as List<dynamic>? ?? [];
    return list.map((item) => AdminEmployeeModel.fromJson(item as Map<String, dynamic>)).toList();
  }

  /// Fetch Invoices & Client Billing
  Future<List<AdminInvoiceModel>> getInvoices({
    String? status,
    String? search,
  }) async {
    final queryParams = <String, dynamic>{};
    if (status != null && status != 'ALL') queryParams['status'] = status;
    if (search != null && search.isNotEmpty) queryParams['search'] = search;

    final response = await _client.get(
      '/api/finance/invoices',
      queryParameters: queryParams,
    );
    final data = response.data as Map<String, dynamic>;
    final list = data['invoices'] as List<dynamic>? ?? [];
    return list.map((item) => AdminInvoiceModel.fromJson(item as Map<String, dynamic>)).toList();
  }

  /// Fetch Support & Service Helpdesk Tickets
  Future<List<AdminTicketModel>> getTickets({
    String? status,
    String? priority,
  }) async {
    final queryParams = <String, dynamic>{};
    if (status != null && status != 'ALL') queryParams['status'] = status;
    if (priority != null && priority != 'ALL') queryParams['priority'] = priority;

    final response = await _client.get(
      '/api/support/tickets',
      queryParameters: queryParams,
    );
    final data = response.data as Map<String, dynamic>;
    final list = data['tickets'] as List<dynamic>? ?? [];
    return list.map((item) => AdminTicketModel.fromJson(item as Map<String, dynamic>)).toList();
  }

  /// Update Ticket Lifecycle Status
  Future<void> updateTicketStatus({
    required String ticketId,
    required String status,
  }) async {
    await _client.patch(
      '/api/support/tickets/$ticketId',
      data: {'status': status},
    );
  }

  /// Fetch Today's Live Attendance Roster
  Future<List<AttendanceRosterModel>> getTodayAttendanceRoster() async {
    final response = await _client.get('/api/hr/attendance');
    final data = response.data as Map<String, dynamic>;
    final list = data['records'] as List<dynamic>? ?? [];
    return list.map((item) => AttendanceRosterModel.fromJson(item as Map<String, dynamic>)).toList();
  }
}
