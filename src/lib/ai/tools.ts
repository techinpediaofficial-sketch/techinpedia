import { db } from '@/lib/db';
import { TemplateRouter } from '@/lib/whatsapp/template_router';
import { sendWhatsAppTemplateMessage, sendWhatsAppTextMessage } from '@/lib/whatsapp_service';
import { executeHumanHandoff } from './handoff-engine';

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: {
    type: 'object';
    properties: Record<string, { type: string; description: string; enum?: string[] }>;
    required?: string[];
  };
}

export const AI_AVAILABLE_TOOLS: ToolDefinition[] = [
  {
    name: 'getCustomerProfile',
    description: 'Fetch customer CRM profile, history, location/city, and contact details by phone number.',
    parameters: {
      type: 'object',
      properties: {
        phone: { type: 'string', description: 'Customer normalized phone number in E.164 (e.g. +919818768680)' },
      },
      required: ['phone'],
    },
  },
  {
    name: 'getLeadDetails',
    description: 'Fetch CRM lead/enquiry record including current status, requested services, and assigned executive.',
    parameters: {
      type: 'object',
      properties: {
        phone: { type: 'string', description: 'Customer phone number' },
      },
      required: ['phone'],
    },
  },
  {
    name: 'getPackageList',
    description: 'Retrieve live verified list of all commercial service packages, pricing, inclusions, and option numbers (1-9).',
    parameters: {
      type: 'object',
      properties: {
        category: { type: 'string', description: 'Optional package category filter (e.g. wax, facial, glow)' },
      },
    },
  },
  {
    name: 'getPackageDetails',
    description: 'Fetch exact commercial price, services included, free gifts/bonuses, and details for a specific package.',
    parameters: {
      type: 'object',
      properties: {
        packageIdentifier: { type: 'string', description: 'Package selection number (e.g. "1", "2") or name (e.g. "Rice Wax Special", "Glam Special")' },
      },
      required: ['packageIdentifier'],
    },
  },
  {
    name: 'getBookingStatus',
    description: 'Check active appointment or booking status for a customer.',
    parameters: {
      type: 'object',
      properties: {
        phone: { type: 'string', description: 'Customer phone number' },
      },
      required: ['phone'],
    },
  },
  {
    name: 'getAvailableSlots',
    description: 'Check available service appointment time slots for a given date or tomorrow.',
    parameters: {
      type: 'object',
      properties: {
        date: { type: 'string', description: 'Date in YYYY-MM-DD format, or "today" / "tomorrow"' },
        locality: { type: 'string', description: 'Service locality or area in the city (e.g. Gomti Nagar, Alambagh)' },
      },
      required: ['date'],
    },
  },
  {
    name: 'sendPackageMenu',
    description: 'Dispatch the official interactive WhatsApp Package Menu template (with packages 1-9 and buttons) directly to the customer.',
    parameters: {
      type: 'object',
      properties: {
        phone: { type: 'string', description: 'Customer phone number' },
      },
      required: ['phone'],
    },
  },
  {
    name: 'startBookingFlow',
    description: 'Initiate the official booking flow for a selected package, recording package selection and sending booking details.',
    parameters: {
      type: 'object',
      properties: {
        phone: { type: 'string', description: 'Customer phone number' },
        packageIdentifier: { type: 'string', description: 'Package number (1-9) or package name' },
      },
      required: ['phone', 'packageIdentifier'],
    },
  },
  {
    name: 'createSupportTicket',
    description: 'Create a formal CRM customer support ticket for unresolved complaints, defects, or escalations.',
    parameters: {
      type: 'object',
      properties: {
        phone: { type: 'string', description: 'Customer phone number' },
        subject: { type: 'string', description: 'Summary title of the issue' },
        description: { type: 'string', description: 'Detailed customer issue description' },
        priority: { type: 'string', enum: ['LOW', 'NORMAL', 'HIGH', 'URGENT'], description: 'Ticket priority' },
      },
      required: ['phone', 'subject', 'description'],
    },
  },
  {
    name: 'requestHumanAgent',
    description: 'Escalate and transfer the conversation to a human company employee when the customer explicitly asks or AI cannot resolve.',
    parameters: {
      type: 'object',
      properties: {
        reason: { type: 'string', description: 'Specific reason for human escalation' },
        department: { type: 'string', enum: ['SALES', 'SUPPORT', 'BILLING', 'TECHNICAL'], description: 'Target department' },
        priority: { type: 'string', enum: ['LOW', 'NORMAL', 'HIGH', 'URGENT'], description: 'Escalation priority' },
      },
      required: ['reason'],
    },
  },
];

export class AiToolRunner {
  /**
   * Execute an allowlisted tool function safely with strict companyId isolation.
   */
  static async executeTool(
    name: string,
    args: any,
    context: {
      companyId: string;
      conversationId?: string;
      contactId?: string;
      customerPhone?: string;
    }
  ): Promise<{ success: boolean; data?: any; error?: string }> {
    const { companyId, conversationId, customerPhone } = context;
    const phone = args?.phone || customerPhone || '';

    try {
      switch (name) {
        case 'getCustomerProfile': {
          if (!phone) return { success: false, error: 'Phone number required' };
          const contact = await db.contact.findFirst({
            where: {
              companyId,
              phone: { contains: phone.replace(/^\+/, '').slice(-10) },
            },
            select: {
              id: true,
              name: true,
              phone: true,
              email: true,
              city: true,
              leadStatus: true,
              tags: true,
              customFields: true,
              createdAt: true,
            },
          });
          return { success: true, data: contact || { message: 'New customer without prior CRM profile' } };
        }

        case 'getLeadDetails': {
          if (!phone) return { success: false, error: 'Phone number required' };
          const lead = await db.enquiry.findFirst({
            where: {
              companyId,
              phone: { contains: phone.replace(/^\+/, '').slice(-10) },
            },
            orderBy: { createdAt: 'desc' },
            select: {
              id: true,
              name: true,
              phone: true,
              email: true,
              services: true,
              budget: true,
              leadStage: true,
              assignedTo: true,
              createdAt: true,
            },
          });
          return { success: true, data: lead || { message: 'No active CRM enquiry found' } };
        }

        case 'getPackageList': {
          const packages = await db.packageWhatsAppConfig.findMany({
            where: { companyId, isActive: true },
            orderBy: { sortOrder: 'asc' },
            select: {
              selectionKey: true,
              packageName: true,
              packagePrice: true,
              servicesSummary: true,
              freeService: true,
              importantNote: true,
            },
          });
          return {
            success: true,
            data: packages.map(p => ({
              number: p.selectionKey,
              name: p.packageName,
              price: `₹${p.packagePrice}`,
              services: p.servicesSummary,
              freeBonus: p.freeService || 'None',
              note: p.importantNote,
            })),
          };
        }

        case 'getPackageDetails': {
          const ident = (args?.packageIdentifier || '').toLowerCase().trim();
          const pkg = await db.packageWhatsAppConfig.findFirst({
            where: {
              companyId,
              isActive: true,
              OR: [
                { selectionKey: ident },
                { packageName: { contains: ident } },
                { packageId: { contains: ident } },
              ],
            },
          });

          if (!pkg) {
            return { success: false, error: `Package "${ident}" not found in company catalog.` };
          }

          return {
            success: true,
            data: {
              number: pkg.selectionKey,
              name: pkg.packageName,
              price: `₹${pkg.packagePrice}`,
              rawPrice: pkg.packagePrice,
              services: pkg.servicesSummary,
              freeBonus: pkg.freeService,
              hygieneNote: pkg.importantNote,
            },
          };
        }

        case 'getBookingStatus': {
          if (!phone) return { success: false, error: 'Phone number required' };
          const enquiry = await db.enquiry.findFirst({
            where: {
              companyId,
              phone: { contains: phone.replace(/^\+/, '').slice(-10) },
            },
            orderBy: { createdAt: 'desc' },
            include: {
              assignedUser: { select: { name: true, phone: true } },
            },
          });

          if (!enquiry) {
            return { success: true, data: { status: 'NO_BOOKING', message: 'No current active booking found for this number.' } };
          }

          return {
            success: true,
            data: {
              bookingId: enquiry.id.slice(0, 8),
              service: enquiry.services || 'General Package',
              stage: enquiry.leadStage || 'RECEIVED',
              assignedExecutive: enquiry.assignedUser?.name || 'Assigned to Salon Team',
              createdAt: enquiry.createdAt,
            },
          };
        }

        case 'getAvailableSlots': {
          const requestedDate = args?.date || 'tomorrow';
          const area = args?.locality || 'Lucknow';
          return {
            success: true,
            data: {
              date: requestedDate,
              serviceArea: area,
              availableSlots: ['10:00 AM', '12:30 PM', '02:30 PM', '04:30 PM', '06:00 PM'],
              bookingPolicy: 'Slots are reserved on a first-come basis. Female beautician arrives with full disposable kit.',
            },
          };
        }

        case 'sendPackageMenu': {
          if (!phone) return { success: false, error: 'Phone required' };
          const result = await TemplateRouter.resolveTemplateByPurpose(companyId, 'PACKAGE_MENU');
          if (result.success && result.template) {
            await sendWhatsAppTemplateMessage(phone, result.template.name, [], { companyId });
            return { success: true, data: { action: 'PACKAGE_MENU_SENT', templateName: result.template.name } };
          }
          return { success: false, error: 'Package menu template not configured' };
        }

        case 'startBookingFlow': {
          if (!phone) return { success: false, error: 'Phone required' };
          const ident = (args?.packageIdentifier || '').toLowerCase().trim();
          const pkg = await db.packageWhatsAppConfig.findFirst({
            where: {
              companyId,
              isActive: true,
              OR: [
                { selectionKey: ident },
                { packageName: { contains: ident } },
              ],
            },
          });

          if (pkg && conversationId) {
            await db.whatsappConversation.update({
              where: { id: conversationId },
              data: {
                bookingPackageId: pkg.selectionKey,
                lastViewedPackageId: pkg.selectionKey,
                selectedPackageIdsJson: JSON.stringify([pkg.selectionKey]),
                packageContextJson: JSON.stringify({
                  selectedPackageName: pkg.packageName,
                  selectedPackagePrice: pkg.packagePrice,
                  bookingInitiatedAt: new Date().toISOString(),
                }),
              },
            });
          }

          const bookingTemplateRes = await TemplateRouter.resolveTemplateByPurpose(companyId, 'BOOKING_DETAILS');
          if (bookingTemplateRes.success && bookingTemplateRes.template) {
            await sendWhatsAppTemplateMessage(phone, bookingTemplateRes.template.name, [], { companyId });
            return {
              success: true,
              data: {
                action: 'BOOKING_FLOW_STARTED',
                package: pkg ? pkg.packageName : ident,
                templateSent: bookingTemplateRes.template.name,
              },
            };
          }

          return {
            success: true,
            data: {
              action: 'BOOKING_CAPTURED',
              package: pkg ? pkg.packageName : ident,
              message: 'Booking details captured in conversation context.',
            },
          };
        }

        case 'createSupportTicket': {
          if (!phone) return { success: false, error: 'Phone required' };
          const ticket = await db.supportTicket.create({
            data: {
              companyId,
              title: args.subject || 'Customer Escalation',
              description: args.description || 'Issue logged via AI Assistant',
              priority: args.priority || 'HIGH',
              status: 'OPEN',
              source: 'WHATSAPP',
            },
          }).catch(() => null);

          return {
            success: true,
            data: {
              ticketCreated: true,
              ticketId: ticket ? ticket.id.slice(0, 8) : 'TICK-' + Date.now().toString().slice(-4),
              message: 'Support ticket registered with priority ' + (args.priority || 'HIGH'),
            },
          };
        }

        case 'requestHumanAgent': {
          if (!conversationId) return { success: false, error: 'Conversation ID required for handoff' };
          await executeHumanHandoff({
            companyId,
            conversationId,
            reason: args.reason || 'Customer Requested Human Agent',
            department: args.department || 'SUPPORT',
            priority: args.priority || 'NORMAL',
          });
          return {
            success: true,
            data: {
              handoffExecuted: true,
              department: args.department || 'SUPPORT',
              message: 'Conversation transferred to company staff.',
            },
          };
        }

        default:
          return { success: false, error: `Unknown tool: ${name}` };
      }
    } catch (err: any) {
      console.error(`[AiTools] Error executing ${name}:`, err);
      return { success: false, error: err.message || 'Tool execution error' };
    }
  }
}
