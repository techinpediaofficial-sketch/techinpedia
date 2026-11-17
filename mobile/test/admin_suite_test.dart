import 'package:flutter_test/flutter_test.dart';
import 'package:techinpedia_employee_app/features/admin/domain/models/executive_dashboard_model.dart';
import 'package:techinpedia_employee_app/features/admin/domain/models/leave_approval_model.dart';
import 'package:techinpedia_employee_app/features/admin/domain/models/admin_employee_model.dart';
import 'package:techinpedia_employee_app/features/admin/domain/models/admin_invoice_model.dart';
import 'package:techinpedia_employee_app/features/admin/domain/models/admin_ticket_model.dart';
import 'package:techinpedia_employee_app/features/admin/domain/models/attendance_roster_model.dart';

void main() {
  group('Admin Executive Dashboard Model Tests', () {
    test('Parses executive dashboard metrics accurately from JSON', () {
      final json = {
        'financials': {
          'monthlyRecurringRevenue': 450000.0,
          'totalInvoiced': 1200000.0,
          'totalCollected': 950000.0,
          'outstandingDue': 250000.0,
        },
        'pipeline': {
          'openDealsCount': 18,
          'wonDealsCount': 32,
          'pipelineValue': 3500000.0,
          'winRate': 64.0,
        },
        'delivery': {
          'openTickets': 7,
          'ticketSlaRate': 96,
          'activeProjectsCount': 12,
        },
        'workforce': {
          'totalHeadcount': 25,
          'monthlyPayroll': 850000.0,
        },
      };

      final d = ExecutiveDashboardModel.fromJson(json);
      expect(d.financials.monthlyRecurringRevenue, 450000.0);
      expect(d.financials.outstandingDue, 250000.0);
      expect(d.pipeline.openDealsCount, 18);
      expect(d.pipeline.winRate, 64);
      expect(d.delivery.openTickets, 7);
      expect(d.delivery.ticketSlaRate, 96);
      expect(d.workforce.totalHeadcount, 25);
    });
  });

  group('Admin Leave Approvals Model Tests', () {
    test('Parses leave approval model and resolves status correctly', () {
      final json = {
        'id': 'leave-123',
        'employeeId': 'emp-456',
        'employee': {
          'name': 'Rahul Sharma',
          'employeeCode': 'TIP-042',
          'companyEmail': 'rahul@techinpedia.com',
          'department': {'name': 'Engineering'},
          'team': {'name': 'Backend'},
        },
        'leaveType': 'CASUAL',
        'startDate': '2026-10-10T00:00:00Z',
        'endDate': '2026-10-12T00:00:00Z',
        'daysCount': 3,
        'reason': 'Family function',
        'status': 'PENDING',
        'createdAt': '2026-10-01T10:00:00Z',
      };

      final leave = LeaveApprovalModel.fromJson(json);
      expect(leave.id, 'leave-123');
      expect(leave.employeeName, 'Rahul Sharma');
      expect(leave.employeeCode, 'TIP-042');
      expect(leave.departmentName, 'Engineering');
      expect(leave.daysCount, 3);
      expect(leave.isPending, isTrue);
      expect(leave.isApproved, isFalse);
      expect(leave.isRejected, isFalse);
    });
  });

  group('Admin Employee Model Tests', () {
    test('Parses employee model and resolves Business Unit assignment', () {
      final json = {
        'id': 'emp-99',
        'name': 'Priya Patel',
        'employeeCode': 'TIP-015',
        'companyEmail': 'priya@techinpedia.com',
        'phone': '+919876543210',
        'status': 'ACTIVE',
        'employmentType': 'FULL_TIME',
        'workLocation': 'HYBRID',
        'department': {'name': 'Operations'},
        'designation': {'title': 'Senior Operations Lead'},
        'appRole': {'displayName': 'Manager'},
        'grossSalary': 65000.0,
        'businessUnits': [
          {
            'businessUnit': {
              'id': 'bu-tech',
              'name': 'TechInPedia Services',
              'code': 'TECHINPEDIA_SERVICES',
            }
          }
        ],
      };

      final emp = AdminEmployeeModel.fromJson(json);
      expect(emp.name, 'Priya Patel');
      expect(emp.isActive, isTrue);
      expect(emp.businessUnitName, 'TechInPedia Services');
      expect(emp.businessUnitCode, 'TECHINPEDIA_SERVICES');
      expect(emp.grossSalary, 65000.0);
    });
  });

  group('Admin Invoices Model Tests', () {
    test('Parses invoice model and flags overdue correctly', () {
      final pastDate = DateTime.now().subtract(const Duration(days: 5)).toIso8601String();
      final json = {
        'id': 'inv-01',
        'invoiceNumber': 'INV-2026-088',
        'clientName': 'Global Logistics Corp',
        'clientEmail': 'billing@globallogistics.com',
        'companyName': 'Global Logistics LLC',
        'totalAmount': 150000.0,
        'amountPaid': 50000.0,
        'balanceDue': 100000.0,
        'status': 'SENT',
        'dueDate': pastDate,
      };

      final inv = AdminInvoiceModel.fromJson(json);
      expect(inv.invoiceNumber, 'INV-2026-088');
      expect(inv.balanceDue, 100000.0);
      expect(inv.isPaid, isFalse);
      expect(inv.isOverdue, isTrue);
    });
  });

  group('Admin Tickets Model Tests', () {
    test('Parses ticket model and maps customer company correctly', () {
      final json = {
        'id': 'tick-77',
        'ticketNumber': 'TICK-4421',
        'subject': 'API Integration Webhook Failure',
        'customer': {
          'name': 'Aditya Verma',
          'company': {'name': 'Apex Retailers'},
        },
        'clientEmail': 'aditya@apexretail.com',
        'priority': 'URGENT',
        'status': 'OPEN',
        'category': 'INTEGRATION',
      };

      final ticket = AdminTicketModel.fromJson(json);
      expect(ticket.ticketNumber, 'TICK-4421');
      expect(ticket.priority, 'URGENT');
      expect(ticket.companyName, 'Apex Retailers');
      expect(ticket.isOpen, isTrue);
      expect(ticket.isInProgress, isFalse);
    });
  });

  group('Admin Attendance Roster Model Tests', () {
    test('Parses attendance roster punch and duration', () {
      final json = {
        'id': 'att-55',
        'employee': {
          'name': 'Sameer Khan',
          'employeeCode': 'TIP-031',
          'department': {'name': 'Marketing'},
        },
        'status': 'PRESENT',
        'isLate': true,
        'durationMinutes': 495,
        'notes': 'Traffic delay at toll plaza',
      };

      final att = AttendanceRosterModel.fromJson(json);
      expect(att.employeeName, 'Sameer Khan');
      expect(att.isPresent, isTrue);
      expect(att.isLate, isTrue);
      expect(att.durationMinutes, 495);
      expect(att.notes, 'Traffic delay at toll plaza');
    });
  });
}
