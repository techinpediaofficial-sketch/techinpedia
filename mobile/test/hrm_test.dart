import 'package:flutter_test/flutter_test.dart';
import 'package:techinpedia_employee_app/features/hrm/domain/models/attendance_punch_model.dart';
import 'package:techinpedia_employee_app/features/hrm/domain/models/leave_balance_model.dart';
import 'package:techinpedia_employee_app/features/hrm/domain/models/leave_request_model.dart';
import 'package:techinpedia_employee_app/features/hrm/domain/models/payroll_model.dart';

void main() {
  group('AttendancePunchModel Tests', () {
    test('Parses NOT_CHECKED_IN state correctly', () {
      final json = {
        'success': true,
        'punchState': 'NOT_CHECKED_IN',
        'record': null,
      };

      final punch = AttendancePunchModel.fromJson(json);
      expect(punch.isNotCheckedIn, isTrue);
      expect(punch.isCheckedIn, isFalse);
      expect(punch.isCheckedOut, isFalse);
      expect(punch.formattedCheckIn, equals('--:--'));
      expect(punch.formattedCheckOut, equals('--:--'));
    });

    test('Parses CHECKED_IN record and formats duration', () {
      final checkInTime = DateTime.parse('2026-09-30T09:20:00.000Z');
      final json = {
        'punchState': 'CHECKED_IN',
        'employeeId': 'emp-101',
        'record': {
          'checkIn': checkInTime.toIso8601String(),
          'checkOut': null,
          'status': 'PRESENT',
          'workMinutes': 150,
          'totalHours': 2.5,
          'isLate': false,
        },
      };

      final punch = AttendancePunchModel.fromJson(json);
      expect(punch.isCheckedIn, isTrue);
      expect(punch.isLate, isFalse);
      expect(punch.workMinutes, equals(150));
      expect(punch.formattedDuration, equals('2h 30m'));
    });

    test('Parses CHECKED_OUT with late and early exit flags', () {
      final json = {
        'punchState': 'CHECKED_OUT',
        'record': {
          'checkIn': '2026-09-30T10:15:00.000Z',
          'checkOut': '2026-09-30T17:30:00.000Z',
          'status': 'LATE',
          'workMinutes': 435,
          'totalHours': 7.25,
          'isLate': true,
          'isEarlyExit': true,
        },
      };

      final punch = AttendancePunchModel.fromJson(json);
      expect(punch.isCheckedOut, isTrue);
      expect(punch.isLate, isTrue);
      expect(punch.isEarlyExit, isTrue);
      expect(punch.status, equals('LATE'));
    });
  });

  group('LeaveBalanceModel Tests', () {
    test('Calculates available leave balance accurately', () {
      final model = LeaveBalanceModel(
        leaveType: 'CASUAL',
        year: 2026,
        totalAllocated: 12,
        used: 3,
        pending: 2,
        carriedForward: 1,
      );

      // 12 + 1 - 3 - 2 = 8 available
      expect(model.available, equals(8.0));
      expect(model.displayName, equals('Casual Leave'));
    });

    test('Clamps available leave to zero when over-utilized', () {
      final model = LeaveBalanceModel(
        leaveType: 'SICK',
        year: 2026,
        totalAllocated: 6,
        used: 7,
        pending: 1,
      );

      expect(model.available, equals(0.0));
    });
  });

  group('LeaveRequestModel Tests', () {
    test('Parses from JSON and resolves status getters', () {
      final json = {
        'id': 'leave-999',
        'employeeId': 'emp-01',
        'leaveType': 'CASUAL',
        'startDate': '2026-10-05T00:00:00.000Z',
        'endDate': '2026-10-07T00:00:00.000Z',
        'daysCount': 3.0,
        'reason': 'Family function in hometown',
        'status': 'PENDING',
        'createdAt': '2026-09-30T12:00:00.000Z',
        'employee': {
          'id': 'emp-01',
          'name': 'Rahul Sharma',
          'employeeCode': 'TIP-042',
        },
      };

      final req = LeaveRequestModel.fromJson(json);
      expect(req.id, equals('leave-999'));
      expect(req.isPending, isTrue);
      expect(req.isApproved, isFalse);
      expect(req.daysCount, equals(3.0));
      expect(req.employeeName, equals('Rahul Sharma'));
      expect(req.formattedRange, contains('Oct'));
    });
  });

  group('PayrollModel Tests', () {
    test('Formats net salary with currency symbol and calculates deductions', () {
      final model = PayrollModel(
        month: 9,
        year: 2026,
        basicSalary: 40000,
        hra: 15000,
        specialAllowance: 5000,
        grossSalary: 60000,
        taxDeduction: 3000,
        lossOfPayDeduction: 2000,
        otherDeductions: 500,
        netSalary: 54500,
        status: 'PAID',
        paymentMode: 'BANK_TRANSFER',
      );

      expect(model.monthName, equals('September 2026'));
      expect(model.formattedNetSalary, contains('54,500'));
      expect(model.totalDeductions, equals(5500.0));
      expect(model.status, equals('PAID'));
    });
  });
}
