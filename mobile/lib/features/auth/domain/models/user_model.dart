class UserModel {
  final String id;
  final String name;
  final String email;
  final String role;
  final bool mustChangePassword;
  final String? companyId;
  final String? companyName;
  final String? companyRole;
  final bool isTenant;
  final String? tenantStatus;
  final List<String> allowedModules;
  final List<String> permissions;

  // Resolved Employee Identity
  final String? employeeId;
  final String? employeeCode;
  final String? employeeName;
  final String? departmentName;
  final String? teamName;
  final String? designationTitle;

  const UserModel({
    required this.id,
    required this.name,
    required this.email,
    required this.role,
    this.mustChangePassword = false,
    this.companyId,
    this.companyName,
    this.companyRole,
    this.isTenant = false,
    this.tenantStatus,
    this.allowedModules = const [],
    this.permissions = const [],
    this.employeeId,
    this.employeeCode,
    this.employeeName,
    this.departmentName,
    this.teamName,
    this.designationTitle,
  });

  bool get isAdmin => role == 'SUPER_ADMIN' || role == 'ADMIN';
  bool get isManager => role == 'MANAGER' || role == 'TEAM_LEADER';

  bool hasPermission(String permissionCode) {
    if (role == 'SUPER_ADMIN') return true;
    return permissions.contains(permissionCode);
  }

  factory UserModel.fromJson(Map<String, dynamic> json) {
    final user = json['user'] is Map<String, dynamic> ? json['user'] as Map<String, dynamic> : json;
    final session = json['session'] is Map<String, dynamic> ? json['session'] as Map<String, dynamic> : null;

    final permissionsList = (user['permissions'] as List<dynamic>?)
            ?.map((e) => e.toString())
            .toList() ??
        (session?['permissions'] as List<dynamic>?)
            ?.map((e) => e.toString())
            .toList() ??
        [];

    final modulesList = (user['allowedModules'] as List<dynamic>?)
            ?.map((e) => e.toString())
            .toList() ??
        [];

    return UserModel(
      id: user['id']?.toString() ?? '',
      name: user['name']?.toString() ?? 'Staff Member',
      email: user['email']?.toString() ?? '',
      role: user['role']?.toString() ?? 'EMPLOYEE',
      mustChangePassword: user['mustChangePassword'] == true,
      companyId: user['companyId']?.toString(),
      companyName: user['companyName']?.toString(),
      companyRole: user['companyRole']?.toString(),
      isTenant: user['isTenant'] == true,
      tenantStatus: user['tenantStatus']?.toString(),
      allowedModules: modulesList,
      permissions: permissionsList,
      employeeId: session?['employeeId']?.toString() ?? user['employeeId']?.toString(),
      employeeCode: session?['employeeCode']?.toString(),
      employeeName: session?['employeeName']?.toString(),
      departmentName: session?['departmentName']?.toString(),
      teamName: session?['teamName']?.toString(),
      designationTitle: session?['designationTitle']?.toString(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'email': email,
      'role': role,
      'mustChangePassword': mustChangePassword,
      'companyId': companyId,
      'companyName': companyName,
      'companyRole': companyRole,
      'isTenant': isTenant,
      'tenantStatus': tenantStatus,
      'allowedModules': allowedModules,
      'permissions': permissions,
      'employeeId': employeeId,
      'employeeCode': employeeCode,
      'employeeName': employeeName,
      'departmentName': departmentName,
      'teamName': teamName,
      'designationTitle': designationTitle,
    };
  }
}
