class AdminEmployeeModel {
  final String id;
  final String name;
  final String employeeCode;
  final String companyEmail;
  final String? phone;
  final String status;
  final String employmentType;
  final String workLocation;
  final String departmentName;
  final String teamName;
  final String designationTitle;
  final String appRoleName;
  final String? managerName;
  final double basicSalary;
  final double grossSalary;
  final DateTime joiningDate;
  final String? businessUnitName;
  final String? businessUnitCode;
  final bool hasLoginAccount;

  const AdminEmployeeModel({
    required this.id,
    required this.name,
    required this.employeeCode,
    required this.companyEmail,
    this.phone,
    required this.status,
    required this.employmentType,
    required this.workLocation,
    required this.departmentName,
    required this.teamName,
    required this.designationTitle,
    required this.appRoleName,
    this.managerName,
    required this.basicSalary,
    required this.grossSalary,
    required this.joiningDate,
    this.businessUnitName,
    this.businessUnitCode,
    required this.hasLoginAccount,
  });

  bool get isActive => status == 'ACTIVE';

  factory AdminEmployeeModel.fromJson(Map<String, dynamic> json) {
    final dept = json['department'] as Map<String, dynamic>? ?? {};
    final team = json['team'] as Map<String, dynamic>? ?? {};
    final desig = json['designation'] as Map<String, dynamic>? ?? {};
    final role = json['appRole'] as Map<String, dynamic>? ?? {};
    final mgr = json['manager'] as Map<String, dynamic>? ?? {};
    final user = json['user'] as Map<String, dynamic>?;

    final buList = json['businessUnits'] as List<dynamic>?;
    String? buName;
    String? buCode;
    if (buList != null && buList.isNotEmpty) {
      final firstBu = buList.first as Map<String, dynamic>?;
      final buObj = firstBu?['businessUnit'] as Map<String, dynamic>?;
      buName = buObj?['name']?.toString();
      buCode = buObj?['code']?.toString();
    }

    return AdminEmployeeModel(
      id: json['id']?.toString() ?? '',
      name: json['name']?.toString() ?? 'Staff Member',
      employeeCode: json['employeeCode']?.toString() ?? 'EMP-000',
      companyEmail: json['companyEmail']?.toString() ?? '',
      phone: json['phone']?.toString(),
      status: json['status']?.toString() ?? 'ACTIVE',
      employmentType: json['employmentType']?.toString() ?? 'FULL_TIME',
      workLocation: json['workLocation']?.toString() ?? 'OFFICE',
      departmentName: dept['name']?.toString() ?? 'Operations',
      teamName: team['name']?.toString() ?? '',
      designationTitle: desig['title']?.toString() ?? 'Staff',
      appRoleName: role['displayName']?.toString() ?? role['name']?.toString() ?? 'Employee',
      managerName: mgr['name']?.toString(),
      basicSalary: (json['basicSalary'] as num?)?.toDouble() ?? 0.0,
      grossSalary: (json['grossSalary'] as num?)?.toDouble() ?? 0.0,
      joiningDate: DateTime.tryParse(json['joiningDate']?.toString() ?? '') ?? DateTime.now(),
      businessUnitName: buName,
      businessUnitCode: buCode,
      hasLoginAccount: user != null,
    );
  }
}
