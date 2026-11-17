import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../app/theme/app_colors.dart';
import '../../domain/models/whatsapp_template_model.dart';
import '../controllers/template_controller.dart';

class TemplatePickerBottomSheet extends ConsumerStatefulWidget {
  final String conversationId;
  final String customerName;
  final VoidCallback onTemplateSent;

  const TemplatePickerBottomSheet({
    super.key,
    required this.conversationId,
    required this.customerName,
    required this.onTemplateSent,
  });

  static Future<void> show(
    BuildContext context, {
    required String conversationId,
    required String customerName,
    required VoidCallback onTemplateSent,
  }) {
    return showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (_) => TemplatePickerBottomSheet(
        conversationId: conversationId,
        customerName: customerName,
        onTemplateSent: onTemplateSent,
      ),
    );
  }

  @override
  ConsumerState<TemplatePickerBottomSheet> createState() => _TemplatePickerBottomSheetState();
}

class _TemplatePickerBottomSheetState extends ConsumerState<TemplatePickerBottomSheet> {
  final Map<int, TextEditingController> _paramControllers = {};

  @override
  void dispose() {
    for (final c in _paramControllers.values) {
      c.dispose();
    }
    super.dispose();
  }

  void _setupControllers(WhatsAppTemplateModel template) {
    for (final c in _paramControllers.values) {
      c.dispose();
    }
    _paramControllers.clear();

    final count = template.variableCount;
    for (int i = 1; i <= count; i++) {
      final initialVal = i == 1 && widget.customerName.isNotEmpty ? widget.customerName : '';
      final controller = TextEditingController(text: initialVal);
      controller.addListener(() {
        ref.read(templatePickerControllerProvider.notifier).updateParam(i, controller.text);
      });
      _paramControllers[i] = controller;
    }
  }

  Future<void> _handleSend() async {
    final notifier = ref.read(templatePickerControllerProvider.notifier);
    final success = await notifier.sendTemplate(widget.conversationId);
    if (success && mounted) {
      widget.onTemplateSent();
      Navigator.of(context).pop();
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('WhatsApp Template dispatched successfully!'),
          backgroundColor: AppColors.whatsappGreen,
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(templatePickerControllerProvider);
    final notifier = ref.read(templatePickerControllerProvider.notifier);
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    return Padding(
      padding: EdgeInsets.only(
        left: 20,
        right: 20,
        top: 16,
        bottom: 16 + MediaQuery.of(context).viewInsets.bottom,
      ),
      child: ConstrainedBox(
        constraints: BoxConstraints(
          maxHeight: MediaQuery.of(context).size.height * 0.85,
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Handle bar
            Center(
              child: Container(
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                  color: isDark ? AppColors.borderDark : AppColors.borderLight,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            ),
            const SizedBox(height: 12),

            // Header
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(6),
                      decoration: BoxDecoration(
                        color: AppColors.whatsappGreen.withValues(alpha: 0.15),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: const Icon(
                        Icons.mark_chat_read_rounded,
                        color: AppColors.whatsappGreen,
                        size: 20,
                      ),
                    ),
                    const SizedBox(width: 10),
                    const Text(
                      'Approved WhatsApp Templates',
                      style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                    ),
                  ],
                ),
                IconButton(
                  icon: const Icon(Icons.close_rounded, size: 20),
                  onPressed: () => Navigator.of(context).pop(),
                ),
              ],
            ),
            const SizedBox(height: 12),

            if (state.isLoading) ...[
              const Center(
                child: Padding(
                  padding: EdgeInsets.symmetric(vertical: 40),
                  child: CircularProgressIndicator(),
                ),
              ),
            ] else if (state.templates.isEmpty) ...[
              Padding(
                padding: const EdgeInsets.symmetric(vertical: 30),
                child: Center(
                  child: Column(
                    children: [
                      const Icon(Icons.warning_amber_rounded, size: 40, color: Colors.amber),
                      const SizedBox(height: 10),
                      Text(
                        'No approved templates found.',
                        style: TextStyle(
                          color: isDark ? AppColors.textSecondaryDark : AppColors.textSecondaryLight,
                        ),
                      ),
                      const SizedBox(height: 6),
                      const Text(
                        'Create templates in Admin Web Portal to submit to Meta.',
                        style: TextStyle(fontSize: 12, color: AppColors.textMutedLight),
                      ),
                    ],
                  ),
                ),
              ),
            ] else ...[
              // Template Selector dropdown or chips
              Text(
                'SELECT TEMPLATE',
                style: TextStyle(
                  fontSize: 11,
                  fontWeight: FontWeight.bold,
                  letterSpacing: 0.8,
                  color: isDark ? AppColors.textMutedDark : AppColors.textMutedLight,
                ),
              ),
              const SizedBox(height: 8),

              SizedBox(
                height: 40,
                child: ListView.separated(
                  scrollDirection: Axis.horizontal,
                  itemCount: state.templates.length,
                  separatorBuilder: (context, index) => const SizedBox(width: 8),
                  itemBuilder: (context, index) {
                    final t = state.templates[index];
                    final isSelected = state.selectedTemplate?.id == t.id;
                    return ChoiceChip(
                      selected: isSelected,
                      label: Text(t.name),
                      avatar: Icon(
                        t.category == 'MARKETING'
                            ? Icons.campaign_outlined
                            : Icons.verified_user_outlined,
                        size: 16,
                        color: isSelected ? Colors.white : AppColors.whatsappGreen,
                      ),
                      onSelected: (selected) {
                        if (selected) {
                          notifier.selectTemplate(t, defaultCustomerName: widget.customerName);
                          _setupControllers(t);
                        }
                      },
                    );
                  },
                ),
              ),
              const SizedBox(height: 16),

              // Selected Template Configuration & Live Preview
              if (state.selectedTemplate != null) ...[
                Expanded(
                  child: ListView(
                    shrinkWrap: true,
                    children: [
                      // Parameters inputs if variableCount > 0
                      if (state.selectedTemplate!.variableCount > 0) ...[
                        Text(
                          'TEMPLATE PARAMETERS',
                          style: TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.bold,
                            letterSpacing: 0.8,
                            color: isDark ? AppColors.textMutedDark : AppColors.textMutedLight,
                          ),
                        ),
                        const SizedBox(height: 8),
                        ...List.generate(state.selectedTemplate!.variableCount, (i) {
                          final paramIndex = i + 1;
                          final ctrl = _paramControllers[paramIndex];
                          return Padding(
                            padding: const EdgeInsets.only(bottom: 10),
                            child: TextFormField(
                              controller: ctrl,
                              decoration: InputDecoration(
                                labelText: 'Variable {{$paramIndex}}',
                                hintText: paramIndex == 1 ? 'e.g. ${widget.customerName}' : 'Value',
                                prefixIcon: const Icon(Icons.data_object_rounded, size: 18),
                              ),
                            ),
                          );
                        }),
                        const SizedBox(height: 12),
                      ],

                      // Live Message Preview Box
                      Text(
                        'MESSAGE PREVIEW',
                        style: TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.bold,
                          letterSpacing: 0.8,
                          color: isDark ? AppColors.textMutedDark : AppColors.textMutedLight,
                        ),
                      ),
                      const SizedBox(height: 8),
                      Container(
                        padding: const EdgeInsets.all(14),
                        decoration: BoxDecoration(
                          color: isDark ? AppColors.surfaceDark : AppColors.bubbleInboundLight,
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(
                            color: isDark ? AppColors.borderDark : AppColors.borderLight,
                          ),
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              children: [
                                const Icon(Icons.visibility_outlined, size: 14, color: AppColors.whatsappGreen),
                                const SizedBox(width: 6),
                                Text(
                                  'Customer View Preview',
                                  style: TextStyle(
                                    fontSize: 11,
                                    fontWeight: FontWeight.bold,
                                    color: isDark ? AppColors.textSecondaryDark : AppColors.textSecondaryLight,
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 8),
                            Text(
                              state.selectedTemplate!.renderPreview(
                                List.generate(
                                  state.selectedTemplate!.variableCount,
                                  (i) => state.parameters[i + 1] ?? '',
                                ),
                              ),
                              style: TextStyle(
                                fontSize: 13.5,
                                height: 1.4,
                                color: isDark ? AppColors.textPrimaryDark : AppColors.textPrimaryLight,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 16),

                // Error banner
                if (state.errorMessage != null) ...[
                  Container(
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(
                      color: AppColors.priorityHigh.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Text(
                      state.errorMessage!,
                      style: const TextStyle(color: AppColors.priorityHigh, fontSize: 12),
                    ),
                  ),
                  const SizedBox(height: 12),
                ],

                // Dispatch Button
                FilledButton.icon(
                  onPressed: state.isSending ? null : _handleSend,
                  style: FilledButton.styleFrom(
                    backgroundColor: AppColors.whatsappGreen,
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                  ),
                  icon: state.isSending
                      ? const SizedBox(
                          width: 18,
                          height: 18,
                          child: CircularProgressIndicator(
                            strokeWidth: 2,
                            valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                          ),
                        )
                      : const Icon(Icons.send_rounded, size: 18),
                  label: Text(
                    state.isSending ? 'Dispatching...' : 'Dispatch WhatsApp Template',
                    style: const TextStyle(fontWeight: FontWeight.bold),
                  ),
                ),
              ],
            ],
          ],
        ),
      ),
    );
  }
}
