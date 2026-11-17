import 'package:flutter_test/flutter_test.dart';
import 'package:techinpedia_employee_app/features/crm/domain/models/lead_model.dart';
import 'package:techinpedia_employee_app/features/crm/domain/models/lead_note_model.dart';
import 'package:techinpedia_employee_app/features/crm/domain/models/lead_timeline_model.dart';

void main() {
  group('CRM LeadModel Tests', () {
    test('Parses lead JSON correctly with metrics and assigned user', () {
      final json = {
        'id': 'enq_5501',
        'name': 'Aditya Verma',
        'email': 'aditya@techinpedia.com',
        'phone': '+91 98187 68680',
        'company': 'Enterprise Solutions Corp',
        'service': 'Mobile Application',
        'status': 'QUALIFIED',
        'score': 85,
        'budget': '5 Lakh - 10 Lakh',
        'estimatedValue': 750000.0,
        'temperature': 'HOT',
        'assignedUser': {
          'id': 'usr_101',
          'name': 'Deepak Sharma',
        },
        'createdAt': '2026-09-30T10:00:00Z',
        'notes': [{'id': 'n1', 'content': 'Very interested'}],
      };

      final lead = LeadModel.fromJson(json);

      expect(lead.id, 'enq_5501');
      expect(lead.displayName, 'Aditya Verma');
      expect(lead.phone, '+91 98187 68680');
      expect(lead.status, 'QUALIFIED');
      expect(lead.statusLabel, 'Qualified');
      expect(lead.score, 85);
      expect(lead.estimatedValue, 750000.0);
      expect(lead.temperature, 'HOT');
      expect(lead.assignedUserName, 'Deepak Sharma');
      expect(lead.notesCount, 1);
    });

    test('Maps all pipeline stage labels correctly', () {
      final leadNew = LeadModel(
        id: '1',
        name: 'A',
        email: 'a@b.com',
        phone: '123',
        status: 'NEW',
        createdAt: DateTime.now(),
      );
      final leadWon = leadNew.copyWith(status: 'WON');
      final leadProp = leadNew.copyWith(status: 'PROPOSAL_SENT');
      final leadNeg = leadNew.copyWith(status: 'NEGOTIATION');

      expect(leadNew.statusLabel, 'New Lead');
      expect(leadWon.statusLabel, 'Won');
      expect(leadProp.statusLabel, 'Proposal Sent');
      expect(leadNeg.statusLabel, 'Negotiation');
    });
  });

  group('LeadTimelineModel and LeadNoteModel Tests', () {
    test('Parses timeline event and formats actor info', () {
      final json = {
        'id': 'evt_1',
        'type': 'WHATSAPP_SENT',
        'title': 'Outbound WhatsApp Sent',
        'description': 'Dispatched quote details',
        'actorEmail': 'agent@techinpedia.com',
        'createdAt': '2026-09-30T11:00:00Z',
      };

      final event = LeadTimelineModel.fromJson(json);
      expect(event.id, 'evt_1');
      expect(event.type, 'WHATSAPP_SENT');
      expect(event.title, 'Outbound WhatsApp Sent');
      expect(event.actorEmail, 'agent@techinpedia.com');
    });

    test('Parses internal lead note and author correctly', () {
      final json = {
        'id': 'note_99',
        'content': 'Client requested discount on annual maintenance.',
        'user': {'name': 'Priya Singh'},
        'createdAt': '2026-09-30T11:30:00Z',
      };

      final note = LeadNoteModel.fromJson(json);
      expect(note.id, 'note_99');
      expect(note.content, contains('discount'));
      expect(note.authorName, 'Priya Singh');
    });
  });
}
