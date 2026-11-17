import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getLeadWhatsAppLink } from '@/lib/whatsapp';
import { getActiveWhatsAppConfig } from '@/lib/whatsapp_service';
import { verifyMetaSignature } from '@/lib/whatsapp_cloud';
import { normalizePhone, buildPhoneSearchFilters } from '@/lib/phone';
import { recordLeadTimelineEvent, syncLeadToContactAndCompany } from '@/lib/crm';
import { createEnquiry } from '@/lib/crm/create-lead';
import { emitWorkflowEvent } from '@/lib/workflow/eventEmitter';
import { resolveCompanySiteContext } from '@/lib/site-context';
import { ChatbotEngine } from '@/lib/chatbot/flow-engine';
import { IntentEngine } from '@/lib/ai/intent-engine';
import { AIEngine } from '@/lib/ai/ai-engine';
import { executeHumanHandoff } from '@/lib/ai/handoff-engine';
import { AiOrchestrator } from '@/lib/ai/orchestrator';
import { sendWhatsAppTextMessage } from '@/lib/whatsapp_service';

// 1. Meta Webhook Handshake Verification (GET)
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');
  const companyId = searchParams.get('companyId');

  const validTokens = new Set<string>();

  // If companyId query param supplied, prioritize that tenant's configured token
  if (companyId) {
    try {
      const tenantConn = await db.whatsappConnection.findFirst({
        where: { companyId, isActive: true },
        select: { verifyToken: true },
      });
      if (tenantConn?.verifyToken) validTokens.add(tenantConn.verifyToken);

      const comp = await db.company.findUnique({
        where: { id: companyId },
        select: { webhookSecret: true },
      });
      if (comp?.webhookSecret) validTokens.add(comp.webhookSecret);
    } catch (e) {
      console.error('Tenant verify token lookup failed:', e);
    }
  }

  // Also query active platform and tenant connections from DB
  try {
    const connections = await db.whatsappConnection.findMany({
      where: { isActive: true },
      select: { verifyToken: true },
    });
    for (const c of connections) {
      if (c.verifyToken) validTokens.add(c.verifyToken);
    }
  } catch (dbErr) {
    console.error('Failed to query WhatsApp verify tokens from database:', dbErr);
  }

  if (process.env.WHATSAPP_VERIFY_TOKEN) {
    validTokens.add(process.env.WHATSAPP_VERIFY_TOKEN);
  }
  validTokens.add('techinpedia_verify_token_2026');

  if (mode === 'subscribe' && token && validTokens.has(token)) {
    console.log(`✅ WhatsApp Webhook verified successfully by Meta (company: ${companyId || 'platform'})`);
    return new Response(challenge || '', {
      status: 200,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
      },
    });
  }

  console.warn('⚠️ Rejected invalid Meta Webhook handshake — token mismatch or invalid mode.');
  return new Response('Forbidden', { status: 403 });
}

/**
 * Resolves an employee from the company to auto-assign incoming WhatsApp chats.
 * Uses least-loaded assignment (user with fewest open conversations) among active staff.
 */
async function resolveAutoAssignedEmployee(companyId: string | null): Promise<string | null> {
  if (!companyId) return null;
  try {
    const teamMembers = await db.user.findMany({
      where: {
        companyId,
        status: 'ACTIVE',
        role: { in: ['EDITOR', 'ADMIN'] },
      },
      select: { id: true, name: true, role: true },
    });

    if (teamMembers.length === 0) return null;

    // Prioritize staff/editors over owner admin if available
    const staffMembers = teamMembers.filter((m) => m.role === 'EDITOR');
    const candidates = staffMembers.length > 0 ? staffMembers : teamMembers;

    // Least-loaded assignment: Pick the member with fewest open conversations
    const loadCounts = await Promise.all(
      candidates.map(async (member) => {
        const openChats = await db.whatsappConversation.count({
          where: {
            companyId,
            assignedUserId: member.id,
            status: 'OPEN',
          },
        });
        return { userId: member.id, openChats };
      })
    );

    loadCounts.sort((a, b) => a.openChats - b.openChats);
    return loadCounts[0]?.userId || null;
  } catch (err) {
    console.error('Error resolving auto assigned employee:', err);
    return null;
  }
}

// 2. Meta Asynchronous Webhook Processor (POST)
export async function POST(request: Request) {
  let webhookLogId: string | null = null;

  try {
    const { searchParams } = new URL(request.url);
    let companyId: string | null = searchParams.get('companyId');

    const rawBody = await request.text();
    const signature = request.headers.get('x-hub-signature-256');
    const payload = JSON.parse(rawBody);

    const entry = payload.entry?.[0];
    const changes = entry?.changes?.[0];
    const field = changes?.field;
    const value = changes?.value;
    const metadata = value?.metadata;
    const phoneNumberId = metadata?.phone_number_id;
    const wabaId = entry?.id;

    // Resolve companyId automatically if not passed in query params
    if (!companyId && phoneNumberId) {
      const conn = await db.whatsappConnection.findFirst({
        where: { phoneNumberId: String(phoneNumberId), isActive: true },
        select: { companyId: true },
      });
      if (conn?.companyId) companyId = conn.companyId;
    }
    if (!companyId && wabaId) {
      const conn = await db.whatsappConnection.findFirst({
        where: { wabaId: String(wabaId), isActive: true },
        select: { companyId: true },
      });
      if (conn?.companyId) companyId = conn.companyId;
    }

    const { config } = await getActiveWhatsAppConfig(companyId);

    // Verify cryptographic signature if appSecret is configured
    if (config?.appSecret && signature) {
      const isValid = verifyMetaSignature(rawBody, signature, config.appSecret);
      if (!isValid) {
        console.warn('⚠️ Rejected invalid Meta Webhook HMAC signature');
        return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 401 });
      }
    }

    // Track last webhook received timestamp on connection
    if (config?.id) {
      await db.whatsappConnection.update({
        where: { id: config.id },
        data: { lastWebhookReceivedAt: new Date() },
      }).catch(() => {});
    }

    const messages = value?.messages;
    const statuses = value?.statuses;

    // Detect template status update event from Meta
    const isTemplateUpdate = field === 'message_template_status_update' || !!value?.message_template_id;

    // Determine primary meta event identifier for idempotency
    const primaryMsgId =
      messages?.[0]?.id ||
      (statuses?.[0] ? `${statuses[0].id}_${statuses[0].status}` : null) ||
      (isTemplateUpdate ? `tpl_${value?.message_template_id}_${value?.event}_${Date.now()}` : `entry_${entry?.id}_${Date.now()}`);
    const eventType = messages ? 'messages' : statuses ? 'message_status' : isTemplateUpdate ? 'template_status' : 'other';

    // Store raw webhook payload immediately for compliance and audit
    const webhookEvent = await db.whatsappWebhookEvent.create({
      data: {
        companyId,
        metaEventId: primaryMsgId,
        eventType,
        fromPhone: messages?.[0]?.from || statuses?.[0]?.recipient_id || null,
        messageType: messages?.[0]?.type || null,
        payload: rawBody,
        status: 'PENDING',
      },
    }).catch(async (err: any) => {
      // If unique constraint violated on metaEventId, duplicate event received
      if (err.code === 'P2002') {
        console.log(`ℹ️ Duplicate Meta Webhook Event detected and ignored: ${primaryMsgId}`);
        return null;
      }
      throw err;
    });

    if (!webhookEvent) {
      // Event already processed previously (Strict Idempotency)
      return NextResponse.json({ success: true, duplicate: true });
    }

    webhookLogId = webhookEvent.id;

    // ========================================================
    // A. HANDLE INCOMING MESSAGES
    // ========================================================
    if (messages && messages.length > 0) {
      const msg = messages[0];
      const fromRaw = msg.from; // e.g. 919818768680
      const normPhone = normalizePhone(fromRaw);
      const contactInfo = value.contacts?.[0];
      const senderName = contactInfo?.profile?.name || `WhatsApp User ${normPhone.nationalNumber.slice(-4)}`;

      // Parse message content based on official Meta WhatsApp types
      let messageText = '';
      let mediaUrl: string | null = null;
      let mimeType: string | null = null;
      let interactiveData: string | null = null;

      if (msg.type === 'text') {
        messageText = msg.text?.body || '';
      } else if (msg.type === 'interactive') {
        // Quick Reply or List Selection
        if (msg.interactive?.type === 'button_reply') {
          messageText = msg.interactive.button_reply?.title || '[Button Reply]';
          interactiveData = JSON.stringify(msg.interactive.button_reply);
        } else if (msg.interactive?.type === 'list_reply') {
          messageText = msg.interactive.list_reply?.title || '[List Reply]';
          interactiveData = JSON.stringify(msg.interactive.list_reply);
        }
      } else if (msg.type === 'button') {
        messageText = msg.button?.text || '[Button Click]';
        interactiveData = JSON.stringify(msg.button);
      } else if (msg.type === 'reaction') {
        // WhatsApp emoji reactions (e.g. 👍, ❤️, 😂, etc.)
        const emoji = msg.reaction?.emoji || '👍';
        messageText = emoji;
        interactiveData = JSON.stringify(msg.reaction);
      } else if (msg.type === 'sticker') {
        const stickerObj = msg.sticker;
        const mediaId = stickerObj?.id;
        mediaUrl = mediaId ? `/api/whatsapp/media/${mediaId}` : null;
        mimeType = stickerObj?.mime_type || 'image/webp';
        messageText = '🎭 [Sticker]';
      } else if (msg.type === 'audio') {
        const audioObj = msg.audio;
        const mediaId = audioObj?.id;
        mediaUrl = mediaId ? `/api/whatsapp/media/${mediaId}` : null;
        mimeType = audioObj?.mime_type || 'audio/ogg';
        messageText = '🎵 [Voice Note / Audio]';
      } else if (msg.type === 'image') {
        const imgObj = msg.image;
        const mediaId = imgObj?.id;
        mediaUrl = mediaId ? `/api/whatsapp/media/${mediaId}` : null;
        mimeType = imgObj?.mime_type || 'image/jpeg';
        messageText = imgObj?.caption || '🖼️ [Image]';
      } else if (msg.type === 'video') {
        const vidObj = msg.video;
        const mediaId = vidObj?.id;
        mediaUrl = mediaId ? `/api/whatsapp/media/${mediaId}` : null;
        mimeType = vidObj?.mime_type || 'video/mp4';
        messageText = vidObj?.caption || '🎥 [Video]';
      } else if (msg.type === 'document') {
        const docObj = msg.document;
        const mediaId = docObj?.id;
        mediaUrl = mediaId ? `/api/whatsapp/media/${mediaId}` : null;
        mimeType = docObj?.mime_type || 'application/pdf';
        messageText = docObj?.filename || docObj?.caption || '📄 [Document]';
      } else if (msg.type === 'location') {
        messageText = `📍 [Location: ${msg.location?.latitude}, ${msg.location?.longitude} - ${msg.location?.name || ''}]`;
      } else {
        messageText = `[Message type: ${msg.type}]`;
      }

      console.log(`📩 Incoming WhatsApp from ${normPhone.canonical} (${senderName}): "${messageText}"`);

      // 1. Check for OPT-OUT commands (STOP, UNSUBSCRIBE)
      const cleanUpper = messageText.trim().toUpperCase();
      if (['STOP', 'UNSUBSCRIBE', 'OPT OUT', 'OPTOUT', 'CANCEL'].includes(cleanUpper)) {
        await db.whatsappSuppression.upsert({
          where: { phone: normPhone.canonical },
          update: { status: 'OPTED_OUT', reason: 'USER_REQUEST', source: 'INBOUND_REPLY', optedOutAt: new Date() },
          create: {
            phone: normPhone.canonical,
            status: 'OPTED_OUT',
            reason: 'USER_REQUEST',
            source: 'INBOUND_REPLY',
            notes: `Opted out via inbound keyword: "${messageText}"`,
          },
        });
        console.log(`🛑 Contact ${normPhone.canonical} automatically opted-out via inbound keyword.`);
      }

      // PHASE 1.1 FIX: Resolve BU context from WhatsApp connection config.
      // Each WhatsApp connection should belong to a Business Unit.
      // For now, all company WhatsApp connections default to COMPANY_SERVICES.
      // Future: WhatsappConnection model will carry businessUnitId directly.
      // Only associate TechInPedia Business Unit if this is Master TechInPedia WhatsApp (!companyId).
      // For tenant companies (e.g. Hello Mam), do not contaminate with TechInPedia BU/Site.
      let whatsappBUContext: { businessUnitId?: string; siteId?: string } = {};
      if (!companyId) {
        try {
          const companySiteCtx = await resolveCompanySiteContext();
          whatsappBUContext = {
            businessUnitId: companySiteCtx.businessUnitId || undefined,
            siteId: companySiteCtx.siteId || undefined,
          };
        } catch {
          // If COMPANY_PUBLIC site not yet registered, proceed without BU
        }
      }

      // 2. Identify or Create CRM Contact & Lead
      // PHASE 1.1 FIX: Scope phone search to the resolved Business Unit.
      // Do not globally match a phone number across Company AND Marketplace enquiries.
      const searchFilters = buildPhoneSearchFilters(normPhone.canonical);
      let existingLead = await db.enquiry.findFirst({
        where: {
          AND: [
            { OR: searchFilters },
            ...(companyId ? [{ companyId }] : []),
            ...(whatsappBUContext.businessUnitId && !companyId
              ? [{ businessUnitId: whatsappBUContext.businessUnitId }]
              : []),
          ],
        },
      });

      let existingContact = await db.contact.findFirst({
        where: { 
          AND: [
            { OR: searchFilters },
            ...(companyId ? [{ companyId }] : [])
          ]
        },
      });

      // Check company setting: Automatically create lead from new WhatsApp conversation (Default: true)
      let shouldAutoCreateLead = true;
      if (companyId) {
        const autoLeadSetting = await db.setting.findFirst({
          where: { key: `whatsapp_auto_lead_${companyId}` },
        });
        if (autoLeadSetting && (autoLeadSetting.value === 'false' || autoLeadSetting.value === '0')) {
          shouldAutoCreateLead = false;
        }
      }

      if (!existingLead && !existingContact && shouldAutoCreateLead) {
        // Create new CRM Lead using centralized helper with trusted BU context
        existingLead = await createEnquiry({
          name: senderName,
          email: `wa_${normPhone.digitsOnly}@whatsapp.customer`,
          phone: normPhone.canonical,
          message: messageText,
          source: 'WhatsApp Inbound',
          forceBusinessUnitId: whatsappBUContext.businessUnitId,
          forceSiteId: whatsappBUContext.siteId,
          forceCompanyId: companyId || undefined,
        });

        // Update specific fields
        await db.enquiry.update({
          where: { id: existingLead.id },
          data: {
            status: 'NEW',
            priority: 'HIGH',
            temperature: 'HOT',
            score: 55,
          }
        });
        existingLead.status = 'NEW';

        const syncResult = await syncLeadToContactAndCompany(existingLead.id);
        if (syncResult?.contactId) {
          existingContact = await db.contact.findUnique({ where: { id: syncResult.contactId } });
        }
      }

      const linkedLeadId = existingLead?.id || null;
      const linkedContactId = existingContact?.id || null;

      // 3. Upsert WhatsApp Conversation Thread (Unified Team Inbox)
      let conversation = await db.whatsappConversation.findFirst({
        where: {
          waNumber: normPhone.canonical,
          companyId: companyId || null,
        },
      });

      // Auto-assign chat to active employee if not already assigned
      let autoAssignedUserId = existingLead?.assignedEmployeeId || existingLead?.assignedTo || null;
      if (!autoAssignedUserId && (companyId || conversation?.companyId)) {
        autoAssignedUserId = await resolveAutoAssignedEmployee(companyId || conversation?.companyId || null);
      }

      if (!conversation) {
        conversation = await db.whatsappConversation.create({
          data: {
            companyId: companyId || null,
            waNumber: normPhone.canonical,
            customerName: senderName,
            contactId: linkedContactId,
            leadId: linkedLeadId,
            assignedUserId: autoAssignedUserId,
            assignedAt: autoAssignedUserId ? new Date() : null,
            status: 'OPEN',
            priority: 'HIGH',
            unreadCount: 1,
            lastMessageText: messageText,
            lastMessageSender: 'CONTACT',
            lastCustomerActivityAt: new Date(), // Opens/Refreshes 24h Customer Care Window!
          },
        });
      } else {
        const needAssignment = !conversation.assignedUserId && autoAssignedUserId;
        await db.whatsappConversation.update({
          where: { id: conversation.id },
          data: {
            customerName: senderName || conversation.customerName,
            contactId: linkedContactId || conversation.contactId,
            leadId: linkedLeadId || conversation.leadId,
            ...(needAssignment && {
              assignedUserId: autoAssignedUserId,
              assignedAt: new Date(),
            }),
            unreadCount: { increment: 1 },
            lastMessageText: messageText,
            lastMessageSender: 'CONTACT',
            lastMessageAt: new Date(),
            lastCustomerActivityAt: new Date(), // Refreshes 24h Window!
            status: conversation.status === 'CLOSED' ? 'OPEN' : conversation.status,
          },
        });
        if (needAssignment) {
          conversation.assignedUserId = autoAssignedUserId;
        }
      }

      // Also ensure CRM lead inherits the assigned employee
      if (linkedLeadId && autoAssignedUserId && existingLead && !existingLead.assignedTo) {
        try {
          const assignedUser = await db.user.findUnique({
            where: { id: autoAssignedUserId },
            select: { employeeId: true },
          });

          await db.enquiry.update({
            where: { id: linkedLeadId },
            data: {
              assignedTo: autoAssignedUserId,
              ...(assignedUser?.employeeId ? { assignedEmployeeId: assignedUser.employeeId } : {}),
            },
          });
        } catch (leadAssignErr) {
          console.warn('[Webhook] Non-blocking lead assignment note:', leadAssignErr);
        }
      }

      // 4. Record WhatsApp Message in conversation
      await db.whatsappMessage.create({
        data: {
          conversationId: conversation.id,
          metaMessageId: msg.id,
          direction: 'INBOUND',
          senderType: 'CONTACT',
          type: msg.type,
          textBody: messageText,
          mediaUrl,
          mimeType,
          interactiveData,
          status: 'DELIVERED',
          deliveredAt: new Date(),
        },
      });

      // 5. Record Lead Activity Stream Timeline Event
      if (linkedLeadId) {
        await recordLeadTimelineEvent({
          enquiryId: linkedLeadId,
          type: 'WHATSAPP_SENT',
          title: `WhatsApp from ${senderName}`,
          description: messageText,
          metadata: { from: normPhone.canonical, messageId: msg.id, timestamp: msg.timestamp },
          actorEmail: 'whatsapp@meta.api',
        });
      }

      // 6. Update Webhook Event Record
      await db.whatsappWebhookEvent.update({
        where: { id: webhookLogId },
        data: {
          status: 'PROCESSED',
          relatedLeadId: linkedLeadId,
          relatedContactId: linkedContactId,
          relatedConversationId: conversation.id,
          processedAt: new Date(),
        },
      });

      // 7. TEMPLATE ROUTER & PACKAGE WORKFLOW LAYER (Dynamic Button, Package & Greeting Flow)
      // Takes precedence over general chatbot/AI and runs FIRST for turn-based state machine
      let routerHandled = false;
      const effectiveCompanyId = companyId || conversation.companyId;
      if (effectiveCompanyId) {
        try {
          const { TemplateRouter } = await import('@/lib/whatsapp/template_router');
          const routerResult = await TemplateRouter.handleInboundMessage({
            companyId: effectiveCompanyId,
            waNumber: normPhone.canonical,
            conversationId: conversation.id,
            messageText,
            messageType: msg.type,
            interactiveData,
            senderName,
          });

          if (routerResult && routerResult.success) {
            routerHandled = true;
            console.log(`✨ TemplateRouter handled inbound message from ${normPhone.canonical} (action: ${routerResult.actionKey || 'PACKAGE_DISPATCH'})`);
          }
        } catch (routerErr) {
          console.error('TemplateRouter execution error in webhook:', routerErr);
        }
      }

      // 8. Emit Automation Engine Event (ONLY if not already handled by Template Router)
      if (!routerHandled) {
        await emitWorkflowEvent('comm.whatsapp.received', {
          entityId: conversation.id,
          entityType: 'WhatsAppConversation',
          data: {
            companyId: companyId || conversation.companyId || null,
            message: {
              id: msg.id,
              from: normPhone.canonical,
              senderName,
              text: messageText,
              type: msg.type,
              isNewContact: !existingLead && !existingContact,
            },
            lead: {
              id: existingLead?.id || conversation.id,
              name: existingLead?.name || senderName || 'Customer',
              phone: existingLead?.phone || normPhone.canonical,
              service: existingLead?.service || 'General Inquiry',
              companyId: companyId || conversation.companyId || null,
            },
            conversationId: conversation.id,
          },
        });
      }

      // 8.5. Create staff Notification for inbound WhatsApp
      await db.notification.create({
        data: {
          userId: conversation.assignedUserId || null,
          type: 'CRM',
          title: `WhatsApp from ${senderName}`,
          message: messageText.length > 200 ? `${messageText.slice(0, 197)}...` : messageText,
          link: `/admin/whatsapp?tab=inbox&conversationId=${conversation.id}`,
        },
      }).catch(() => {});

      // 9. Production-Grade AI Conversation Orchestration & Support Engine
      if (!routerHandled) {
        try {
          if (effectiveCompanyId && !conversation.isAiPaused && conversation.handoffState !== 'HUMAN_ACTIVE') {
            await AiOrchestrator.handleInboundMessage({
              companyId: effectiveCompanyId,
              conversationId: conversation.id,
              messageText,
              senderPhone: normPhone.canonical,
              senderName,
            });
          } else {
            console.log(`[Webhook] Skipping AI orchestration: isAiPaused=${conversation.isAiPaused}, handoffState=${conversation.handoffState}`);
          }
        } catch (aiErr) {
          console.error('[Webhook] AI Orchestrator execution error:', aiErr);
        }
      }
    }


    // ========================================================
    // B. HANDLE DELIVERY & READ STATUS UPDATES
    // ========================================================
    if (statuses && statuses.length > 0) {
      for (const st of statuses) {
        const metaMsgId = st.id; // wamid.xxx
        const newStatus = st.status?.toUpperCase(); // SENT, DELIVERED, READ, FAILED
        const failureReason = st.errors?.[0]?.message || null;
        const errorCode = st.errors?.[0]?.code ? String(st.errors[0].code) : null;

        // Find existing WhatsAppMessage
        const msgRecord = await db.whatsappMessage.findUnique({
          where: { metaMessageId: metaMsgId },
        });

        if (msgRecord) {
          const updateData: any = {
            status: newStatus,
            failureReason: failureReason || msgRecord.failureReason,
            errorCode: errorCode || msgRecord.errorCode,
          };

          if (newStatus === 'DELIVERED') updateData.deliveredAt = new Date();
          if (newStatus === 'READ') updateData.readAt = new Date();

          await db.whatsappMessage.update({
            where: { id: msgRecord.id },
            data: updateData,
          });

          // If linked to Campaign, update campaign metrics
          if (msgRecord.campaignId) {
            await db.whatsappCampaignRecipient.updateMany({
              where: { metaMessageId: metaMsgId },
              data: {
                status: newStatus,
                errorMessage: failureReason,
                errorCode,
                deliveredAt: newStatus === 'DELIVERED' ? new Date() : undefined,
                readAt: newStatus === 'READ' ? new Date() : undefined,
              },
            });

            if (newStatus === 'DELIVERED') {
              await db.whatsappCampaign.update({
                where: { id: msgRecord.campaignId },
                data: { deliveredCount: { increment: 1 } },
              }).catch(() => {});
            } else if (newStatus === 'READ') {
              await db.whatsappCampaign.update({
                where: { id: msgRecord.campaignId },
                data: { readCount: { increment: 1 } },
              }).catch(() => {});
            } else if (newStatus === 'FAILED') {
              await db.whatsappCampaign.update({
                where: { id: msgRecord.campaignId },
                data: { failedCount: { increment: 1 } },
              }).catch(() => {});
            }
          }

          // Emit status workflow event
          if (newStatus === 'DELIVERED') {
            await emitWorkflowEvent('comm.whatsapp.delivered', {
              entityId: msgRecord.id,
              entityType: 'WhatsAppMessage',
              data: { messageId: metaMsgId, conversationId: msgRecord.conversationId },
            });
          } else if (newStatus === 'FAILED') {
            await emitWorkflowEvent('comm.whatsapp.failed', {
              entityId: msgRecord.id,
              entityType: 'WhatsAppMessage',
              data: { messageId: metaMsgId, error: failureReason, errorCode },
            });
          }
        }
      }

      await db.whatsappWebhookEvent.update({
        where: { id: webhookLogId },
        data: { status: 'PROCESSED', processedAt: new Date() },
      });
    }

    // ========================================================
    // C. HANDLE TEMPLATE STATUS UPDATES (Meta Review Results)
    // ========================================================
    if (isTemplateUpdate || field === 'message_template_status_update') {
      const templateId = String(value?.message_template_id || '');
      const templateName = value?.message_template_name;
      const templateLang = value?.message_template_language;
      const eventStatus = (value?.event || '').toUpperCase(); // APPROVED, REJECTED, PAUSED, PENDING_DELETION
      const reason = value?.reason || value?.other_info?.description || null;

      console.log(`📢 Meta Template Status Webhook: template=${templateName} (${templateId}), status=${eventStatus}, reason=${reason}`);

      let mappedStatus = 'PENDING';
      if (eventStatus === 'APPROVED') mappedStatus = 'APPROVED';
      else if (eventStatus === 'REJECTED') mappedStatus = 'REJECTED';
      else if (eventStatus === 'PAUSED') mappedStatus = 'PAUSED';

      if (templateId || templateName) {
        // Fetch existing template to track status change
        const existingTpl = await db.whatsappTemplate.findFirst({
          where: {
            companyId: companyId || null,
            OR: [
              templateId ? { metaTemplateId: templateId } : undefined,
              templateName ? { name: templateName } : undefined,
            ].filter(Boolean) as any,
          },
        });
        const oldStatus = existingTpl?.status || 'UNKNOWN';

        await db.whatsappTemplate.updateMany({
          where: {
            companyId: companyId || null,
            OR: [
              templateId ? { metaTemplateId: templateId } : undefined,
              templateName ? { name: templateName, ...(templateLang ? { language: templateLang } : {}) } : undefined,
            ].filter(Boolean) as any,
          },
          data: {
            status: mappedStatus,
            rejectionReason: reason,
            lastSyncedAt: new Date(),
          },
        });

        // Trigger TemplateRouter status hook to audit log and dynamically activate mappings
        if (existingTpl) {
          try {
            const { TemplateRouter } = await import('@/lib/whatsapp/template_router');
            await TemplateRouter.onTemplateStatusUpdated(existingTpl.id, oldStatus, mappedStatus);
          } catch {}
        }
      }

      await db.activityLog.create({
        data: {
          action: 'WHATSAPP_TEMPLATE_STATUS_WEBHOOK',
          entityType: 'WhatsAppTemplate',
          metadata: JSON.stringify({
            templateId,
            templateName,
            status: mappedStatus,
            metaEvent: eventStatus,
            reason,
          }),
        },
      }).catch(() => {});

      if (webhookLogId) {
        await db.whatsappWebhookEvent.update({
          where: { id: webhookLogId },
          data: { status: 'PROCESSED', processedAt: new Date() },
        }).catch(() => {});
      }

      return NextResponse.json({ success: true, templateUpdated: true });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('WhatsApp Webhook execution error:', error);
    if (webhookLogId) {
      await db.whatsappWebhookEvent.update({
        where: { id: webhookLogId },
        data: { status: 'FAILED', error: error.message },
      }).catch(() => {});
    }
    return NextResponse.json({ error: 'Webhook processing error', details: error.message }, { status: 500 });
  }
}
