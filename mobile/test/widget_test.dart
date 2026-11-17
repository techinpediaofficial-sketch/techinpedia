import 'package:flutter_test/flutter_test.dart';
import 'package:techinpedia_employee_app/features/auth/domain/models/user_model.dart';
import 'package:techinpedia_employee_app/features/whatsapp/domain/models/folder_metrics_model.dart';
import 'package:techinpedia_employee_app/features/whatsapp/domain/models/whatsapp_conversation_model.dart';
import 'package:techinpedia_employee_app/features/whatsapp/domain/models/whatsapp_message_model.dart';

void main() {
  group('UserModel and RBAC Permissions Tests', () {
    test('UserModel parses from JSON and evaluates permissions correctly', () {
      final json = {
        'id': 'usr_1001',
        'email': 'rahul.sharma@techinpedia.com',
        'name': 'Rahul Sharma',
        'role': 'MANAGER',
        'companyId': 'comp_01',
        'companyName': 'TechInPedia Corp',
        'permissions': ['whatsapp.view', 'whatsapp.send', 'whatsapp.assign'],
        'employee': {
          'id': 'emp_01',
          'designation': 'Support Lead',
          'department': 'Customer Operations',
          'team': 'Alpha Support',
        },
      };

      final user = UserModel.fromJson(json);

      expect(user.id, 'usr_1001');
      expect(user.name, 'Rahul Sharma');
      expect(user.role, 'MANAGER');
      expect(user.isAdmin, false);
      expect(user.isManager, true);

      // RBAC Permission checks
      expect(user.hasPermission('whatsapp.view'), true);
      expect(user.hasPermission('whatsapp.send'), true);
      expect(user.hasPermission('whatsapp.assign'), true);
      expect(user.hasPermission('admin.delete_user'), false);
    });

    test('Super Admin has implicit bypass for all permissions', () {
      final adminUser = UserModel(
        id: 'usr_super',
        email: 'admin@techinpedia.com',
        name: 'Super Admin',
        role: 'SUPER_ADMIN',
        permissions: [],
      );

      expect(adminUser.isAdmin, true);
      expect(adminUser.hasPermission('any.random.permission'), true);
    });
  });

  group('WhatsAppConversationModel Tests', () {
    test('Parses conversation JSON correctly and resolves displayName and 24h window', () {
      final json = {
        'id': 'conv_99',
        'companyId': 'comp_01',
        'waNumber': '919876543210',
        'customerName': 'Vikram Malhotra',
        'status': 'OPEN',
        'priority': 'HIGH',
        'unreadCount': 3,
        'lastMessageText': 'Can you share the pricing sheet?',
        'lastMessageSender': 'CUSTOMER',
        'lastMessageAt': '2026-09-30T10:15:00Z',
        'is24hWindowActive': true,
        'assignedUser': {
          'id': 'usr_1001',
          'name': 'Rahul Sharma',
        },
      };

      final conversation = WhatsAppConversationModel.fromJson(json);

      expect(conversation.id, 'conv_99');
      expect(conversation.waNumber, '919876543210');
      expect(conversation.displayName, 'Vikram Malhotra');
      expect(conversation.isOpen, true);
      expect(conversation.isHighPriority, true);
      expect(conversation.unreadCount, 3);
      expect(conversation.hasUnread, true);
      expect(conversation.is24hWindowActive, true);
      expect(conversation.assignedUserName, 'Rahul Sharma');
    });

    test('Falls back to waNumber when customerName is empty', () {
      final conversation = WhatsAppConversationModel(
        id: 'conv_100',
        waNumber: '919999888877',
        customerName: '',
      );

      expect(conversation.displayName, '919999888877');
    });
  });

  group('WhatsAppMessageModel and Message Types Tests', () {
    test('Differentiates INBOUND customer message vs OUTBOUND agent message', () {
      final inbound = WhatsAppMessageModel(
        id: 'msg_1',
        conversationId: 'conv_1',
        direction: 'INBOUND',
        senderType: 'CONTACT',
        textBody: 'Hello, need assistance.',
        status: 'READ',
        createdAt: DateTime.now(),
      );

      final outbound = WhatsAppMessageModel(
        id: 'msg_2',
        conversationId: 'conv_1',
        direction: 'OUTBOUND',
        senderType: 'AGENT',
        textBody: 'Sure, how can I help you today?',
        status: 'DELIVERED',
        createdAt: DateTime.now(),
      );

      expect(inbound.isInbound, true);
      expect(inbound.isOutbound, false);
      expect(inbound.isSystem, false);

      expect(outbound.isOutbound, true);
      expect(outbound.isInbound, false);
      expect(outbound.isAgent, true);
    });

    test('Identifies SYSTEM automated workflow messages distinctly', () {
      final systemMsg = WhatsAppMessageModel(
        id: 'msg_bot_1',
        conversationId: 'conv_1',
        direction: 'OUTBOUND',
        senderType: 'SYSTEM',
        textBody: 'Automated greeting message sent to customer.',
        status: 'SENT',
        createdAt: DateTime.now(),
      );

      expect(systemMsg.isSystem, true);
      expect(systemMsg.isSystemMessage, true);
      expect(systemMsg.isAgent, false);
    });
  });

  group('FolderMetricsModel Tests', () {
    test('Parses metrics and computes folder counts accurately', () {
      final json = {
        'ALL': 45,
        'MY_CHATS': 12,
        'UNASSIGNED': 8,
        'UNREAD': 5,
        'WAITING_CUSTOMER': 14,
        'HIGH_PRIORITY': 3,
        'CLOSED': 10,
      };

      final metrics = FolderMetricsModel.fromJson(json);

      expect(metrics.total, 45);
      expect(metrics.mine, 12);
      expect(metrics.unread, 5);
      expect(metrics.unassigned, 8);
      expect(metrics.open, 35); // 45 - 10
      expect(metrics.closed, 10);
    });
  });
}
