import 'package:dio/dio.dart';
import '../errors/app_exception.dart';

typedef OnUnauthorizedCallback = void Function();

class ErrorInterceptor extends Interceptor {
  OnUnauthorizedCallback? onUnauthorized;

  ErrorInterceptor({this.onUnauthorized});

  @override
  void onError(DioException err, ErrorInterceptorHandler handler) {
    final response = err.response;
    final statusCode = response?.statusCode;

    AppException appException;

    if (err.type == DioExceptionType.connectionTimeout ||
        err.type == DioExceptionType.sendTimeout ||
        err.type == DioExceptionType.receiveTimeout) {
      appException = const TimeoutException();
    } else if (err.type == DioExceptionType.connectionError) {
      appException = const NetworkException();
    } else if (statusCode != null) {
      final data = response?.data;
      String errorMessage = 'Request failed';
      if (data is Map<String, dynamic>) {
        errorMessage = data['error'] ?? data['message'] ?? errorMessage;
      }

      switch (statusCode) {
        case 401:
          // Do not trigger session expired on the login endpoint itself
          final reqPath = err.requestOptions.path;
          if (!reqPath.contains('/auth/login')) {
            onUnauthorized?.call();
          }
          appException = AuthException(errorMessage, statusCode: 401);
          break;

        case 403:
          appException = ForbiddenException(errorMessage);
          break;
        case 400:
          final isMeta24h = data is Map && (data['requiresTemplate'] == true || errorMessage.contains('24-hour'));
          if (isMeta24h) {
            appException = Meta24HourWindowException(
              errorMessage,
              requiresTemplate: true,
              hint: data['hint'] as String?,
            );
          } else {
            appException = ValidationException(errorMessage, statusCode: 400, details: data);
          }
          break;
        case 404:
          appException = ValidationException(errorMessage, statusCode: 404);
          break;
        case 500:
        default:
          appException = ServerException(errorMessage);
          break;
      }
    } else {
      appException = NetworkException(err.message ?? 'Network error occurred');
    }

    final modifiedError = DioException(
      requestOptions: err.requestOptions,
      response: err.response,
      type: err.type,
      error: appException,
      message: appException.message,
    );

    return handler.next(modifiedError);
  }
}
