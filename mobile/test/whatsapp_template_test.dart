import 'package:flutter_test/flutter_test.dart';
import 'package:techinpedia_employee_app/features/whatsapp/domain/models/whatsapp_template_model.dart';

void main() {
  group('WhatsAppTemplateModel Tests', () {
    test('Parses template JSON and calculates variableCount correctly', () {
      final json = {
        'id': 'tpl_001',
        'name': 'techinpedia_customer_care_v1',
        'category': 'UTILITY',
        'language': 'en_US',
        'status': 'APPROVED',
        'bodyText': 'Hello {{1}}, thank you for contacting TechInPedia regarding {{2}}. An advisor will call you shortly.',
        'headerType': 'TEXT',
        'exampleValues': ['Aditya', 'Mobile App Development'],
      };

      final template = WhatsAppTemplateModel.fromJson(json);

      expect(template.id, 'tpl_001');
      expect(template.name, 'techinpedia_customer_care_v1');
      expect(template.isApproved, true);
      expect(template.variableCount, 2);
    });

    test('Renders dynamic variable parameter preview accurately', () {
      const template = WhatsAppTemplateModel(
        id: 'tpl_002',
        name: 'welcome_template',
        category: 'MARKETING',
        status: 'APPROVED',
        bodyText: 'Namaste {{1}} ji, welcome to TechInPedia! Your ticket is #{{2}}.',
      );

      final rendered = template.renderPreview(['Vikram', '10499']);
      expect(rendered, 'Namaste Vikram ji, welcome to TechInPedia! Your ticket is #10499.');

      final partialRendered = template.renderPreview(['Vikram']);
      expect(partialRendered, contains('[Variable 2]'));
    });

    test('Identifies non-approved templates correctly', () {
      const pending = WhatsAppTemplateModel(
        id: 'tpl_pending',
        name: 'promo_blast',
        category: 'MARKETING',
        status: 'PENDING',
      );

      expect(pending.isApproved, false);
    });
  });
}
