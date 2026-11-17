class AttendanceRosterModel {
  final String id;
  final String employeeId;
  final String employeeName;
  final String employeeCode;
  final String departmentName;
  final DateTime date;
  final DateTime? punchIn;
  final DateTime? punchOut;
  final int durationMinutes;
  final String status;
  final bool isLate;
  final String? notes;

  const AttendanceRosterModel({
    required this.id,
    required this.employeeId,
    required this.employeeName,
    required this.employeeCode,
    required this.departmentName,
    required this.date,
    this.punchIn,
    this.punchOut,
    required this.durationMinutes,
    required this.status,
    required this.isLate,
    this.notes,
  });

  bool get isPresent => status == 'PRESENT' || status == 'LATE';
  bool get isOnLeave => status == 'ON_LEAVE';
  bool get isHalfDay => status == 'HALF_DAY';

  factory AttendanceRosterModel.fromJson(Map<String, dynamic> json) {
    final emp = json['employee'] as Map<String, dynamic>? ?? {};
    final dept = emp['department'] as Map<String, dynamic>? ?? {};

    return AttendanceRosterModel(
      id: json['id']?.toString() ?? '',
      employeeId: json['employeeId']?.toString() ?? '',
      employeeName: emp['name']?.toString() ?? 'Employee',
      employeeCode: emp['employeeCode']?.toString() ?? 'EMP-000',
      departmentName: dept['name']?.toString() ?? 'Operations',
      date: DateTime.tryParse(json['date']?.toString() ?? '') ?? DateTime.now(),
      punchIn: json['punchIn'] != null ? DateTime.tryParse(json['punchIn'].toString()) : null,
      punchOut: json['punchOut'] != null ? DateTime.tryParse(json['punchOut'].toString()) : null,
      durationMinutes: (json['durationMinutes'] as num?)?.toInt() ?? 0,
      status: json['status']?.toString() ?? 'ABSENT',
      isLate: json['isLate'] == true,
      notes: json['notes']?.toString(),
    );
  }
}
