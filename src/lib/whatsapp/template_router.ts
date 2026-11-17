import { db } from '@/lib/db';
import { sendWhatsAppTemplateMessage, sendWhatsAppTextMessage } from '@/lib/whatsapp_service';
import { canSendWhatsAppMessage } from '@/lib/whatsapp-eligibility';
import * as crypto from 'crypto';

export interface PackageSelectionResult {
  selectionKey: string;
  packageConfig: any;
  template: any;
  isApproved: boolean;
}

export interface RouterExecutionResult {
  success: boolean;
  actionKey?: string;
  templateSent?: string;
  sentCount?: number;
  error?: string;
  fallbackUsed?: boolean;
}

/**
 * Calculates a content hash of commercial package data to track consistency
 * with static Meta WhatsApp templates.
 */
export function computePackageContentHash(data: {
  name: string;
  price: number;
  services?: string | null;
  freeService?: string | null;
  importantNote?: string | null;
}): string {
  const content = JSON.stringify({
    n: (data.name || '').trim().toLowerCase(),
    p: Number(data.price || 0),
    s: (data.services || '').trim().toLowerCase(),
    f: (data.freeService || '').trim().toLowerCase(),
    note: (data.importantNote || '').trim().toLowerCase(),
  });
  return crypto.createHash('sha256').update(content).digest('hex').slice(0, 16);
}

export class TemplateRouter {
  /**
   * Resolves a WhatsApp template by purpose key (e.g. WELCOME, PACKAGE_MENU, BOOKING_DETAILS)
   * for the given company/tenant.
   */
  static async resolveTemplateByPurpose(companyId: string, purposeKey: string) {
    const purpose = await db.whatsappTemplatePurpose.findFirst({
      where: {
        companyId,
        purposeKey: purposeKey.toUpperCase().trim(),
        isActive: true,
      },
      include: {
        template: true,
      },
    });

    if (!purpose || !purpose.template) {
      return {
        success: false,
        error: `No active template mapped for purpose: ${purposeKey}`,
      };
    }

    const tpl = purpose.template;
    const isApproved = tpl.status === 'APPROVED' || tpl.status === 'ACTIVE';

    return {
      success: true,
      purpose,
      template: tpl,
      isApproved,
      config: purpose.configuration ? JSON.parse(purpose.configuration) : {},
    };
  }

  /**
   * Normalizes incoming customer reply text and extracts package selection keys.
   * Supports: "1", "9", "Reply 1", "reply 2", "1,2", "1, 2, 4", "1 2 4", "package 3", "2, 3".
   * Duplicates and invalid keys are removed.
   */
  static parsePackageSelectionInput(text: string, maxSelection = 3): string[] {
    if (!text || typeof text !== 'string') return [];
    const clean = text.trim();

    // Must match a package selection pattern, not a general conversational sentence
    // e.g. "1", "9", "Reply 1", "reply 2", "1,2", "1, 2, 4", "1 2 4", "package 3", "1, 2"
    const isSelectionPattern = /^(?:reply\s+|select\s+|package\s+|pkg\s+|option\s+)?(?:\d+)(?:[\s,+/&]+(?:and\s+)?\d+)*$/i.test(clean);
    if (!isSelectionPattern) return [];

    // Match all isolated digits or numbers from 1 to 20
    const matches = clean.match(/\b([1-9]|1[0-9]|20)\b/g);
    if (!matches) return [];

    const uniqueKeys: string[] = [];
    for (const key of matches) {
      if (!uniqueKeys.includes(key)) {
        uniqueKeys.push(key);
      }
      if (uniqueKeys.length >= maxSelection) break;
    }

    return uniqueKeys;
  }

  /**
   * Queries PackageWhatsAppConfig for the given selection keys.
   * Uses generic iteration — NEVER hardcodes combinations (e.g. 1+2).
   */
  static async resolvePackagesBySelectionKeys(
    companyId: string,
    selectionKeys: string[]
  ): Promise<PackageSelectionResult[]> {
    if (!selectionKeys || selectionKeys.length === 0) return [];

    const results: PackageSelectionResult[] = [];

    for (const key of selectionKeys) {
      const pkgConfig = await db.packageWhatsAppConfig.findFirst({
        where: {
          companyId,
          selectionKey: key,
          isActive: true,
        },
        include: {
          whatsappTemplate: true,
        },
      });

      if (pkgConfig && pkgConfig.whatsappTemplate) {
        const tpl = pkgConfig.whatsappTemplate;
        const isApproved = tpl.status === 'APPROVED' || tpl.status === 'ACTIVE';
        results.push({
          selectionKey: key,
          packageConfig: pkgConfig,
          template: tpl,
          isApproved,
        });
      }
    }

    return results;
  }

  /**
   * Resolves a button action by template ID and button index.
   * Does NOT rely on visible label strings.
   */
  static async resolveButtonAction(companyId: string, templateIdOrName: string, buttonIndex: number) {
    let actionRecord = await db.whatsappTemplateButtonAction.findFirst({
      where: {
        companyId,
        templateId: templateIdOrName,
        buttonIndex,
        isActive: true,
      },
    });

    if (!actionRecord) {
      actionRecord = await db.whatsappTemplateButtonAction.findFirst({
        where: {
          companyId,
          template: { name: templateIdOrName },
          buttonIndex,
          isActive: true,
        },
      });
    }

    if (!actionRecord) return null;

    let config: any = {};
    if (actionRecord.actionConfig) {
      try {
        config = JSON.parse(actionRecord.actionConfig);
      } catch {
        config = {};
      }
    }

    return {
      actionKey: actionRecord.actionKey,
      actionConfig: config,
      buttonLabel: actionRecord.buttonLabel,
    };
  }

  /**
   * Inbound Message Processor: Checks if incoming text or button click matches
   * package selection or button actions, and dispatches dynamic templates accordingly.
   */
  static async handleInboundMessage(params: {
    companyId: string;
    waNumber: string;
    conversationId: string;
    messageText: string;
    messageType: string;
    interactiveData?: string | null;
    senderName?: string;
  }): Promise<RouterExecutionResult | null> {
    const { companyId, waNumber, conversationId, messageText, messageType, interactiveData, senderName } = params;

    // Fetch conversation for context
    const conversation = await db.whatsappConversation.findUnique({
      where: { id: conversationId },
    });

    // ──────────────────────────────────────────────────────────
    // 1. BUTTON CLICK / QUICK REPLY RESOLUTION
    // ──────────────────────────────────────────────────────────
    const isExplicitButton = messageType === 'button' || messageType === 'interactive';
    let buttonId = '';
    let buttonTitle = messageText.trim();

    if (interactiveData) {
      try {
        const parsed = JSON.parse(interactiveData);
        buttonId = parsed.id || parsed.payload || '';
        buttonTitle = parsed.title || parsed.text || buttonTitle;
      } catch {}
    }

    // Look up all button actions for this company
    const buttonActions = await db.whatsappTemplateButtonAction.findMany({
      where: { companyId, isActive: true },
      include: { template: true },
    });

    const normalizedTitle = buttonTitle.toLowerCase().replace(/[^a-z0-9]/g, '');
    const matchedAction = buttonActions.find((ba) => {
      if (isExplicitButton && buttonId && ba.actionConfig) {
        try {
          const conf = JSON.parse(ba.actionConfig);
          if (conf.buttonId === buttonId || conf.payload === buttonId) return true;
        } catch {}
      }
      const mappedLabel = (ba.buttonLabel || '').toLowerCase().replace(/[^a-z0-9]/g, '');
      if (mappedLabel && mappedLabel === normalizedTitle) return true;
      if (ba.actionKey && ba.actionKey.toLowerCase().replace(/[^a-z0-9]/g, '') === normalizedTitle) return true;
      return false;
    });

    if (matchedAction && (isExplicitButton || matchedAction.buttonLabel)) {
      return await this.executeAction({
        companyId,
        waNumber,
        conversationId,
        actionKey: matchedAction.actionKey,
        actionConfig: matchedAction.actionConfig ? JSON.parse(matchedAction.actionConfig) : {},
        sourceTemplate: matchedAction.template,
        senderName,
        conversation,
      });
    }

    // ──────────────────────────────────────────────────────────
    // 2. PACKAGE NUMBER SELECTION REPLIES (e.g. "1", "Reply 2", "1, 2")
    // ──────────────────────────────────────────────────────────
    // Check max package selections from company setting
    let maxSelections = 3;
    const maxSetting = await db.setting.findFirst({
      where: { key: `whatsapp_package_selection_max_${companyId}` },
    });
    if (maxSetting?.value) {
      const parsed = parseInt(maxSetting.value, 10);
      if (!isNaN(parsed) && parsed > 0) maxSelections = parsed;
    }

    const selectionKeys = this.parsePackageSelectionInput(messageText, maxSelections);

    if (selectionKeys.length > 0) {
      const resolved = await this.resolvePackagesBySelectionKeys(companyId, selectionKeys);

      if (resolved.length > 0) {
        return await this.dispatchPackageTemplates({
          companyId,
          waNumber,
          conversationId,
          resolvedPackages: resolved,
          conversation,
          senderName,
        });
      }
    }

    // ──────────────────────────────────────────────────────────
    // 3. TEXT KEYWORD ALIASES FOR BUTTONS (e.g. "view packages", "menu", "book now")
    // ──────────────────────────────────────────────────────────
    const cleanText = messageText.trim().toLowerCase();
    const strippedText = cleanText.replace(/^[^\w\s]+|[^\w\s]+$/g, '').trim();

    // Menu request aliases
    const isMenuKeyword = /^(view\s*packages?|packages?|package\s*menu|menu|show\s*packages?|packages?\s*list|packages?\s*btao)$/i.test(strippedText) ||
      /^(view\s*packages?|packages?|package\s*menu|menu|show\s*packages?|packages?\s*list|packages?\s*btao)$/i.test(cleanText);
    if (isMenuKeyword) {
      return await this.executeAction({
        companyId,
        waNumber,
        conversationId,
        actionKey: 'OPEN_PACKAGE_MENU',
        senderName,
        conversation,
      });
    }

    // Booking request aliases
    const isBookKeyword = /^(book\s*now|book|booking|confirm\s*booking|i\s*want\s*to\s*book)$/i.test(strippedText) ||
      /^(book\s*now|book|booking|confirm\s*booking|i\s*want\s*to\s*book)$/i.test(cleanText);
    if (isBookKeyword) {
      return await this.executeAction({
        companyId,
        waNumber,
        conversationId,
        actionKey: 'BOOK_NOW',
        senderName,
        conversation,
      });
    }

    // ──────────────────────────────────────────────────────────
    // 4. GREETING RESOLUTION (e.g. "hi", "hello", "hey", "start", "namaste")
    // ──────────────────────────────────────────────────────────
    const isGreeting = /^(hi+|hie|hello+|helo+|hlo+|hey+|namaste|start|hola|greeting|good\s*(morning|afternoon|evening))\b/i.test(strippedText) ||
      /^(hi+|hie|hello+|helo+|hlo+|hey+|namaste|start|hola|greeting|good\s*(morning|afternoon|evening))\b/i.test(cleanText);
    if (isGreeting) {
      const welcomePurpose = await this.resolveTemplateByPurpose(companyId, 'WELCOME');
      if (welcomePurpose.success && welcomePurpose.template && welcomePurpose.isApproved) {
        const sendRes = await sendWhatsAppTemplateMessage(
          waNumber,
          welcomePurpose.template.name,
          welcomePurpose.template.language || 'en_US',
          [],
          welcomePurpose.template.headerType === 'IMAGE' ? welcomePurpose.template.headerContent || undefined : undefined,
          { conversationId, companyId }
        );

        await this.logAudit({
          companyId,
          actionType: 'WELCOME_TEMPLATE_SENT',
          detailsJson: JSON.stringify({
            templateName: welcomePurpose.template.name,
            waNumber,
            success: sendRes.success,
          }),
          performedBy: 'template_router',
        });

        return {
          success: sendRes.success,
          actionKey: 'WELCOME',
          templateSent: welcomePurpose.template.name,
        };
      }
    }

    // ──────────────────────────────────────────────────────────
    // 5. POST-BOOKING DETAILS CAPTURE (Date, Time, Address)
    // ──────────────────────────────────────────────────────────
    // If the customer was previously prompted for booking details:
    if (conversation?.bookingPackageId && cleanText.length > 5 && !isGreeting) {
      // Record appointment details in CRM lead
      if (conversation.leadId) {
        await db.enquiry.update({
          where: { id: conversation.leadId },
          data: {
            temperature: 'HOT',
            status: 'QUALIFIED',
          },
        }).catch(() => {});
      }

      // Send confirmation text
      const pkg = await db.packageWhatsAppConfig.findFirst({
        where: { companyId, packageId: conversation.bookingPackageId },
      });
      const pkgTitle = pkg?.packageName || 'Salon at Home';

      await sendWhatsAppTextMessage(
        waNumber,
        `🌸 *Booking Request Received!* 🌸\n\nThank you for choosing *${pkgTitle}*! We have noted your preferred details:\n\n📝 "${messageText.trim()}"\n\nOur salon team is reviewing your slot and will call you shortly to confirm your appointment! 💅✨`,
        { companyId, conversationId }
      );

      // Reset bookingPackageId to prevent infinite loop
      await db.whatsappConversation.update({
        where: { id: conversationId },
        data: { bookingPackageId: null },
      });

      return {
        success: true,
        actionKey: 'BOOKING_CONFIRMED',
      };
    }

    // Not handled by template router — return null so webhook pipeline can proceed to AI / chatbot
    return null;
  }

  /**
   * Dispatches resolved package templates dynamically to customer.
   */
  static async dispatchPackageTemplates(params: {
    companyId: string;
    waNumber: string;
    conversationId: string;
    resolvedPackages: PackageSelectionResult[];
    conversation: any;
    senderName?: string;
  }): Promise<RouterExecutionResult> {
    const { companyId, waNumber, conversationId, resolvedPackages, conversation, senderName } = params;

    let sentCount = 0;
    const selectedPkgIds: string[] = [];
    let lastViewedPkgId: string | null = null;
    let lastPrice = 0;

    for (const item of resolvedPackages) {
      const { packageConfig, template, isApproved } = item;
      selectedPkgIds.push(packageConfig.packageId);
      lastViewedPkgId = packageConfig.packageId;
      lastPrice = packageConfig.packagePrice;

      if (isApproved) {
        // Dynamic Template Parameter Resolution (Requirement #11)
        // If template has parameter mappings configured in DB, interpolate them dynamically
        let dynamicParams: string[] = [];
        try {
          const paramMappings = await db.whatsappTemplateParameterMapping.findMany({
            where: { companyId, templateId: template.id },
            orderBy: { parameterIndex: 'asc' },
          });

          if (paramMappings.length > 0) {
            const contextData: Record<string, any> = {
              package: {
                id: packageConfig.packageId,
                name: packageConfig.packageName,
                price: packageConfig.packagePrice,
                formatted_price: `₹${packageConfig.packagePrice}`,
                services_text: packageConfig.servicesSummary || '',
                free_service: packageConfig.freeService || '',
                note: packageConfig.importantNote || '',
              },
              customer: {
                name: senderName || conversation?.customerName || 'Valued Customer',
                phone: waNumber,
              },
            };

            for (const pm of paramMappings) {
              let val = '';
              try {
                const parts = pm.sourcePath.split('.');
                let curr: any = contextData;
                for (const p of parts) {
                  if (curr != null && typeof curr === 'object') {
                    curr = curr[p];
                  } else {
                    curr = undefined;
                    break;
                  }
                }
                if (curr !== undefined && curr !== null) val = String(curr);
              } catch {}
              dynamicParams.push(val);
            }
          }
        } catch (paramErr) {
          console.warn('Error resolving dynamic template parameters:', paramErr);
        }

        // Send approved template (with dynamic parameters if present, or empty array for static templates)
        const sendRes = await sendWhatsAppTemplateMessage(
          waNumber,
          template.name,
          template.language || 'en_US',
          dynamicParams,
          template.headerType === 'IMAGE' ? template.headerContent || undefined : undefined,
          { conversationId, companyId }
        );

        if (sendRes.success) {
          sentCount++;
          await this.logAudit({
            companyId,
            actionType: 'PACKAGE_TEMPLATE_SENT',
            detailsJson: JSON.stringify({
              packageId: packageConfig.packageId,
              packageName: packageConfig.packageName,
              templateName: template.name,
              metaTemplateId: template.metaTemplateId,
              selectionKey: item.selectionKey,
              waNumber,
            }),
            performedBy: 'template_router',
          });
        }
      } else {
        // Fallback strategy: template is not approved
        await this.logAudit({
          companyId,
          actionType: 'PACKAGE_TEMPLATE_NOT_APPROVED',
          detailsJson: JSON.stringify({
            packageId: packageConfig.packageId,
            packageName: packageConfig.packageName,
            templateName: template.name,
            status: template.status,
            waNumber,
          }),
          performedBy: 'template_router',
        });

        // Check if inside 24-hour customer care session
        const careWindowEligible = await canSendWhatsAppMessage({
          companyId,
          phone: waNumber,
          isTemplate: false,
        });

        if (careWindowEligible.allowed) {
          const fallbackMsg = `✨ *${packageConfig.packageName}*\n💰 Price: ₹${packageConfig.packagePrice} (Including Service Charges)\n🎀 Services: ${packageConfig.servicesSummary || 'Complete Professional Salon Service'}\n🎁 Inclusion: ${packageConfig.freeService || 'Standard Package Care'}\n\nTo book this package, reply *Book* or install our app at https://hellomam.co.in`;
          await sendWhatsAppTextMessage(waNumber, fallbackMsg, { companyId, conversationId });
          sentCount++;
        }
      }
    }

    // ──────────────────────────────────────────────────────────
    // Update Customer Conversation Context
    // ──────────────────────────────────────────────────────────
    await db.whatsappConversation.update({
      where: { id: conversationId },
      data: {
        selectedPackageIdsJson: JSON.stringify(selectedPkgIds),
        lastViewedPackageId: lastViewedPkgId,
        packageContextJson: JSON.stringify({
          selectionCount: selectedPkgIds.length,
          lastPriceSnapshot: lastPrice,
          lastSelectedKeys: resolvedPackages.map((r) => r.selectionKey),
          updatedAt: new Date().toISOString(),
        }),
      },
    });

    // Multi-Package Booking UX: If multiple packages selected, prompt customer
    if (resolvedPackages.length > 1) {
      const careWindow = await canSendWhatsAppMessage({
        companyId,
        phone: waNumber,
        isTemplate: false,
      });

      if (careWindow.allowed) {
        await sendWhatsAppTextMessage(
          waNumber,
          `✨ You have viewed ${resolvedPackages.length} packages above! When ready, please tap *Book Now* on your favorite package to proceed with your preferred date and address.`,
          { companyId, conversationId }
        );
      }
    }

    return {
      success: true,
      sentCount,
    };
  }

  /**
   * Executes configured internal actions (OPEN_PACKAGE_MENU, BOOK_NOW, OPEN_APP_URL, etc.)
   */
  static async executeAction(params: {
    companyId: string;
    waNumber: string;
    conversationId: string;
    actionKey: string;
    actionConfig?: any;
    sourceTemplate?: any;
    senderName?: string;
    conversation?: any;
  }): Promise<RouterExecutionResult> {
    const { companyId, waNumber, conversationId, actionKey, actionConfig, sourceTemplate, senderName, conversation } =
      params;

    // ──────────────────────────────────────────────────────────
    // ACTION: OPEN_PACKAGE_MENU
    // ──────────────────────────────────────────────────────────
    if (actionKey === 'OPEN_PACKAGE_MENU') {
      const menuPurpose = await this.resolveTemplateByPurpose(companyId, 'PACKAGE_MENU');
      if (!menuPurpose.success || !menuPurpose.template) {
        return {
          success: false,
          error: menuPurpose.error || 'Package menu template not configured',
        };
      }

      if (menuPurpose.isApproved) {
        const sendRes = await sendWhatsAppTemplateMessage(
          waNumber,
          menuPurpose.template.name,
          menuPurpose.template.language || 'en_US',
          [],
          menuPurpose.template.headerType === 'IMAGE' ? menuPurpose.template.headerContent || undefined : undefined,
          { conversationId, companyId }
        );

        await this.logAudit({
          companyId,
          actionType: 'OPEN_PACKAGE_MENU_EXECUTED',
          detailsJson: JSON.stringify({
            templateName: menuPurpose.template.name,
            waNumber,
            success: sendRes.success,
          }),
          performedBy: 'template_router',
        });

        return {
          success: sendRes.success,
          actionKey: 'OPEN_PACKAGE_MENU',
          templateSent: menuPurpose.template.name,
        };
      } else {
        // Fallback if menu template not approved
        const careWindow = await canSendWhatsAppMessage({
          companyId,
          phone: waNumber,
          isTemplate: false,
        });

        if (careWindow.allowed) {
          const pkgs = await db.packageWhatsAppConfig.findMany({
            where: { companyId, isActive: true },
            orderBy: { sortOrder: 'asc' },
          });
          const listText = pkgs.map((p) => `*${p.selectionKey}.* ${p.packageName} — ₹${p.packagePrice}`).join('\n');
          await sendWhatsAppTextMessage(
            waNumber,
            `🌸 *Choose Your Favorite Package* 🌸\n\n${listText}\n\n👉 Reply with any package number (e.g. *1*, *2*) to view details!`,
            { companyId, conversationId }
          );
          return { success: true, actionKey: 'OPEN_PACKAGE_MENU', fallbackUsed: true };
        }

        return { success: false, error: 'Package menu template is not approved in Meta' };
      }
    }

    // ──────────────────────────────────────────────────────────
    // ACTION: BOOK_NOW
    // ──────────────────────────────────────────────────────────
    if (actionKey === 'BOOK_NOW') {
      // Resolve which package the customer is booking
      let bookingPackageId = actionConfig?.packageId || null;

      // If not in actionConfig, inspect conversation context
      if (!bookingPackageId && conversation?.lastViewedPackageId) {
        bookingPackageId = conversation.lastViewedPackageId;
      }

      // If sourceTemplate was a package template, resolve package config from it
      if (!bookingPackageId && sourceTemplate?.id) {
        const pkg = await db.packageWhatsAppConfig.findFirst({
          where: { companyId, whatsappTemplateId: sourceTemplate.id },
        });
        if (pkg) bookingPackageId = pkg.packageId;
      }

      // Persist bookingPackageId into conversation
      await db.whatsappConversation.update({
        where: { id: conversationId },
        data: {
          bookingPackageId: bookingPackageId || undefined,
        },
      });

      // Resolve BOOKING_DETAILS purpose template dynamically
      const bookingPurpose = await this.resolveTemplateByPurpose(companyId, 'BOOKING_DETAILS');
      if (!bookingPurpose.success || !bookingPurpose.template) {
        return {
          success: false,
          error: bookingPurpose.error || 'Booking details template not configured',
        };
      }

      if (bookingPurpose.isApproved) {
        const sendRes = await sendWhatsAppTemplateMessage(
          waNumber,
          bookingPurpose.template.name,
          bookingPurpose.template.language || 'en_US',
          [],
          bookingPurpose.template.headerType === 'IMAGE' ? bookingPurpose.template.headerContent || undefined : undefined,
          { conversationId, companyId }
        );

        await this.logAudit({
          companyId,
          actionType: 'BOOK_NOW_EXECUTED',
          detailsJson: JSON.stringify({
            bookingPackageId,
            templateName: bookingPurpose.template.name,
            waNumber,
            success: sendRes.success,
          }),
          performedBy: 'template_router',
        });

        return {
          success: sendRes.success,
          actionKey: 'BOOK_NOW',
          templateSent: bookingPurpose.template.name,
        };
      } else {
        // Fallback for booking details
        const careWindow = await canSendWhatsAppMessage({
          companyId,
          phone: waNumber,
          isTemplate: false,
        });

        if (careWindow.allowed) {
          await sendWhatsAppTextMessage(
            waNumber,
            `📅 *Preferred Booking Details*\n\nPlease reply with:\n• Preferred Date:\n• Preferred Time:\n• Complete Address:\n\nOnce we receive these details, our team will confirm your salon appointment right away!`,
            { companyId, conversationId }
          );
          return { success: true, actionKey: 'BOOK_NOW', fallbackUsed: true };
        }

        return { success: false, error: 'Booking details template is not approved in Meta' };
      }
    }

    // ──────────────────────────────────────────────────────────
    // ACTION: OPEN_APP_URL
    // ──────────────────────────────────────────────────────────
    if (actionKey === 'OPEN_APP_URL') {
      const url = actionConfig?.url || 'https://hellomam.co.in';
      const careWindow = await canSendWhatsAppMessage({
        companyId,
        phone: waNumber,
        isTemplate: false,
      });

      if (careWindow.allowed) {
        await sendWhatsAppTextMessage(
          waNumber,
          `📲 You can download our official Hello Mam app from Google Play or Apple App Store:\n${url}`,
          { companyId, conversationId }
        );
      }

      return { success: true, actionKey: 'OPEN_APP_URL' };
    }

    return {
      success: false,
      error: `Unhandled action key: ${actionKey}`,
    };
  }

  /**
   * Content Consistency Verifier: Compares current package commercial data
   * with the snapshot hash stored when the static Meta template was linked.
   * If altered, marks `requiresMetaUpdate = true`.
   */
  static async verifyPackageConsistency(packageConfigIdOrPackageId: string) {
    let pkg = await db.packageWhatsAppConfig.findUnique({
      where: { id: packageConfigIdOrPackageId },
    });
    if (!pkg) {
      pkg = await db.packageWhatsAppConfig.findFirst({
        where: { packageId: packageConfigIdOrPackageId },
      });
    }
    if (!pkg) return false;

    const currentHash = computePackageContentHash({
      name: pkg.packageName,
      price: pkg.packagePrice,
      services: pkg.servicesSummary,
      freeService: pkg.freeService,
      importantNote: pkg.importantNote,
    });

    const isOutdated = Boolean(pkg.templateContentVersion && pkg.templateContentVersion !== currentHash);

    if (isOutdated !== pkg.requiresMetaUpdate || pkg.packageContentVersion !== currentHash) {
      await db.packageWhatsAppConfig.update({
        where: { id: pkg.id },
        data: {
          packageContentVersion: currentHash,
          requiresMetaUpdate: isOutdated,
        },
      });

      if (isOutdated) {
        await this.logAudit({
          companyId: pkg.companyId,
          actionType: 'PACKAGE_MARKED_REQUIRES_META_UPDATE',
          detailsJson: JSON.stringify({
            packageId: pkg.packageId,
            packageName: pkg.packageName,
            currentHash,
            templateHash: pkg.templateContentVersion,
          }),
          performedBy: 'consistency_checker',
        });
      }
    }

    return isOutdated;
  }

  /**
   * Meta Template Sync hook: When a template status updates to APPROVED,
   * all mappings referencing it automatically become active for production sending.
   */
  static async onTemplateStatusUpdated(templateId: string, oldStatus: string, newStatus: string) {
    if (oldStatus !== newStatus) {
      const tpl = await db.whatsappTemplate.findUnique({
        where: { id: templateId },
        include: { company: true },
      });

      if (tpl && tpl.companyId) {
        await this.logAudit({
          companyId: tpl.companyId,
          actionType: 'TEMPLATE_STATUS_CHANGED',
          detailsJson: JSON.stringify({
            templateId: tpl.id,
            templateName: tpl.name,
            metaTemplateId: tpl.metaTemplateId,
            oldStatus,
            newStatus,
          }),
          performedBy: 'meta_sync_service',
        });
      }
    }
  }

  /**
   * Helper to write structured audit logs to WhatsappTemplateAuditLog
   */
  static async logAudit(params: {
    companyId: string;
    actionType: string;
    detailsJson?: string;
    performedBy?: string;
  }) {
    try {
      await db.whatsappTemplateAuditLog.create({
        data: {
          companyId: params.companyId,
          actionType: params.actionType,
          detailsJson: params.detailsJson || null,
          performedBy: params.performedBy || 'system',
        },
      });
    } catch (e) {
      console.warn('Failed to record template audit log:', e);
    }
  }
}
