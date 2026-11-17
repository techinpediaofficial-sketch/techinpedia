class ApiEndpoints {
  ApiEndpoints._();

  // Authentication & Session
  static const String login = '/api/auth/login';
  static const String currentUser = '/api/auth/me';
  static const String logout = '/api/auth/logout';

  // WhatsApp Communication CRM
  static const String conversations = '/api/whatsapp/conversations';
  static const String messages = '/api/whatsapp/messages';
  static const String templates = '/api/whatsapp/templates';

  // CRM Leads & Pipeline
  static const String leads = '/api/enquiries';
  static String leadDetails(String id) => '/api/enquiries/$id';
  static String leadNotes(String id) => '/api/enquiries/$id/notes';

  // Mobile Device Registration (FCM)
  static const String registerDevice = '/api/mobile/devices';

  // HRM & Attendance Self-Service
  static const String attendancePunch = '/api/hr/attendance/punch';
  static const String leaves = '/api/hr/leaves';
  static const String payroll = '/api/hr/payroll';
  static const String attendanceRegularize = '/api/hr/attendance/regularize';

  // IT Hardware Rentals & Field Operations
  static const String rentalOrders = '/api/hardware/rentals';
  static String rentalOrderDetails(String id) => '/api/hardware/rentals/$id';
  static const String hardwareMaintenance = '/api/hardware/maintenance';
  static String maintenanceDetails(String id) => '/api/hardware/maintenance/$id';
  static const String amcContracts = '/api/hardware/amc';
  static const String hardwareAssets = '/api/hardware/assets';
}

