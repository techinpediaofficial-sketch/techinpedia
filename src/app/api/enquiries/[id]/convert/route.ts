import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { recordLeadTimelineEvent } from '@/lib/crm';
import { EnquiryStatus } from '@prisma/client';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth();
    const { id } = await params;
    const body = await request.json().catch(() => ({}));

    const enquiry = await db.enquiry.findUnique({
      where: { id },
      include: {
        assignedEmployee: true,
        assignedUser: true,
      },
    });

    if (!enquiry) {
      return NextResponse.json({ error: 'Lead not found.' }, { status: 404 });
    }

    if (enquiry.wonDealId) {
      const existingDeal = await db.deal.findUnique({
        where: { id: enquiry.wonDealId },
      });
      return NextResponse.json({
        success: true,
        message: 'Lead has already been converted to a Deal.',
        deal: existingDeal,
      });
    }

    // 1. Find or create Company
    let companyId: string | null = null;
    if (enquiry.company && enquiry.company.trim() !== '') {
      let company = await db.company.findFirst({
        where: { name: enquiry.company.trim() },
      });
      if (!company) {
        company = await db.company.create({
          data: {
            name: enquiry.company.trim(),
            email: enquiry.email,
            phone: enquiry.phone,
            website: enquiry.website,
          },
        });
      }
      companyId = company.id;
    }

    // 2. Find or create Contact
    let contact = await db.contact.findFirst({
      where: { email: enquiry.email.toLowerCase() },
    });
    if (!contact) {
      contact = await db.contact.create({
        data: {
          name: enquiry.name,
          email: enquiry.email.toLowerCase(),
          phone: enquiry.phone,
          companyId,
          isPrimary: true,
        },
      });
    }

    // 3. Find or create Customer
    let customer = await db.customer.findFirst({
      where: { email: enquiry.email.toLowerCase() },
    });
    if (!customer) {
      customer = await db.customer.create({
        data: {
          name: enquiry.company || enquiry.name,
          email: enquiry.email.toLowerCase(),
          phone: enquiry.phone,
          companyId,
          contactId: contact.id,
          status: 'ACTIVE',
          accountManagerId: enquiry.assignedEmployeeId || enquiry.assignedTo,
        },
      });
    }

    // 4. Determine Pipeline and Initial Stage
    let pipeline = await db.pipeline.findFirst({
      where: { isDefault: true },
      include: { stages: { orderBy: { order: 'asc' } } },
    });
    if (!pipeline) {
      pipeline = await db.pipeline.findFirst({
        include: { stages: { orderBy: { order: 'asc' } } },
      });
    }

    if (!pipeline || pipeline.stages.length === 0) {
      return NextResponse.json(
        { error: 'No active sales pipeline or stages configured.' },
        { status: 400 }
      );
    }

    const stageId = body.stageId || enquiry.pipelineStageId || pipeline.stages[0].id;
    const dealTitle = body.dealTitle || `${enquiry.company || enquiry.name} - ${enquiry.service || 'New Deal'}`;
    const dealValue = body.dealValue !== undefined ? parseFloat(body.dealValue) : (enquiry.estimatedValue || 0);

    // 5. Create Deal
    const deal = await db.deal.create({
      data: {
        title: dealTitle,
        companyId,
        contactId: contact.id,
        customerId: customer.id,
        pipelineId: pipeline.id,
        stageId,
        value: dealValue,
        probability: body.probability || 50,
        assignedToId: enquiry.assignedTo,
        assignedEmployeeId: enquiry.assignedEmployeeId,
        source: enquiry.source,
        notes: `Converted from Lead ID: ${enquiry.id}\n${enquiry.message || ''}`,
      },
    });

    // 6. Record DealStageHistory
    await db.dealStageHistory.create({
      data: {
        dealId: deal.id,
        fromStageId: null,
        toStageId: stageId,
        changedById: session.userId,
        durationHours: 0,
        notes: 'Deal created upon conversion from inbound Lead.',
      },
    });

    // 7. Update Enquiry status and link wonDealId
    await db.enquiry.update({
      where: { id: enquiry.id },
      data: {
        status: EnquiryStatus.WON,
        convertedDate: new Date(),
        wonDealId: deal.id,
      },
    });

    // 8. Re-link any existing Lead follow-ups to the new Deal
    await db.followUp.updateMany({
      where: { enquiryId: enquiry.id },
      data: {
        dealId: deal.id,
        customerId: customer.id,
      },
    });

    // 9. Record Timeline Event
    await recordLeadTimelineEvent({
      enquiryId: enquiry.id,
      dealId: deal.id,
      customerId: customer.id,
      type: 'CONVERTED',
      title: 'Lead Converted to Deal & Customer',
      description: `Converted by ${session.email}. Deal "${deal.title}" created with value ₹${deal.value.toLocaleString()}.`,
      actorEmail: session.email,
    });

    return NextResponse.json({
      success: true,
      message: 'Lead successfully converted to Customer and Deal!',
      deal,
      customer,
      contact,
    });
  } catch (error) {
    console.error('Lead conversion error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to convert lead.' },
      { status: 500 }
    );
  }
}
