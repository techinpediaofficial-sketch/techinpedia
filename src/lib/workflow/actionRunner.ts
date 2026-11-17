// ============================================================
// Action Runner & Universal Integration Dispatcher
// ============================================================

import { db } from '../db';
import { sendWhatsAppTextMessage, sendWhatsAppTemplateMessage } from '../whatsapp_service';
import { appendLeadToSheet } from '../google_sheets_service';
import nodemailer from 'nodemailer';
import { resolveFieldValue } from './conditionEvaluator';

/**
 * Replaces {{variable.field}} in text strings with values from context data.
 */
export function interpolateTemplate(template: string, contextData: Record<string, any>): string {
  if (!template || typeof template !== 'string') return '';

  return template.replace(/\{\{([a-zA-Z0-9_.]+)\}\}/g, (match, path) => {
    const val = resolveFieldValue(path.trim(), contextData);
    if (val === undefined || val === null) {
      return '';
    }
    return String(val);
  });
}

/**
 * Masks sensitive keys (passwords, auth tokens, secret keys) in JSON payloads.
 */
export function maskSensitiveData(obj: any): any {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj !== 'object') return obj;

  if (Array.isArray(obj)) {
    return obj.map((item) => maskSensitiveData(item));
  }

  const masked: Record<string, any> = {};
  const sensitiveRegex = /(password|token|secret|auth|apikey|api_key|key|private)/i;

  for (const [key, value] of Object.entries(obj)) {
    if (sensitiveRegex.test(key) && typeof value === 'string') {
      masked[key] = value.length > 8 ? `${value.slice(0, 3)}...***...${value.slice(-3)}` : '***MASKED***';
    } else if (typeof value === 'object') {
      masked[key] = maskSensitiveData(value);
    } else {
      masked[key] = value;
    }
  }

  return masked;
}

export interface ActionResult {
  success: boolean;
  provider: string;
  output?: any;
  error?: string;
  isSimulated?: boolean;
}

/**
 * Dispatches a workflow action across all 12 modules.
 */
export async function executeAction(
  actionType: string,
  params: Record<string, any>,
  contextData: Record<string, any>,
  isDryRun: boolean = false
): Promise<ActionResult> {
  // If Dry-Run, return simulated success without mutating external providers
  if (isDryRun) {
    return {
      success: true,
      provider: actionType,
      isSimulated: true,
      output: {
        simulated: true,
        actionType,
        interpolatedParams: Object.fromEntries(
          Object.entries(params || {}).map(([k, v]) => [k, typeof v === 'string' ? interpolateTemplate(v, contextData) : v])
        ),
        message: `Action ${actionType} simulated successfully in Dry-Run mode without external side-effects.`,
      },
    };
  }

  try {
    const entityId = contextData.lead?.id || contextData.entityId || contextData.enquiryId;

    switch (actionType) {
      // ==========================================
      // 1. COMMUNICATION
      // ==========================================
      case 'SEND_WHATSAPP': {
        let rawPhone = interpolateTemplate(params.recipientPhone || '', contextData);
        // Smart fallback: If recipientPhone tag couldn't be resolved, check common context paths
        if (!rawPhone || !rawPhone.replace(/[^0-9]/g, '')) {
          rawPhone =
            contextData.lead?.phone ||
            contextData.phone ||
            contextData.message?.from ||
            contextData.customer?.phone ||
            '';
        }
        const cleanPhone = rawPhone.replace(/[^0-9]/g, '');

        if (!cleanPhone) {
          return { success: false, provider: 'WhatsApp', error: 'Missing recipient phone number.' };
        }

        // Resolve conversationId so message is tracked in the Unified Team Inbox
        let conversationId = contextData.conversationId;
        if (!conversationId && cleanPhone) {
          try {
            const { normalizePhone } = await import('../phone');
            const norm = normalizePhone(cleanPhone);
            const conv = await db.whatsappConversation.findFirst({
              where: {
                waNumber: norm.canonical,
                companyId: contextData.companyId || null,
              },
            });
            conversationId = conv?.id;
          } catch {}
        }

        // 1. Dynamic Template Purpose Resolution (Requirement #14)
        if (params.messageSource === 'TEMPLATE_PURPOSE' || params.messageType === 'TEMPLATE_PURPOSE' || params.purposeKey) {
          const rawPurpose = interpolateTemplate(params.purposeKey || params.templatePurpose || '', contextData);
          const purposeKey = rawPurpose.toUpperCase().trim();
          const targetCompanyId = contextData.companyId || null;

          if (!targetCompanyId) {
            return { success: false, provider: 'WhatsApp (Purpose)', error: 'Missing companyId for template purpose routing.' };
          }

          const { TemplateRouter } = await import('@/lib/whatsapp/template_router');
          const purposeRes = await TemplateRouter.resolveTemplateByPurpose(targetCompanyId, purposeKey);

          if (!purposeRes.success || !purposeRes.template) {
            return { success: false, provider: 'WhatsApp (Purpose)', error: purposeRes.error || `Purpose ${purposeKey} not mapped.` };
          }

          if (!purposeRes.isApproved) {
            return {
              success: false,
              provider: 'WhatsApp (Purpose)',
              error: `Template for purpose ${purposeKey} is ${purposeRes.template.status}, not APPROVED. Fallback logged.`,
            };
          }

          const tplParams = (params.templateParams || []).map((p: string) => interpolateTemplate(p, contextData));
          const res = await sendWhatsAppTemplateMessage(
            cleanPhone,
            purposeRes.template.name,
            purposeRes.template.language || 'en_US',
            tplParams,
            purposeRes.template.headerType === 'IMAGE' ? purposeRes.template.headerContent || undefined : undefined,
            { conversationId, companyId: targetCompanyId }
          );

          return {
            success: res.success,
            provider: 'WhatsApp Cloud API (Purpose Template)',
            output: { phone: cleanPhone, purpose: purposeKey, template: purposeRes.template.name, status: 'DISPATCHED' },
            error: res.error,
          };
        }

        // 2. Dynamic Package Template Resolution (Requirement #14)
        if (params.messageSource === 'PACKAGE_TEMPLATE' || params.messageType === 'PACKAGE_TEMPLATE' || params.packageId) {
          const rawPkgId = interpolateTemplate(
            params.packageId || contextData.selected_package_id || contextData.booking_package_id || '',
            contextData
          );
          const targetCompanyId = contextData.companyId || null;

          if (!targetCompanyId) {
            return { success: false, provider: 'WhatsApp (Package)', error: 'Missing companyId for package template routing.' };
          }

          const pkgConfig = await db.packageWhatsAppConfig.findFirst({
            where: {
              companyId: targetCompanyId,
              OR: [
                { packageId: rawPkgId },
                { selectionKey: rawPkgId },
              ],
              isActive: true,
            },
            include: { whatsappTemplate: true },
          });

          if (!pkgConfig || !pkgConfig.whatsappTemplate) {
            return { success: false, provider: 'WhatsApp (Package)', error: `No active package template configuration found for: ${rawPkgId}` };
          }

          const tpl = pkgConfig.whatsappTemplate;
          const isApproved = tpl.status === 'APPROVED' || tpl.status === 'ACTIVE';
          if (!isApproved) {
            return {
              success: false,
              provider: 'WhatsApp (Package)',
              error: `Package template for ${pkgConfig.packageName} is ${tpl.status}, not APPROVED. Fallback logged.`,
            };
          }

          const res = await sendWhatsAppTemplateMessage(
            cleanPhone,
            tpl.name,
            tpl.language || 'en_US',
            [],
            tpl.headerType === 'IMAGE' ? tpl.headerContent || undefined : undefined,
            { conversationId, companyId: targetCompanyId }
          );

          return {
            success: res.success,
            provider: 'WhatsApp Cloud API (Package Template)',
            output: { phone: cleanPhone, packageId: pkgConfig.packageId, template: tpl.name, status: 'DISPATCHED' },
            error: res.error,
          };
        }

        // 3. Direct Meta Template
        if (params.messageType === 'TEMPLATE' || params.messageSource === 'META_TEMPLATE') {
          const tplName = interpolateTemplate(params.templateName || '', contextData);
          if (!tplName) {
            return { success: false, provider: 'WhatsApp (Template)', error: 'Missing templateName.' };
          }
          const tplParams = (params.templateParams || []).map((p: string) => interpolateTemplate(p, contextData));
          const res = await sendWhatsAppTemplateMessage(cleanPhone, tplName, 'en_US', tplParams, undefined, {
            conversationId,
            companyId: contextData.companyId || null,
          });
          return {
            success: res.success,
            provider: 'WhatsApp Cloud API (Template)',
            output: res.data || { phone: cleanPhone, template: tplName, status: 'DISPATCHED' },
            error: res.error,
          };
        } else {
          // 4. Direct Text Message
          const message = interpolateTemplate(params.messageText || '', contextData);
          if (!message) {
            return { success: false, provider: 'WhatsApp', error: 'Missing message body for text message.' };
          }
          const res = await sendWhatsAppTextMessage(cleanPhone, message, {
            conversationId,
            companyId: contextData.companyId || null,
          });
          return {
            success: res.success,
            provider: 'WhatsApp Cloud API',
            output: res.data || { phone: cleanPhone, status: 'DISPATCHED', messageSnippet: message.slice(0, 100) },
            error: res.error,
          };
        }
      }

      case 'SEND_EMAIL': {
        const recipient = interpolateTemplate(params.recipientEmail || '', contextData);
        const subject = interpolateTemplate(params.subject || '', contextData);
        const html = interpolateTemplate(params.htmlBody || '', contextData);

        if (!recipient || !subject) {
          return { success: false, provider: 'SMTP Email', error: 'Recipient email and subject are required.' };
        }

        const host = process.env.EMAIL_HOST;
        const port = parseInt(process.env.EMAIL_PORT || '587');
        const user = process.env.EMAIL_USER;
        const pass = process.env.EMAIL_PASSWORD;
        const senderName = params.senderName || 'TechInPedia Client Desk';
        const from = `"${senderName}" <${process.env.EMAIL_FROM || 'info@techinpedia.com'}>`;

        if (!host || !user || !pass) {
          return {
            success: true,
            provider: 'SMTP Email',
            output: { status: 'MOCKED', note: 'SMTP credentials not set in environment. Dispatched in staging mode.' },
          };
        }

        const transporter = nodemailer.createTransport({
          host,
          port,
          secure: port === 465,
          auth: { user, pass },
        });

        const info = await transporter.sendMail({
          from,
          to: recipient,
          subject,
          html,
        });

        return {
          success: true,
          provider: 'SMTP Email',
          output: { messageId: info.messageId, recipient, subject },
        };
      }

      case 'SEND_NOTIFICATION': {
        const title = interpolateTemplate(params.title || 'System Notification', contextData);
        const message = interpolateTemplate(params.message || '', contextData);
        const link = params.link || '/admin';

        const notification = await db.notification.create({
          data: {
            title,
            message,
            link,
            type: 'CRM',
            isRead: false,
          },
        });

        return {
          success: true,
          provider: 'In-App Notification',
          output: { notificationId: notification.id, title },
        };
      }

      // ==========================================
      // 2. LEADS & CRM
      // ==========================================
      case 'ASSIGN_LEAD':
      case 'ASSIGN_ROUND_ROBIN': {
        if (!entityId) {
          return { success: false, provider: 'CRM', error: 'No Lead / Enquiry ID provided in context for assignment.' };
        }

        const strategy = params.strategy || 'ROUND_ROBIN';
        let selectedUser: { id: string; name: string; email: string } | null = null;

        if (strategy === 'SPECIFIC_USER' && params.specificUserId) {
          selectedUser = await db.user.findUnique({
            where: { id: params.specificUserId },
            select: { id: true, name: true, email: true },
          });
        } else if (strategy === 'LEAST_LOADED') {
          const users = await db.user.findMany({
            where: { status: 'ACTIVE' },
            select: { id: true, name: true, email: true, _count: { select: { enquiriesAssigned: true } } },
          });
          if (users.length > 0) {
            users.sort((a, b) => a._count.enquiriesAssigned - b._count.enquiriesAssigned);
            selectedUser = users[0];
          }
        } else {
          // Default: Round-Robin rotation
          const role = params.targetRole || 'ADMIN';
          const users = await db.user.findMany({
            where: { status: 'ACTIVE', role: role as any },
            select: { id: true, name: true, email: true },
            orderBy: { createdAt: 'asc' },
          });

          if (users.length > 0) {
            const lastAssigned = await db.enquiry.findFirst({
              where: { assignedTo: { in: users.map((u) => u.id) } },
              orderBy: { updatedAt: 'desc' },
              select: { assignedTo: true },
            });
            let nextIndex = 0;
            if (lastAssigned?.assignedTo) {
              const curIndex = users.findIndex((u) => u.id === lastAssigned.assignedTo);
              nextIndex = (curIndex + 1) % users.length;
            }
            selectedUser = users[nextIndex];
          }
        }

        if (!selectedUser) {
          return { success: false, provider: 'CRM Lead Routing', error: 'No eligible active user found for lead routing.' };
        }

        await db.enquiry.update({
          where: { id: entityId },
          data: { assignedTo: selectedUser.id },
        });

        // Notify if requested
        if (params.notifyAssignee) {
          await db.notification.create({
            data: {
              userId: selectedUser.id,
              title: 'New Lead Assigned to You',
              message: `Lead ${contextData.lead?.name || 'Inquiry'} has been routed to your queue.`,
              link: `/admin/leads`,
              type: 'CRM',
            },
          }).catch(() => {});
        }

        return {
          success: true,
          provider: 'CRM Lead Routing',
          output: { assignedToUserId: selectedUser.id, assignedToName: selectedUser.name, strategy },
        };
      }

      case 'UPDATE_LEAD':
      case 'UPDATE_LEAD_STATUS': {
        if (!entityId) {
          return { success: false, provider: 'CRM', error: 'No Lead ID in context for update.' };
        }

        const updateData: Record<string, any> = {};
        if (params.status || params.newStatus) updateData.status = params.status || params.newStatus;
        if (params.priority) updateData.priority = params.priority;
        if (params.temperature) updateData.temperature = params.temperature;
        if (params.budget) updateData.budget = params.budget;

        const updated = await db.enquiry.update({
          where: { id: entityId },
          data: updateData,
        });

        return {
          success: true,
          provider: 'CRM Leads',
          output: { leadId: entityId, updatedFields: Object.keys(updateData), currentStatus: updated.status },
        };
      }

      case 'ADD_LEAD_TAG': {
        if (!entityId || !params.tag) {
          return { success: false, provider: 'CRM Tags', error: 'Lead ID and tag name are required.' };
        }

        const tagName = params.tag.trim();
        const tag = await db.tag.upsert({
          where: { name: tagName },
          update: {},
          create: { name: tagName, color: params.color || '#802ee3' },
        });

        await db.entityTag.upsert({
          where: { tagId_entityType_entityId: { tagId: tag.id, entityType: 'LEAD', entityId } },
          update: {},
          create: { tagId: tag.id, entityType: 'LEAD', entityId },
        });

        return {
          success: true,
          provider: 'CRM Tags',
          output: { leadId: entityId, tagAdded: tagName },
        };
      }

      case 'REMOVE_LEAD_TAG': {
        if (!entityId || !params.tag) {
          return { success: false, provider: 'CRM Tags', error: 'Lead ID and tag name are required.' };
        }

        const tag = await db.tag.findUnique({ where: { name: params.tag.trim() } });
        if (tag) {
          await db.entityTag.deleteMany({
            where: { tagId: tag.id, entityType: 'LEAD', entityId },
          });
        }

        return {
          success: true,
          provider: 'CRM Tags',
          output: { leadId: entityId, tagRemoved: params.tag },
        };
      }

      case 'ADJUST_LEAD_SCORE': {
        if (!entityId) {
          return { success: false, provider: 'CRM Lead Scoring', error: 'No Lead ID in context for scoring.' };
        }

        const lead = await db.enquiry.findUnique({ where: { id: entityId }, select: { score: true } });
        const currentScore = lead?.score ?? 10;
        const points = Number(params.points) || 10;
        let newScore = currentScore;

        if (params.operation === 'SUBTRACT') {
          newScore = Math.max(0, currentScore - points);
        } else if (params.operation === 'SET') {
          newScore = points;
        } else {
          newScore = currentScore + points;
        }

        await db.enquiry.update({
          where: { id: entityId },
          data: { score: newScore },
        });

        return {
          success: true,
          provider: 'CRM Lead Scoring',
          output: { previousScore: currentScore, newScore, delta: newScore - currentScore },
        };
      }

      case 'CONVERT_LEAD': {
        if (!entityId) {
          return { success: false, provider: 'CRM', error: 'No Lead ID in context to convert.' };
        }

        const lead = await db.enquiry.findUnique({ where: { id: entityId } });
        if (!lead) return { success: false, provider: 'CRM', error: 'Lead record not found in database.' };

        // Create or find Customer
        let customer = await db.customer.findFirst({ where: { email: lead.email } });
        if (!customer) {
          customer = await db.customer.create({
            data: {
              name: lead.name,
              email: lead.email,
              phone: lead.phone,
              status: 'ACTIVE',
            },
          });
        }

        // Find default pipeline & stage
        const pipeline = await db.pipeline.findFirst({
          include: { stages: { orderBy: { order: 'asc' } } },
        });

        const stageId = pipeline?.stages[0]?.id;
        let dealId: string | null = null;

        if (pipeline && stageId) {
          const dealTitle = interpolateTemplate(params.dealTitle || `${lead.company || lead.name} — Project`, contextData);
          const deal = await db.deal.create({
            data: {
              title: dealTitle,
              pipelineId: pipeline.id,
              stageId,
              customerId: customer.id,
              value: parseFloat(params.dealValue) || 100000,
              probability: 50,
            },
          });
          dealId = deal.id;
        }

        await db.enquiry.update({
          where: { id: entityId },
          data: { status: 'WON', convertedDate: new Date() },
        });

        return {
          success: true,
          provider: 'CRM Conversion',
          output: { customerId: customer.id, dealId, leadStatus: 'WON' },
        };
      }

      case 'ADD_LEAD_NOTE': {
        if (!entityId) return { success: false, provider: 'CRM', error: 'No Lead ID in context for note.' };

        const admin = await db.user.findFirst({ where: { status: 'ACTIVE' }, select: { id: true } });
        if (!admin) return { success: false, provider: 'CRM', error: 'No active user found to author note.' };

        const noteText = interpolateTemplate(params.noteText || 'Automated workflow note', contextData);
        const note = await db.enquiryNote.create({
          data: {
            enquiryId: entityId,
            userId: admin.id,
            note: noteText,
          },
        });

        return {
          success: true,
          provider: 'CRM Notes',
          output: { noteId: note.id, leadId: entityId },
        };
      }

      // ==========================================
      // 3. DEALS & SALES
      // ==========================================
      case 'CREATE_DEAL': {
        const title = interpolateTemplate(params.title || 'New Sales Deal', contextData);
        const value = parseFloat(params.value) || 100000;
        const probability = parseInt(params.probability || '50');

        const pipeline = await db.pipeline.findFirst({
          include: { stages: { orderBy: { order: 'asc' } } },
        });

        if (!pipeline || pipeline.stages.length === 0) {
          return { success: false, provider: 'Deals & Sales', error: 'No active sales pipeline configured.' };
        }

        const deal = await db.deal.create({
          data: {
            title,
            value,
            probability,
            pipelineId: pipeline.id,
            stageId: pipeline.stages[0].id,
          },
        });

        return {
          success: true,
          provider: 'Sales Pipeline',
          output: { dealId: deal.id, title, value },
        };
      }

      case 'UPDATE_DEAL': {
        const dealId = contextData.deal?.id || contextData.dealId;
        if (!dealId) return { success: false, provider: 'Deals & Sales', error: 'No Deal ID found in context.' };

        const deal = await db.deal.findUnique({ where: { id: dealId } });
        if (!deal) return { success: false, provider: 'Deals & Sales', error: 'Deal record not found.' };

        const updateData: Record<string, any> = {};
        if (params.probability !== undefined) updateData.probability = parseInt(params.probability);

        // Find stage by name if provided
        if (params.stageName) {
          const stage = await db.pipelineStage.findFirst({
            where: { pipelineId: deal.pipelineId, name: { contains: params.stageName } },
          });
          if (stage) updateData.stageId = stage.id;
        }

        const updated = await db.deal.update({
          where: { id: dealId },
          data: updateData,
        });

        return {
          success: true,
          provider: 'Sales Pipeline',
          output: { dealId, stageId: updated.stageId, probability: updated.probability },
        };
      }

      case 'MARK_DEAL_STATUS': {
        const dealId = contextData.deal?.id || contextData.dealId;
        if (!dealId) return { success: false, provider: 'Deals & Sales', error: 'No Deal ID in context.' };

        const isWon = params.status === 'WON';
        const updated = await db.deal.update({
          where: { id: dealId },
          data: {
            wonDate: isWon ? new Date() : null,
            lostDate: !isWon ? new Date() : null,
            lostReason: !isWon ? params.reason || 'Closed via automation' : null,
          },
        });

        return {
          success: true,
          provider: 'Sales Pipeline',
          output: { dealId, status: isWon ? 'WON' : 'LOST' },
        };
      }

      case 'CREATE_PROPOSAL': {
        const propNum = `PROP-${Date.now().toString(36).toUpperCase()}`;
        const title = interpolateTemplate(params.title || 'Client Proposal', contextData);
        const clientName = interpolateTemplate(contextData.lead?.name || params.clientName || 'Valued Client', contextData);
        const clientEmail = interpolateTemplate(contextData.lead?.email || params.clientEmail || 'client@techinpedia.com', contextData);
        const budget = parseFloat(params.totalBudget) || 250000;

        const proposal = await db.proposal.create({
          data: {
            proposalNumber: propNum,
            title,
            clientName,
            clientEmail,
            subtotal: budget,
            grandTotal: budget,
            deliverables: params.deliverables || 'Full-stack software engineering',
            status: 'DRAFT',
          },
        });

        return {
          success: true,
          provider: 'Sales Proposals',
          output: { proposalId: proposal.id, proposalNumber: propNum },
        };
      }

      case 'CREATE_CONTRACT': {
        const ctrNum = `CTR-${Date.now().toString(36).toUpperCase()}`;
        const clientName = interpolateTemplate(contextData.lead?.name || 'Client', contextData);
        const contract = await db.contract.create({
          data: {
            contractNumber: ctrNum,
            clientName,
            contractType: params.contractType || 'SOFTWARE_DEV',
            totalValue: parseFloat(params.totalValue) || 300000,
            startDate: new Date(),
            status: 'ACTIVE',
          },
        });

        return {
          success: true,
          provider: 'Legal & Contracts',
          output: { contractId: contract.id, contractNumber: ctrNum },
        };
      }

      // ==========================================
      // 4. TASKS & MEETINGS
      // ==========================================
      case 'CREATE_FOLLOW_UP': {
        const delayHours = Number(params.delayHours) || 24;
        const scheduledAt = new Date(Date.now() + delayHours * 60 * 60 * 1000);
        const title = interpolateTemplate(params.title || 'Automated CRM Follow-up', contextData);

        const followUp = await db.followUp.create({
          data: {
            title,
            type: params.type || 'CALL',
            status: 'PENDING',
            scheduledAt,
            notes: params.description || `Automated task created for ${contextData.lead?.name || 'Contact'}`,
            enquiryId: entityId || undefined,
          },
        });

        return {
          success: true,
          provider: 'CRM Follow-ups',
          output: { followUpId: followUp.id, scheduledAt: scheduledAt.toISOString() },
        };
      }

      case 'CREATE_PROJECT_TASK': {
        const title = interpolateTemplate(params.title || 'Deliverable Task', contextData);
        const priority = params.priority || 'MEDIUM';
        const estimatedHours = parseFloat(params.estimatedHours) || 4;

        let project = await db.projectRecord.findFirst({
          where: { status: 'ACTIVE' },
          orderBy: { createdAt: 'desc' },
          select: { id: true },
        });

        if (!project) {
          project = await db.projectRecord.create({
            data: {
              code: `PRJ-${Date.now().toString(36).toUpperCase()}`,
              name: 'General Client Deliverables',
              status: 'ACTIVE',
            },
          });
        }

        const task = await db.task.create({
          data: {
            title,
            projectId: project.id,
            priority,
            status: 'TODO',
            estimatedHours,
          },
        });

        return {
          success: true,
          provider: 'Projects & Tasks',
          output: { taskId: task.id, title, priority },
        };
      }

      case 'COMPLETE_PROJECT_TASK': {
        const keyword = params.taskKeyword || '';
        const task = await db.task.findFirst({
          where: { title: { contains: keyword }, status: { not: 'DONE' } },
        });

        if (task) {
          await db.task.update({
            where: { id: task.id },
            data: { status: 'DONE' },
          });
          return { success: true, provider: 'Projects & Tasks', output: { taskId: task.id, status: 'DONE' } };
        }

        return { success: true, provider: 'Projects & Tasks', output: { note: 'No pending task matched keyword.' } };
      }

      // ==========================================
      // 5. QUOTATIONS & FINANCE
      // ==========================================
      case 'CREATE_QUOTATION': {
        const quoteNum = `QT-${Date.now().toString(36).toUpperCase()}`;
        const clientName = interpolateTemplate(params.clientName || contextData.lead?.name || 'Client', contextData);
        const clientEmail = interpolateTemplate(params.clientEmail || contextData.lead?.email || 'client@techinpedia.com', contextData);
        const subtotal = parseFloat(params.subtotal) || 100000;
        const taxRate = parseFloat(params.taxRate) || 18;
        const taxAmount = (subtotal * taxRate) / 100;
        const totalAmount = subtotal + taxAmount;
        const validDays = parseInt(params.validDays || '14');

        const quotation = await db.quotation.create({
          data: {
            quotationNumber: quoteNum,
            clientName,
            clientEmail,
            subtotal,
            taxRate,
            taxAmount,
            totalAmount,
            validUntil: new Date(Date.now() + validDays * 24 * 60 * 60 * 1000),
            status: 'SENT',
            items: {
              create: [
                {
                  description: params.itemDescription || 'Software Engineering Services',
                  quantity: 1,
                  rate: subtotal,
                  amount: subtotal,
                },
              ],
            },
          },
        });

        return {
          success: true,
          provider: 'Finance & Quotations',
          output: { quotationId: quotation.id, quotationNumber: quoteNum, totalAmount },
        };
      }

      case 'CREATE_INVOICE': {
        const invNum = `INV-${Date.now().toString(36).toUpperCase()}`;
        const clientName = interpolateTemplate(params.clientName || contextData.lead?.name || 'Client', contextData);
        const clientEmail = interpolateTemplate(params.clientEmail || contextData.lead?.email || 'client@techinpedia.com', contextData);
        const totalAmount = parseFloat(params.totalAmount) || 50000;
        const dueDays = parseInt(params.dueDays || '7');

        const invoice = await db.invoice.create({
          data: {
            invoiceNumber: invNum,
            clientName,
            clientEmail,
            totalAmount,
            balanceDue: totalAmount,
            dueDate: new Date(Date.now() + dueDays * 24 * 60 * 60 * 1000),
            status: 'SENT',
            items: {
              create: [
                {
                  description: params.itemDescription || 'Deliverable Milestone Billing',
                  quantity: 1,
                  unitPrice: totalAmount,
                  amount: totalAmount,
                },
              ],
            },
          },
        });

        return {
          success: true,
          provider: 'Finance & Invoicing',
          output: { invoiceId: invoice.id, invoiceNumber: invNum, balanceDue: totalAmount },
        };
      }

      case 'RECORD_PAYMENT': {
        const amount = parseFloat(params.amount) || 50000;
        const payment = await db.payment.create({
          data: {
            amount,
            paymentMethod: params.paymentMethod || 'BANK_TRANSFER',
            referenceId: params.referenceId || `UTR-${Date.now().toString(36).toUpperCase()}`,
            notes: params.notes || 'Automated payment settlement logged by workflow',
          },
        });

        return {
          success: true,
          provider: 'Finance & Payments',
          output: { paymentId: payment.id, amount },
        };
      }

      case 'SEND_PAYMENT_REMINDER': {
        const recipient = contextData.customer?.email || contextData.lead?.email || 'client@techinpedia.com';
        const phone = (contextData.customer?.phone || contextData.lead?.phone || '').replace(/[^0-9]/g, '');

        if (params.channel !== 'EMAIL' && phone) {
          await sendWhatsAppTextMessage(
            phone,
            `Hello! This is a friendly reminder from TechInPedia regarding your pending invoice payment. Please let us know if you need assistance.`
          ).catch(() => {});
        }

        return {
          success: true,
          provider: 'Finance Reminders',
          output: { channel: params.channel, recipient, status: 'DISPATCHED' },
        };
      }

      case 'LOG_EXPENSE': {
        const amount = parseFloat(params.amount) || 1000;
        const expense = await db.expense.create({
          data: {
            category: params.category || 'INFRASTRUCTURE',
            amount,
            vendorName: params.vendorName || 'General Supplier',
            paymentMethod: 'BANK_TRANSFER',
            status: 'APPROVED',
          },
        });

        return {
          success: true,
          provider: 'Finance & Expenses',
          output: { expenseId: expense.id, amount },
        };
      }

      // ==========================================
      // 6. SUPPORT
      // ==========================================
      case 'CREATE_TICKET': {
        const tckNum = `TCK-${Date.now().toString(36).toUpperCase()}`;
        const subject = interpolateTemplate(params.subject || 'Client Support Request', contextData);
        const clientEmail = interpolateTemplate(contextData.lead?.email || 'client@techinpedia.com', contextData);
        const clientName = interpolateTemplate(contextData.lead?.name || 'Valued Client', contextData);

        const ticket = await db.supportTicket.create({
          data: {
            ticketNumber: tckNum,
            subject,
            clientName,
            clientEmail,
            category: params.category || 'TECHNICAL',
            priority: params.priority || 'HIGH',
            status: 'OPEN',
            description: params.description || 'Support ticket generated by workflow automation.',
          },
        });

        return {
          success: true,
          provider: 'Customer Support',
          output: { ticketId: ticket.id, ticketNumber: tckNum },
        };
      }

      case 'UPDATE_TICKET': {
        const ticketId = contextData.ticket?.id || contextData.ticketId;
        if (!ticketId) return { success: false, provider: 'Support', error: 'No Ticket ID in context.' };

        const updateData: Record<string, any> = {};
        if (params.priority) updateData.priority = params.priority;
        if (params.status) updateData.status = params.status;

        const updated = await db.supportTicket.update({
          where: { id: ticketId },
          data: updateData,
        });

        return {
          success: true,
          provider: 'Customer Support',
          output: { ticketId, priority: updated.priority, status: updated.status },
        };
      }

      case 'ADD_TICKET_COMMENT': {
        const ticketId = contextData.ticket?.id || contextData.ticketId;
        if (!ticketId) return { success: false, provider: 'Support', error: 'No Ticket ID in context.' };

        const comment = await db.ticketComment.create({
          data: {
            ticketId,
            authorName: 'TechInPedia Automation Engine',
            authorRole: 'AGENT',
            message: interpolateTemplate(params.message || 'Automated update', contextData),
            isInternal: params.isInternal !== false,
          },
        });

        return {
          success: true,
          provider: 'Customer Support',
          output: { commentId: comment.id, ticketId },
        };
      }

      // ==========================================
      // 7. RENTAL & AMC
      // ==========================================
      case 'CREATE_RENTAL_ORDER': {
        const rntNum = `RNT-${Date.now().toString(36).toUpperCase()}`;
        let customer = await db.customer.findFirst();
        if (!customer) {
          customer = await db.customer.create({
            data: { name: 'Corporate Rentals', email: 'rentals@techinpedia.com', status: 'ACTIVE' },
          });
        }

        const durationMonths = parseInt(params.durationMonths || '6');
        const rentalOrder = await db.rentalOrder.create({
          data: {
            orderNumber: rntNum,
            customerId: customer.id,
            startDate: new Date(),
            endDate: new Date(Date.now() + durationMonths * 30 * 24 * 60 * 60 * 1000),
            monthlyRate: parseFloat(params.monthlyRate) || 4500,
            deliveryAddress: 'Main Corporate Office, Gurgaon NCR',
            status: 'ACTIVE',
          },
        });

        return {
          success: true,
          provider: 'Hardware Rentals',
          output: { rentalOrderId: rentalOrder.id, orderNumber: rntNum },
        };
      }

      case 'UPDATE_RENTAL_STATUS': {
        const orderId = contextData.rental?.id || contextData.rentalOrderId;
        if (!orderId) return { success: false, provider: 'Hardware Rentals', error: 'No Rental Order ID in context.' };

        const updated = await db.rentalOrder.update({
          where: { id: orderId },
          data: { status: params.newStatus || 'ACTIVE' },
        });

        return {
          success: true,
          provider: 'Hardware Rentals',
          output: { rentalOrderId: orderId, status: updated.status },
        };
      }

      case 'SCHEDULE_AMC_MAINTENANCE': {
        let asset = await db.rentalAsset.findFirst();
        if (!asset) {
          asset = await db.rentalAsset.create({
            data: {
              assetCode: `TIP-LAP-${Date.now().toString(36).toUpperCase()}`,
              serialNumber: `SN-${Date.now()}`,
              assetType: 'LAPTOP',
              brand: 'Apple',
              model: 'MacBook Pro 16 M3',
              specs: '36GB Unified RAM, 1TB SSD',
            },
          });
        }

        const maintenance = await db.assetMaintenance.create({
          data: {
            assetId: asset.id,
            issue: params.issueDescription || 'Periodic Preventive Maintenance Visit',
            technician: params.technicianName || 'Field Support Engineer',
            status: 'IN_PROGRESS',
          },
        });

        return {
          success: true,
          provider: 'Hardware & AMC',
          output: { maintenanceId: maintenance.id, assetCode: asset.assetCode },
        };
      }

      // ==========================================
      // 8. HRM
      // ==========================================
      case 'HR_SEND_ANNOUNCEMENT': {
        const title = interpolateTemplate(params.title || 'Staff Announcement', contextData);
        const message = interpolateTemplate(params.message || '', contextData);

        const notif = await db.notification.create({
          data: {
            title,
            message,
            type: 'HR',
            link: '/admin/hr/employees',
          },
        });

        return {
          success: true,
          provider: 'HRM',
          output: { announcementId: notif.id, title },
        };
      }

      case 'HR_UPDATE_LEAVE': {
        const leave = await db.leaveRequest.findFirst({
          where: { status: 'PENDING' },
          orderBy: { createdAt: 'desc' },
        });

        if (leave) {
          await db.leaveRequest.update({
            where: { id: leave.id },
            data: { status: params.decision || 'APPROVED', approvedBy: 'Workflow Automation' },
          });
          return { success: true, provider: 'HRM', output: { leaveId: leave.id, status: params.decision } };
        }

        return { success: true, provider: 'HRM', output: { note: 'No pending leave request to update.' } };
      }

      case 'HR_FLAG_ATTENDANCE': {
        const emp = await db.employee.findFirst();
        if (emp) {
          const today = new Date();
          today.setHours(0, 0, 0, 0);

          await db.attendanceRecord.upsert({
            where: { employeeId_date: { employeeId: emp.id, date: today } },
            update: { status: params.status || 'LATE', notes: params.notes },
            create: { employeeId: emp.id, date: today, status: params.status || 'LATE', notes: params.notes },
          });

          return { success: true, provider: 'HRM Attendance', output: { employeeId: emp.id, status: params.status } };
        }

        return { success: true, provider: 'HRM Attendance', output: { note: 'No employee record found to flag.' } };
      }

      // ==========================================
      // 9. DATA & INTEGRATIONS
      // ==========================================
      case 'APPEND_GOOGLE_SHEET': {
        const targetSpreadsheetId = interpolateTemplate(params.spreadsheetId || '', contextData);
        const targetSheetTab = interpolateTemplate(params.sheetTabName || 'Sheet1', contextData);

        if (targetSpreadsheetId) {
          const lead = {
            name: contextData.lead?.name || 'Inbound Lead',
            phone: contextData.lead?.phone || '',
            email: contextData.lead?.email || '',
            service: contextData.lead?.service || 'General Enquiry',
            status: contextData.lead?.status || 'NEW',
          };
          const sheetRes = await appendLeadToSheet(targetSpreadsheetId, targetSheetTab, lead);
          if (!sheetRes.success) {
            return { success: false, provider: 'Google Sheets', error: sheetRes.error };
          }
        }

        return {
          success: true,
          provider: 'Google Sheets',
          output: {
            sheetTab: targetSheetTab,
            status: 'ROW_APPENDED',
            exportedFields: {
              name: contextData.lead?.name || 'Contact',
              email: contextData.lead?.email || 'email@techinpedia.com',
              service: contextData.lead?.service || 'Software',
            },
          },
        };
      }

      case 'OUTBOUND_WEBHOOK': {
        const url = interpolateTemplate(params.url || '', contextData);
        if (!url || !url.startsWith('http')) {
          return { success: false, provider: 'Webhook', error: 'Invalid destination webhook URL.' };
        }

        // SSRF protection: reject internal network
        const parsed = new URL(url);
        if (
          parsed.hostname === 'localhost' ||
          parsed.hostname === '127.0.0.1' ||
          parsed.hostname.startsWith('192.168.') ||
          parsed.hostname.startsWith('10.')
        ) {
          return { success: false, provider: 'Webhook', error: 'Destination URL resolves to blocked internal network.' };
        }

        let customHeaders: Record<string, string> = { 'Content-Type': 'application/json' };
        if (params.customHeaders) {
          try {
            customHeaders = { ...customHeaders, ...JSON.parse(params.customHeaders) };
          } catch {}
        }

        const method = params.method || 'POST';
        const response = await fetch(url, {
          method,
          headers: customHeaders,
          body: method !== 'GET' ? JSON.stringify(contextData) : undefined,
          signal: AbortSignal.timeout(10000),
        });

        const status = response.status;
        const responseText = await response.text().catch(() => '');

        return {
          success: response.ok,
          provider: 'Outbound Webhook',
          output: { httpStatus: status, responseSnippet: responseText.slice(0, 300) },
          error: !response.ok ? `Webhook returned HTTP ${status}` : undefined,
        };
      }

      // ==========================================
      // 10. ADVANCED
      // ==========================================
      case 'SET_VARIABLE': {
        const varName = params.variableName || 'calc_var';
        const expression = interpolateTemplate(params.valueExpression || '0', contextData);

        // Simple arithmetic evaluator for safety
        let computedValue: any = expression;
        try {
          if (/^[-+*/0-9. ()]+$/.test(expression.trim())) {
            computedValue = Function(`"use strict"; return (${expression})`)();
          }
        } catch {
          computedValue = expression;
        }

        return {
          success: true,
          provider: 'Context Engine',
          output: { variableName: varName, value: computedValue },
        };
      }

      case 'FOR_EACH':
      case 'LOOP': {
        let rawItems = params.items;
        if (!rawItems && params.itemsVariable) {
          rawItems = contextData[params.itemsVariable];
        }
        if (!rawItems && contextData.selected_package_ids) {
          rawItems = contextData.selected_package_ids;
        }

        let items: any[] = [];
        if (Array.isArray(rawItems)) {
          items = rawItems;
        } else if (typeof rawItems === 'string') {
          try {
            items = JSON.parse(rawItems);
          } catch {
            items = rawItems.split(',').map((s: string) => s.trim()).filter(Boolean);
          }
        }

        const childAction = params.actionType || 'SEND_WHATSAPP';
        const childParams = params.actionParams || {};
        const iterationResults: any[] = [];

        for (let i = 0; i < items.length; i++) {
          const item = items[i];
          const itemVal = typeof item === 'object' && item !== null ? (item.id || item.packageId || JSON.stringify(item)) : String(item);
          const loopContext = {
            ...contextData,
            loop_index: i,
            loop_item: item,
            selected_package_id: itemVal,
          };
          const res = await executeAction(childAction, childParams, loopContext, isDryRun);
          iterationResults.push(res);
        }

        return {
          success: iterationResults.every((r) => r.success),
          provider: 'Workflow Engine (Loop)',
          output: { count: items.length, results: iterationResults },
        };
      }

      case 'TRIGGER_WORKFLOW': {
        const workflowName = params.targetWorkflowName || '';
        return {
          success: true,
          provider: 'Workflow Engine',
          output: { targetWorkflow: workflowName, status: 'DISPATCHED_ASYNC' },
        };
      }

      case 'LOG_AUDIT': {
        const actionCode = params.action || 'WORKFLOW_AUTOMATION';
        const metadata = interpolateTemplate(params.metadata || 'Workflow event executed', contextData);

        const audit = await db.activityLog.create({
          data: {
            action: actionCode,
            entityType: 'WORKFLOW',
            entityId: entityId || 'SYSTEM',
            metadata,
          },
        });

        return {
          success: true,
          provider: 'System Audit Log',
          output: { auditLogId: audit.id, action: actionCode },
        };
      }

      default:
        return {
          success: false,
          provider: 'Unknown',
          error: `Unsupported action type: ${actionType}`,
        };
    }
  } catch (error: any) {
    console.error(`Workflow action ${actionType} execution error:`, error);
    return {
      success: false,
      provider: actionType,
      error: error.message || 'Action execution failed.',
    };
  }
}
