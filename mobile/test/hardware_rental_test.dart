import 'package:flutter_test/flutter_test.dart';
import 'package:techinpedia_employee_app/features/hardware/domain/models/maintenance_record_model.dart';
import 'package:techinpedia_employee_app/features/hardware/domain/models/rental_order_model.dart';

void main() {
  group('RentalOrderModel Tests', () {
    test('Parses rental order JSON correctly with customer and line items', () {
      final json = {
        'id': 'rnt_101',
        'orderNumber': 'TIP-RNT-2026-0042',
        'customerId': 'cust_501',
        'startDate': '2026-10-01T00:00:00Z',
        'endDate': null, // Ongoing lease
        'billingCycle': 'MONTHLY',
        'monthlyRate': 15000.0,
        'securityDeposit': 30000.0,
        'deliveryAddress': 'Plot 42, Cyber City, Sector 29, Gurugram',
        'status': 'ACTIVE',
        'agreementRef':
            '[HANDOVER ACCEPTED & SIGNED] Customer: Rajesh Sharma | Ref: Points: 48 | Strokes: 2',
        'customer': {
          'id': 'cust_501',
          'name': 'Rajesh Sharma',
          'email': 'rajesh@techcorp.in',
          'phone': '+91 98765 43210',
          'company': {'name': 'TechCorp Solutions'},
        },
        'items': [
          {
            'id': 'item_1',
            'rentalOrderId': 'rnt_101',
            'assetId': 'ast_1',
            'rate': 7500.0,
            'returnedAt': null,
            'asset': {
              'id': 'ast_1',
              'assetCode': 'TIP-DEV-01',
              'serialNumber': 'SN-DELL-88902',
              'assetType': 'LAPTOP',
              'brand': 'Dell',
              'model': 'Latitude 5430',
              'specs': 'i7 12th Gen, 32GB RAM, 1TB SSD',
              'status': 'RENTED',
            },
          },
          {
            'id': 'item_2',
            'rentalOrderId': 'rnt_101',
            'assetId': 'ast_2',
            'rate': 7500.0,
            'returnedAt': null,
            'asset': {
              'id': 'ast_2',
              'assetCode': 'TIP-DEV-02',
              'serialNumber': 'SN-DELL-88903',
              'assetType': 'LAPTOP',
              'brand': 'Dell',
              'model': 'Latitude 5430',
              'specs': 'i7 12th Gen, 32GB RAM, 1TB SSD',
              'status': 'RENTED',
            },
          },
        ],
      };

      final order = RentalOrderModel.fromJson(json);

      expect(order.id, 'rnt_101');
      expect(order.orderNumber, 'TIP-RNT-2026-0042');
      expect(order.isActive, isTrue);
      expect(order.isOngoingLease, isTrue);
      expect(order.isSigned, isTrue);
      expect(order.totalUnits, 2);
      expect(order.monthlyRate, 15000.0);
      expect(order.formattedMonthlyRate, '₹15000/mo');
      expect(order.formattedDeposit, '₹30000');
      expect(order.customer?.name, 'Rajesh Sharma');
      expect(order.customer?.companyName, 'TechCorp Solutions');
      expect(order.items.length, 2);

      final firstItem = order.items.first;
      expect(firstItem.asset?.serialNumber, 'SN-DELL-88902');
      expect(firstItem.asset?.displayName, 'Dell Latitude 5430');
      expect(firstItem.isReturned, isFalse);
    });

    test('Identifies pending signature and returned status', () {
      final order = RentalOrderModel(
        id: 'rnt_102',
        orderNumber: 'TIP-RNT-2026-0099',
        customerId: 'cust_2',
        startDate: DateTime.now(),
        endDate: DateTime.now().add(const Duration(days: 90)),
        billingCycle: 'MONTHLY',
        monthlyRate: 8000.0,
        securityDeposit: 16000.0,
        deliveryAddress: 'Noida Sector 62',
        status: 'RETURNED',
        agreementRef: null,
      );

      expect(order.isActive, isFalse);
      expect(order.isReturned, isTrue);
      expect(order.isSigned, isFalse);
      expect(order.isOngoingLease, isFalse);
    });
  });

  group('MaintenanceRecordModel Tests', () {
    test('Parses maintenance record correctly with resolution state', () {
      final json = {
        'id': 'maint_01',
        'assetId': 'ast_1',
        'issue': 'Display screen flickering during operation',
        'repairAction': 'Replaced EDP display cable and updated BIOS',
        'cost': 1200.0,
        'technician': 'Vikram Patel',
        'status': 'RESOLVED',
        'loggedAt': '2026-09-28T09:00:00Z',
        'resolvedAt': '2026-09-29T14:30:00Z',
        'asset': {
          'id': 'ast_1',
          'assetCode': 'TIP-DEV-01',
          'serialNumber': 'SN-DELL-88902',
          'assetType': 'LAPTOP',
          'brand': 'Dell',
          'model': 'Latitude 5430',
          'status': 'AVAILABLE',
        },
      };

      final record = MaintenanceRecordModel.fromJson(json);

      expect(record.id, 'maint_01');
      expect(record.issue, contains('Display screen flickering'));
      expect(record.repairAction, contains('Replaced EDP'));
      expect(record.cost, 1200.0);
      expect(record.technician, 'Vikram Patel');
      expect(record.status, 'RESOLVED');
      expect(record.isResolved, isTrue);
      expect(record.asset?.serialNumber, 'SN-DELL-88902');
    });

    test('Parses in-progress maintenance record', () {
      final record = MaintenanceRecordModel(
        id: 'maint_02',
        assetId: 'ast_2',
        issue: 'Battery health degraded (< 40%)',
        cost: 0.0,
        technician: 'Field Ops',
        status: 'IN_PROGRESS',
        loggedAt: DateTime.now(),
      );

      expect(record.isResolved, isFalse);
      expect(record.status, 'IN_PROGRESS');
    });
  });
}
