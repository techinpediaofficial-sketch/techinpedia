class LeaveApprovalModel {
  final String id;
  final String employeeId;
  final String employeeName;
  final String employeeCode;
  final String companyEmail;
  final String departmentName;
  final String teamName;
  final String leaveType;
  final DateTime startDate;
  final DateTime endDate;
  final int daysCount;
  final String reason;
  final String status;
  final String? approvedBy;
  final DateTime createdAt;

  const LeaveApprovalModel({
    required this.id,
    required this.employeeId,
    required this.employeeName,
    required this.employeeCode,
    required this.companyEmail,
    required this.departmentName,
    required this.teamName,
    required this.leaveType,
    required this.startDate,
    required this.endDate,
    required this.daysCount,
    required this.reason,
    required this.status,
    this.approvedBy,
    required this.createdAt,
  });

  bool get isPending => status == 'PENDING';
  bool get isApproved => status == 'APPROVED';
  bool get isRejected => status == 'REJECTED';

  factory LeaveApprovalModel.fromJson(Map<String, dynamic> json) {
    final emp = json['employee'] as Map<String, dynamic>? ?? {};
    final dept = emp['department'] as Map<String, dynamic>? ?? {};
    final team = emp['team'] as Map<String, dynamic>? ?? {};

    return LeaveApprovalModel(
      id: json['id']?.toString() ?? '',
      employeeId: json['employeeId']?.toString() ?? '',
      employeeName: emp['name']?.toString() ?? 'Staff Member',
      employeeCode: emp['employeeCode']?.toString() ?? 'EMP-000',
      companyEmail: emp['companyEmail']?.toString() ?? '',
      departmentName: dept['name']?.toString() ?? 'Operations',
      teamName: team['name']?.toString() ?? '',
      leaveType: json['leaveType']?.toString() ?? 'CASUAL',
      startDate: DateTime.tryParse(json['startDate']?.toString() ?? '') ?? DateTime.now(),
      endDate: DateTime.tryParse(json['endDate']?.toString() ?? '') ?? DateTime.now(),
      daysCount: (json['daysCount'] as num?)?.toInt() ?? 1,
      reason: json['reason']?.toString() ?? 'Personal reasons',
      status: json['status']?.toString() ?? 'PENDING',
      approvedBy: json['approvedBy']?.toString(),
      createdAt: DateTime.tryParse(json['createdAt']?.toString() ?? '') ?? DateTime.now(),
    );
  }
}
