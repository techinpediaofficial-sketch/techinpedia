import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { logActivity } from '@/lib/activity';
import { normalizePhoneNumber } from '@/lib/whatsapp-eligibility';

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth();
    const { id } = await context.params;

    const contact = await db.contact.findUnique({
      where: { id },
      include: {
        company: { select: { id: true, name: true, domain: true } },
        customers: {
          select: {
            id: true,
            name: true,
            status: true,
            lifetimeValue: true,
            createdAt: true,
            deals: { select: { id: true, title: true, value: true, stage: true } },
          },
        },
        deals: {
          select: { id: true, title: true, value: true, stage: true, createdAt: true },
        },
        meetings: {
          take: 5,
          orderBy: { startTime: 'desc' },
        },
        dripEnrollments: {
          include: {
            campaign: { select: { id: true, name: true } },
            stepLogs: { take: 10, orderBy: { executedAt: 'desc' } },
          },
          orderBy: { enrolledAt: 'desc' },
        },
      },
    });

    if (!contact) {
      return NextResponse.json({ error: 'Contact not found' }, { status: 404 });
    }

    // Tenant Isolation Check
    if (session.isTenant && session.companyId && contact.companyId !== session.companyId) {
      return NextResponse.json({ error: 'Unauthorized: Cross-tenant contact access denied' }, { status: 403 });
    }

    // 1. WhatsApp Telemetry & Conversations
    const canonicalPhone = contact.phone ? normalizePhoneNumber(contact.phone) : '';
    const last10 = canonicalPhone.replace(/[^0-9]/g, '').slice(-10);

    let conversations: any[] = [];
    let messagesStats = { total: 0, sent: 0, received: 0 };

    if (last10) {
      conversations = await db.whatsappConversation.findMany({
        where: {
          OR: [
            { waNumber: { contains: last10 } },
            { contactId: contact.id },
          ],
          ...(contact.companyId ? { companyId: contact.companyId } : {}),
        },
        include: {
          messages: {
            take: 20,
            orderBy: { createdAt: 'desc' },
          },
        },
        orderBy: { updatedAt: 'desc' },
      });

      const convIds = conversations.map((c) => c.id);
      if (convIds.length > 0) {
        const [sentCount, receivedCount] = await Promise.all([
          db.whatsappMessage.count({
            where: { conversationId: { in: convIds }, direction: 'OUTBOUND' },
          }),
          db.whatsappMessage.count({
            where: { conversationId: { in: convIds }, direction: 'INBOUND' },
          }),
        ]);
        messagesStats = {
          total: sentCount + receivedCount,
          sent: sentCount,
          received: receivedCount,
        };
      }
    }

    // 2. CRM Leads & Enquiries
    const leads = last10
      ? await db.enquiry.findMany({
          where: {
            OR: [
              { phone: { contains: last10 } },
              { email: contact.email },
            ],
            ...(contact.companyId ? { companyId: contact.companyId } : {}),
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        })
      : [];

    // 3. Marketing Campaign Deliveries (Broadcast history)
    const broadcastHistory = last10
      ? await db.whatsappCampaignRecipient.findMany({
          where: {
            OR: [
              { phone: { contains: last10 } },
              { contactId: contact.id },
            ],
          },
          include: {
            campaign: { select: { id: true, name: true, type: true, createdAt: true } },
          },
          orderBy: { sentAt: 'desc' },
          take: 15,
        })
      : [];

    // 4. Assigned User
    let assignedUser: any = null;
    if (contact.assignedUserId) {
      assignedUser = await db.user.findUnique({
        where: { id: contact.assignedUserId },
        select: { id: true, name: true, email: true, role: true },
      });
    }

    return NextResponse.json({
      success: true,
      contact: {
        ...contact,
        assignedUser,
        whatsappStats: {
          conversationsCount: conversations.length,
          ...messagesStats,
          conversations,
        },
        crm: {
          leads,
          deals: contact.deals,
          customers: contact.customers,
          meetings: contact.meetings,
        },
        marketing: {
          broadcasts: broadcastHistory,
          drips: contact.dripEnrollments,
        },
      },
    });
  } catch (error: any) {
    console.error('Fetch contact 360 error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch contact profile.' }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth();
    const { id } = await context.params;
    const body = await request.json();

    const existing = await db.contact.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Contact not found' }, { status: 404 });
    }

    // Tenant Isolation Check
    if (session.isTenant && session.companyId && existing.companyId !== session.companyId) {
      return NextResponse.json({ error: 'Unauthorized: Cross-tenant modification denied' }, { status: 403 });
    }

    const {
      name,
      firstName,
      lastName,
      email,
      phone,
      jobTitle,
      department,
      leadStatus,
      assignedUserId,
      source,
      tags,
      customFields,
      optInStatus,
      marketingOptIn,
      optOutReason,
      isBlacklisted,
      notes,
    } = body;

    const dataToUpdate: any = {};
    if (name !== undefined) dataToUpdate.name = name;
    if (firstName !== undefined) dataToUpdate.firstName = firstName;
    if (lastName !== undefined) dataToUpdate.lastName = lastName;
    if (email !== undefined) dataToUpdate.email = email.trim().toLowerCase();
    if (phone !== undefined) dataToUpdate.phone = phone ? normalizePhoneNumber(phone) : null;
    if (jobTitle !== undefined) dataToUpdate.jobTitle = jobTitle;
    if (department !== undefined) dataToUpdate.department = department;
    if (leadStatus !== undefined) dataToUpdate.leadStatus = leadStatus;
    if (assignedUserId !== undefined) dataToUpdate.assignedUserId = assignedUserId || null;
    if (source !== undefined) dataToUpdate.source = source;
    if (tags !== undefined) {
      dataToUpdate.tags = Array.isArray(tags) ? JSON.stringify(tags) : tags;
    }
    if (customFields !== undefined) {
      dataToUpdate.customFields = typeof customFields === 'object' ? JSON.stringify(customFields) : customFields;
    }
    if (notes !== undefined) dataToUpdate.notes = notes;

    // Consent and Blacklist updates
    if (optInStatus !== undefined) {
      dataToUpdate.optInStatus = optInStatus;
      if (optInStatus === 'OPTED_OUT') {
        dataToUpdate.optOutTimestamp = new Date();
        dataToUpdate.optOutReason = optOutReason || 'User Request';
        dataToUpdate.marketingOptIn = false;

        // Sync to WhatsappSuppression
        if (existing.phone) {
          const canonicalPhone = normalizePhoneNumber(existing.phone);
          await db.whatsappSuppression.upsert({
            where: { phone: canonicalPhone },
            update: {
              status: 'OPTED_OUT',
              reason: optOutReason || 'USER_REQUEST',
              source: 'ADMIN_MANUAL',
              optedOutAt: new Date(),
              companyId: existing.companyId,
            },
            create: {
              phone: canonicalPhone,
              status: 'OPTED_OUT',
              reason: optOutReason || 'USER_REQUEST',
              source: 'ADMIN_MANUAL',
              companyId: existing.companyId,
              contactId: existing.id,
              addedById: session.userId,
            },
          });
        }
      }
    }

    if (marketingOptIn !== undefined) {
      dataToUpdate.marketingOptIn = marketingOptIn;
    }

    if (isBlacklisted !== undefined) {
      dataToUpdate.isBlacklisted = isBlacklisted;
      if (isBlacklisted && existing.phone) {
        const canonicalPhone = normalizePhoneNumber(existing.phone);
        await db.whatsappSuppression.upsert({
          where: { phone: canonicalPhone },
          update: {
            status: 'OPTED_OUT',
            reason: optOutReason || 'ADMIN_BLACKLIST',
            source: 'ADMIN_MANUAL',
            optedOutAt: new Date(),
            companyId: existing.companyId,
          },
          create: {
            phone: canonicalPhone,
            status: 'OPTED_OUT',
            reason: optOutReason || 'ADMIN_BLACKLIST',
            source: 'ADMIN_MANUAL',
            companyId: existing.companyId,
            contactId: existing.id,
            addedById: session.userId,
          },
        });
      }
    }

    const updated = await db.contact.update({
      where: { id },
      data: dataToUpdate,
    });

    await logActivity({
      userId: session.userId,
      userEmail: session.email,
      action: 'UPDATE_WHATSAPP_CONTACT',
      entityType: 'Contact',
      entityId: updated.id,
      metadata: { fieldsUpdated: Object.keys(dataToUpdate) },
    });

    return NextResponse.json({ success: true, contact: updated });
  } catch (error: any) {
    console.error('Update contact error:', error);
    return NextResponse.json({ error: error.message || 'Failed to update contact.' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth();
    const { id } = await context.params;

    const existing = await db.contact.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Contact not found' }, { status: 404 });
    }

    // Tenant Isolation Check
    if (session.isTenant && session.companyId && existing.companyId !== session.companyId) {
      return NextResponse.json({ error: 'Unauthorized: Cross-tenant deletion denied' }, { status: 403 });
    }

    await db.contact.delete({ where: { id } });

    await logActivity({
      userId: session.userId,
      userEmail: session.email,
      action: 'DELETE_WHATSAPP_CONTACT',
      entityType: 'Contact',
      entityId: id,
      metadata: { name: existing.name, phone: existing.phone },
    });

    return NextResponse.json({ success: true, message: 'Contact deleted successfully.' });
  } catch (error: any) {
    console.error('Delete contact error:', error);
    return NextResponse.json({ error: error.message || 'Failed to delete contact.' }, { status: 500 });
  }
}
