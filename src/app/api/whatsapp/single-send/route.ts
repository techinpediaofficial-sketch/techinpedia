import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { logActivity } from '@/lib/activity';
import { canSendWhatsAppMessage, normalizePhoneNumber } from '@/lib/whatsapp-eligibility';
import { sendWhatsAppTextMessage, sendWhatsAppTemplateMessage } from '@/lib/whatsapp_service';

export async function POST(request: Request) {
  try {
    const session = await requireAuth();
    const body = await request.json();

    const {
      phone,
      contactId,
      messageType = 'template', // 'text' | 'template'
      text,
      templateName,
      templateLanguage = 'en_US',
      templateVariables = [],
      mediaUrl,
    } = body;

    const isTenant = session.isTenant;
    const companyId = isTenant && session.companyId ? session.companyId : body.companyId || null;

    let targetPhone = phone;
    let targetContact: any = null;

    if (contactId) {
      targetContact = await db.contact.findUnique({ where: { id: contactId } });
      if (targetContact && targetContact.phone) {
        targetPhone = targetContact.phone;
      }
    }

    if (!targetPhone) {
      return NextResponse.json({ error: 'Destination phone number or contact is required.' }, { status: 400 });
    }

    const canonicalPhone = normalizePhoneNumber(targetPhone);
    const isTemplate = messageType === 'template';

    // 1. Centralized Eligibility & Consent Validation
    const eligibility = await canSendWhatsAppMessage({
      companyId,
      phone: canonicalPhone,
      isMarketing: false, // direct conversational send
      isTemplate,
      templateName,
      senderUserId: session.userId,
    });

    if (!eligibility.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: eligibility.reason,
          code: eligibility.code,
        },
        { status: 400 }
      );
    }

    // 2. Find or create conversation
    let conversation = await db.whatsappConversation.findFirst({
      where: {
        waNumber: canonicalPhone,
        ...(companyId ? { companyId } : {}),
      },
    });

    if (!conversation) {
      conversation = await db.whatsappConversation.create({
        data: {
          waNumber: canonicalPhone,
          customerName: targetContact?.name || null,
          contactId: targetContact?.id || null,
          companyId,
          status: 'OPEN',
          priority: 'MEDIUM',
          lastMessageText: isTemplate ? `[Template: ${templateName}]` : text,
          lastMessageSender: 'AGENT',
          lastMessageAt: new Date(),
        },
      });
    }

    // 3. Dispatch Message
    let sendResult: any;

    if (isTemplate) {
      if (!templateName) {
        return NextResponse.json({ error: 'Template name is required for template messages.' }, { status: 400 });
      }
      sendResult = await sendWhatsAppTemplateMessage(
        canonicalPhone,
        templateName,
        templateLanguage,
        templateVariables,
        mediaUrl || undefined,
        {
          conversationId: conversation.id,
          companyId,
        }
      );
    } else {
      if (!text || !text.trim()) {
        return NextResponse.json({ error: 'Message text cannot be empty.' }, { status: 400 });
      }
      sendResult = await sendWhatsAppTextMessage(canonicalPhone, text.trim(), {
        conversationId: conversation.id,
        senderUserId: session.userId,
        companyId,
      });
    }

    if (!sendResult.success) {
      // Record failed message attempt
      await db.whatsappMessage.create({
        data: {
          conversationId: conversation.id,
          direction: 'OUTBOUND',
          senderType: 'AGENT',
          senderUserId: session.userId,
          type: isTemplate ? 'template' : 'text',
          textBody: isTemplate ? `Template: ${templateName}` : text,
          templateName: isTemplate ? templateName : null,
          status: 'FAILED',
          failureReason: sendResult.error || 'Meta API delivery failed',
          errorCode: String(sendResult.metaCode || 'SEND_ERROR'),
        },
      });

      return NextResponse.json(
        {
          success: false,
          error: sendResult.error,
          hint: sendResult.hint,
          metaCode: sendResult.metaCode,
        },
        { status: 422 }
      );
    }

    await logActivity({
      userId: session.userId,
      userEmail: session.email,
      action: 'SINGLE_SEND_WHATSAPP',
      entityType: 'WhatsappMessage',
      entityId: sendResult.messageId || conversation.id,
      metadata: {
        phone: canonicalPhone,
        messageType,
        templateName,
        messageId: sendResult.messageId,
        companyId,
      },
    });

    return NextResponse.json({
      success: true,
      messageId: sendResult.messageId,
      conversationId: conversation.id,
      status: 'SENT',
      message: 'WhatsApp message dispatched successfully.',
    });
  } catch (error: any) {
    console.error('Single send error:', error);
    return NextResponse.json({ error: error.message || 'Failed to dispatch message.' }, { status: 500 });
  }
}
