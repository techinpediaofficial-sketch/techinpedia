abstract class AppException implements Exception {
  final String message;
  final int? statusCode;
  final dynamic details;

  const AppException(this.message, {this.statusCode, this.details});

  @override
  String toString() => message;
}

class NetworkException extends AppException {
  const NetworkException([super.message = 'No internet connection. Please check your network.']);
}

class TimeoutException extends AppException {
  const TimeoutException([super.message = 'Request timed out. Please try again.']);
}

class AuthException extends AppException {
  const AuthException(super.message, {super.statusCode, super.details});
}

class ForbiddenException extends AppException {
  const ForbiddenException([super.message = 'Access denied. You lack permissions for this action.'])
      : super(statusCode: 403);
}

class Meta24HourWindowException extends AppException {
  final bool requiresTemplate;
  final String? hint;

  const Meta24HourWindowException(
    super.message, {
    this.requiresTemplate = true,
    this.hint,
    super.statusCode = 400,
  });
}

class ServerException extends AppException {
  const ServerException([super.message = 'An internal server error occurred. Please try again later.'])
      : super(statusCode: 500);
}

class ValidationException extends AppException {
  const ValidationException(super.message, {super.statusCode = 400, super.details});
}
