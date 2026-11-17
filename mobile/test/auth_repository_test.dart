import 'package:flutter_test/flutter_test.dart';
import 'package:techinpedia_employee_app/core/errors/app_exception.dart';

void main() {
  group('AppException and Error Mapping Tests', () {
    test('Meta24HourWindowException provides user guidance flag', () {
      const exception = Meta24HourWindowException(
        '24-hour customer service window has expired.',
        requiresTemplate: true,
        hint: 'Use an approved template.',
      );

      expect(exception.requiresTemplate, true);
      expect(exception.statusCode, 400);
      expect(exception.hint, 'Use an approved template.');
      expect(exception.message, contains('24-hour'));
    });

    test('ForbiddenException defaults to 403 status', () {
      const exception = ForbiddenException();
      expect(exception.statusCode, 403);
      expect(exception.message, contains('Access denied'));
    });

    test('NetworkException defaults to friendly message', () {
      const exception = NetworkException();
      expect(exception.message, contains('No internet connection'));
    });
  });

  group('Login Input Validation Logic Tests', () {
    String? validateIdentifier(String? value) {
      if (value == null || value.trim().isEmpty) {
        return 'Please enter your email or username';
      }
      return null;
    }

    String? validatePassword(String? value) {
      if (value == null || value.isEmpty) {
        return 'Please enter your password';
      }
      return null;
    }

    test('Identifier validator rejects empty or whitespace-only strings', () {
      expect(validateIdentifier(null), isNotNull);
      expect(validateIdentifier(''), isNotNull);
      expect(validateIdentifier('   '), isNotNull);
      expect(validateIdentifier('employee@techinpedia.com'), isNull);
      expect(validateIdentifier('admin_user'), isNull);
    });

    test('Password validator rejects empty strings', () {
      expect(validatePassword(null), isNotNull);
      expect(validatePassword(''), isNotNull);
      expect(validatePassword('SecurePassword123'), isNull);
    });
  });
}
