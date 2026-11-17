import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { hasPermission } from '@/lib/permissions';
import { sendWhatsAppTextMessage, sendWhatsAppTemplateMessage } from '@/lib/whatsapp_service';
import { recordLeadTimelineEvent } from '@/lib/crm';
import { canUserAccessConversation } from '@/lib/access-policy';

// 1. GET: Fetch Messages in Conversation Thread & Enriched 360° CRM Context
export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session || (!hasPermission(session, 'whatsapp.inbox.view') && !hasPermission(session, 'comm.whatsapp.view'))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get('conversationId');

    if (!conversationId) {
      const targetCompanyId = session.isTenant || session.companyId
        ? session.companyId
        : (searchParams.get('companyId') || null);

      const status = searchParams.get('status');
      const messageType = searchParams.get('messageType');
      const campaignId = searchParams.get('campaignId');
      const senderUserId = searchParams.get('senderUserId');
      const phone = searchParams.get('phone');
      const dateFrom = searchParams.get('dateFrom');
      const dateTo = searchParams.get('dateTo');
      const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
      const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '30')));
      const skip = (page - 1) * limit;

      const where: any = {};
      if (targetCompanyId && targetCompanyId !== 'ALL' && targetCompanyId !== 'master') {
        where.conversation = { companyId: targetCompanyId };
      }
      if (status) where.status = status;
      if (messageType) where.type = messageType;
      if (campaignId) where.campaignId = campaignId;
      if (senderUserId) where.senderUserId = senderUserId;
      if (phone) {
        where.conversation = {
          ...(where.conversation || {}),
          waNumber: { contains: phone.replace(/[^0-9]/g, '').slice(-10) },
        };
      }
      if (dateFrom || dateTo) {
        where.createdAt = {};
        if (dateFrom) where.createdAt.gte = new Date(dateFrom);
        if (dateTo) where.createdAt.lte = new Date(dateTo);
      }

      const [total, messages] = await Promise.all([
        db.whatsappMessage.count({ where }),
        db.whatsappMessage.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
          include: {
            conversation: {
              select: {
                id: true,
                waNumber: true,
                customerName: true,
                companyId: true,
                assignedUserId: true,
              },
            },
          },
        }),
      ]);

      return NextResponse.json({
        messages,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      });
    }

    // Fetch conversation first for access control
    const conversation = await db.whatsappConversation.findUnique({
      where: { id: conversationId },
    });

    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    // SECURITY CHECK: canUserAccessConversation
    const access = await canUserAccessConversation(session, conversation);
    if (!access.allowed) {
      return NextResponse.json({ error: 'Forbidden: ' + access.reason }, { status: 403 });
    }

    // Track firstViewedAt on first view after assignment (do not overwrite on subsequent views)
    if (
      session.userId === conversation.assignedUserId &&
      !conversation.firstViewedAt &&
      conversation.assignedAt
    ) {
      await db.whatsappConversation.update({
        where: { id: conversation.id },
        data: { firstViewedAt: new Date() },
      }).catch(() => {});
    }

    // Mark unread count as 0
    await db.whatsappConversation.update({
      where: { id: conversationId },
      data: { unreadCount: 0 },
    }).catch(() => {});

    const messages = await db.whatsappMessage.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'asc' },
      take: 200,
    });

    // Resolve template details for all template messages
    const templateNames = Array.from(
      new Set(
        messages
          .map((m) => m.templateName || (m.textBody?.startsWith('[Template: ') ? m.textBody.replace('[Template: ', '').replace(']', '').trim() : null))
          .filter(Boolean)
      )
    ) as string[];

    let templatesMap: Record<string, any> = {};
    if (templateNames.length > 0) {
      const templateRecords = await db.whatsappTemplate.findMany({
        where: {
          name: { in: templateNames },
          ...(conversation?.companyId ? { companyId: conversation.companyId } : {}),
        },
        select: {
          id: true,
          name: true,
          category: true,
          language: true,
          headerType: true,
          headerContent: true,
          bodyText: true,
          footerText: true,
          buttonsConfig: true,
        },
      });
      templateRecords.forEach((t) => {
        templatesMap[t.name] = t;
      });
    }

    // Attach template details and replace legacy placeholder string if needed
    const enrichedMessages = messages.map((m) => {
      const tplName = m.templateName || (m.textBody?.startsWith('[Template: ') ? m.textBody.replace('[Template: ', '').replace(']', '').trim() : null);
      const tpl = tplName ? templatesMap[tplName] : null;
      let resolvedText = m.textBody;
      if (tpl?.bodyText && (!resolvedText || resolvedText.startsWith('[Template: '))) {
        resolvedText = tpl.bodyText;
        if (m.templateVariables) {
          try {
            const vars = JSON.parse(m.templateVariables);
            if (Array.isArray(vars)) {
              vars.forEach((v: string, i: number) => {
                resolvedText = (resolvedText || '').replaceAll(`{{${i + 1}}}`, v);
              });
            }
          } catch {}
        }
      }

      return {
        ...m,
        textBody: resolvedText,
        template: tpl || null,
      };
    });

    // Also fetch company's active templates for the template picker modal
    const companyTemplates = await db.whatsappTemplate.findMany({
      where: {
        companyId: conversation.companyId || null,
        status: { in: ['APPROVED', 'ACTIVE'] },
      },
      orderBy: { name: 'asc' },
    });

    let lead: any = null;
    let customer: any = null;
    let contact: any = null;
    let followUps: any[] = [];
    let proposals: any[] = [];
    let deals: any[] = [];
    let timeline: any[] = [];
    let internalNotes: any[] = [];

    if (conversation?.leadId) {
      lead = await db.enquiry.findUnique({
        where: { id: conversation.leadId },
        include: {
          assignedUser: { select: { id: true, name: true, email: true } },
          assignedEmployee: { select: { id: true, name: true, employeeCode: true, designation: true } },
        },
      });

      followUps = await db.followUp.findMany({
        where: { enquiryId: conversation.leadId },
        orderBy: { scheduledAt: 'desc' },
        take: 10,
      });

      timeline = await db.leadTimelineEvent.findMany({
        where: { enquiryId: conversation.leadId },
        orderBy: { createdAt: 'desc' },
        take: 15,
      });

      internalNotes = await db.enquiryNote.findMany({
        where: { enquiryId: conversation.leadId },
        include: { user: { select: { id: true, name: true, email: true } } },
        orderBy: { createdAt: 'desc' },
        take: 20,
      });
    }

    if (conversation?.contactId) {
      contact = await db.contact.findUnique({
        where: { id: conversation.contactId },
        include: { company: true },
      });
    }

    if (conversation?.customerId) {
      customer = await db.customer.findUnique({
        where: { id: conversation.customerId },
      });
    }

    // Proposals linked to either lead or phone number
    proposals = await db.proposal.findMany({
      where: {
        OR: [
          ...(conversation?.leadId ? [{ enquiryId: conversation.leadId }] : []),
          ...(conversation?.waNumber ? [{ clientPhone: conversation.waNumber }] : []),
          ...(contact?.phone ? [{ clientPhone: contact.phone }] : []),
        ],
      },
      select: {
        id: true,
        proposalNumber: true,
        title: true,
        status: true,
        grandTotal: true,
        validUntil: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    // Deals linked to contact or lead
    deals = await db.deal.findMany({
      where: {
        OR: [
          ...(conversation?.contactId ? [{ contactId: conversation.contactId }] : []),
          ...(conversation?.leadId ? [{ enquiry: { id: conversation.leadId } }] : []),
        ],
      },
      include: { stage: true },
      take: 5,
    });

    const is24hWindowActive = conversation?.lastCustomerActivityAt
      ? Date.now() - new Date(conversation.lastCustomerActivityAt).getTime() <= 24 * 60 * 60 * 1000
      : false;

    return NextResponse.json({
      messages: enrichedMessages,
      templates: companyTemplates,
      conversation,
      crmContext: {
        lead,
        customer,
        contact,
        followUps,
        proposals,
        deals,
        timeline,
        internalNotes,
      },
      is24hWindowActive,
    });
  } catch (error: any) {
    console.error('Messages GET error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch messages' }, { status: 500 });
  }
}

// 2. POST: Dispatch Outbound Message or Record Internal Team Note
export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session || (!hasPermission(session, 'whatsapp.send') && !hasPermission(session, 'comm.whatsapp.send'))) {
      return NextResponse.json({ error: 'Forbidden: Missing whatsapp.send permission' }, { status: 403 });
    }

    const body = await request.json();
    const {
      conversationId,
      type = 'text',
      text,
      templateName,
      templateParams = [],
      headerMediaUrl,
      isInternalNote = false,
      companyId,
    } = body;

    if (!conversationId) {
      return NextResponse.json({ error: 'conversationId is required' }, { status: 400 });
    }

    const conversation = await db.whatsappConversation.findUnique({
      where: { id: conversationId },
    });

    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    // SECURITY CHECK: canUserAccessConversation
    const access = await canUserAccessConversation(session, conversation);
    if (!access.allowed) {
      return NextResponse.json({ error: 'Forbidden: ' + access.reason }, { status: 403 });
    }

    const url = new URL(request.url);
    const queryCompanyId = url.searchParams.get('companyId');
    const rawCompanyId = companyId || queryCompanyId;
    const targetCompanyId = conversation.companyId || (session.isTenant ? session.companyId : (rawCompanyId && rawCompanyId !== 'master' && rawCompanyId !== 'ALL' ? rawCompanyId : null));

    if (!conversation.companyId && targetCompanyId) {
      await db.whatsappConversation.update({
        where: { id: conversation.id },
        data: { companyId: targetCompanyId },
      }).catch(() => {});
    }

    // Helper: track first outbound customer response after assignment
    const recordFirstResponseMetric = async () => {
      try {
        if (!conversation.firstResponseAt && conversation.assignedAt) {
          await db.whatsappConversation.update({
            where: { id: conversation.id },
            data: { firstResponseAt: new Date() },
          });
        }
        if (conversation.leadId) {
          await db.enquiry.updateMany({
            where: { id: conversation.leadId, firstResponseAt: null, assignedAt: { not: null } },
            data: { firstResponseAt: new Date() },
          });
        }
      } catch (err) {
        console.error('Failed to update firstResponseAt metric:', err);
      }
    };

    // A. Handle Internal Team Note (Private - Never sent to Meta)
    if (isInternalNote) {
      if (!text || !text.trim()) {
        return NextResponse.json({ error: 'Note text cannot be empty' }, { status: 400 });
      }

      const noteMsg = await db.whatsappMessage.create({
        data: {
          conversationId: conversation.id,
          direction: 'OUTBOUND',
          senderType: 'AGENT',
          senderUserId: session.userId,
          type: 'internal_note',
          textBody: text.trim(),
          status: 'INTERNAL',
        },
      });

      if (conversation.leadId) {
        await db.enquiryNote.create({
          data: {
            enquiryId: conversation.leadId,
            userId: session.userId,
            note: text.trim(),
          },
        }).catch(() => {});

        await recordLeadTimelineEvent({
          enquiryId: conversation.leadId,
          type: 'NOTE_ADDED',
          title: 'Internal Team Note',
          description: text.trim(),
          actorEmail: session.email,
        });
      }

      return NextResponse.json({ success: true, message: noteMsg, isInternalNote: true });
    }

    const is24hWindowActive = conversation.lastCustomerActivityAt
      ? Date.now() - new Date(conversation.lastCustomerActivityAt).getTime() <= 24 * 60 * 60 * 1000
      : false;

    // B. Plain Text WhatsApp Message: Validate 24-hour Customer Care Window
    if (type === 'text') {
      if (!text || !text.trim()) {
        return NextResponse.json({ error: 'Message text cannot be empty' }, { status: 400 });
      }

      if (!is24hWindowActive && conversation.lastCustomerActivityAt) {
        return NextResponse.json({
          success: false,
          error: 'The 24-hour customer care window has expired. Meta policy requires an approved WhatsApp Template to re-open conversation.',
          requiresTemplate: true,
          hint: 'Please select an approved template to message this contact, or click "Send Template" in the composer.',
        }, { status: 400 });
      }

      const result = await sendWhatsAppTextMessage(conversation.waNumber, text.trim(), {
        conversationId: conversation.id,
        senderUserId: session.userId,
        companyId: targetCompanyId || null,
      });

      if (!result.success) {
        return NextResponse.json({
          success: false,
          error: result.error || 'Failed to send WhatsApp message',
          metaCode: (result as any).metaCode,
          hint: (result as any).hint,
          requiresTemplate: (result as any).metaCode === 131047 || result.error?.includes('131047'),
        }, { status: 400 });
      }

      // Track firstResponseAt
      await recordFirstResponseMetric();

      // Log to CRM Timeline
      if (conversation.leadId) {
        await recordLeadTimelineEvent({
          enquiryId: conversation.leadId,
          type: 'WHATSAPP_SENT',
          title: 'Outbound WhatsApp Sent',
          description: text.trim().slice(0, 160),
          actorEmail: session.email,
        });
      }

      return NextResponse.json({ success: true, messageId: result.messageId });
    }

    // C. Template WhatsApp Message
    if (type === 'template') {
      if (!templateName) {
        return NextResponse.json({ error: 'Template name is required' }, { status: 400 });
      }

      // Auto-detect template language from registered template or fallback
      const tplRecord = await db.whatsappTemplate.findFirst({
        where: { name: templateName, companyId: targetCompanyId || null },
      });
      const languageCode = body.language || tplRecord?.language || 'en_US';

      const result = await sendWhatsAppTemplateMessage(
        conversation.waNumber,
        templateName,
        languageCode,
        templateParams,
        headerMediaUrl,
        { conversationId: conversation.id, companyId: targetCompanyId || null }
      );

      if (!result.success) {
        return NextResponse.json({
          success: false,
          error: result.error || 'Failed to send template message',
          metaCode: (result as any).metaCode,
          hint: (result as any).hint,
        }, { status: 400 });
      }

      // Track firstResponseAt
      await recordFirstResponseMetric();

      if (conversation.leadId) {
        await recordLeadTimelineEvent({
          enquiryId: conversation.leadId,
          type: 'WHATSAPP_SENT',
          title: `WhatsApp Template Sent (${templateName})`,
          description: `Dispatched approved Meta template to ${conversation.waNumber}`,
          actorEmail: session.email,
        });
      }

      return NextResponse.json({ success: true, messageId: result.messageId });
    }

    return NextResponse.json({ error: 'Unsupported message type' }, { status: 400 });
  } catch (error: any) {
    console.error('Messages POST error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Failed to send message' }, { status: 400 });
  }
}
