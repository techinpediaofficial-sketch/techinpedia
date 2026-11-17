import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { logActivity } from '@/lib/activity';
import { canSendWhatsAppMessage } from '@/lib/whatsapp-eligibility';
import { enqueueJob } from '@/lib/queue/jobQueue';

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth();
    const { id } = await context.params;

    const campaign = await db.dripCampaign.findUnique({ where: { id } });
    if (!campaign) {
      return NextResponse.json({ error: 'Drip campaign not found.' }, { status: 404 });
    }

    if (session.isTenant && session.companyId && campaign.companyId !== session.companyId) {
      return NextResponse.json({ error: 'Unauthorized: Cross-tenant drip access denied' }, { status: 403 });
    }

    const enrollments = await db.dripEnrollment.findMany({
      where: { campaignId: id },
      include: {
        contact: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
            leadStatus: true,
            optInStatus: true,
            marketingOptIn: true,
          },
        },
        stepLogs: {
          orderBy: { executedAt: 'desc' },
          take: 10,
        },
      },
      orderBy: { enrolledAt: 'desc' },
      take: 100,
    });

    return NextResponse.json({ success: true, enrollments });
  } catch (error: any) {
    console.error('Fetch drip enrollments error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch enrollments.' }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth();
    const { id } = await context.params;
    const body = await request.json();

    const { contactId } = body;
    if (!contactId) {
      return NextResponse.json({ error: 'contactId is required for enrollment.' }, { status: 400 });
    }

    const campaign = await db.dripCampaign.findUnique({ where: { id } });
    if (!campaign) {
      return NextResponse.json({ error: 'Drip campaign not found.' }, { status: 404 });
    }

    if (session.isTenant && session.companyId && campaign.companyId !== session.companyId) {
      return NextResponse.json({ error: 'Unauthorized: Cross-tenant enrollment denied' }, { status: 403 });
    }

    const contact = await db.contact.findUnique({ where: { id: contactId } });
    if (!contact) {
      return NextResponse.json({ error: 'Contact not found.' }, { status: 404 });
    }

    // Check Eligibility: Consent & Blacklist
    if (contact.phone) {
      const eligibility = await canSendWhatsAppMessage({
        companyId: campaign.companyId,
        phone: contact.phone,
        isMarketing: true,
        isTemplate: true,
      });

      if (!eligibility.allowed) {
        return NextResponse.json(
          {
            error: `Contact is not eligible for marketing drip: ${eligibility.reason}`,
            code: eligibility.code,
          },
          { status: 422 }
        );
      }
    }

    // Check if already actively enrolled
    const existingEnrollment = await db.dripEnrollment.findFirst({
      where: {
        campaignId: id,
        contactId,
        status: { in: ['ACTIVE', 'WAITING'] },
      },
    });

    if (existingEnrollment) {
      return NextResponse.json(
        { error: 'Contact is already actively enrolled in this drip campaign.' },
        { status: 409 }
      );
    }

    let steps: any[] = [];
    try {
      steps = JSON.parse(campaign.stepsJson);
    } catch {}

    const firstStep = steps[0] || null;

    const enrollment = await db.dripEnrollment.create({
      data: {
        campaignId: id,
        contactId,
        currentStepId: firstStep?.id || 'step_1',
        status: 'ACTIVE',
        enrolledAt: new Date(),
        nextActionAt: new Date(),
      },
    });

    // Update campaign metrics
    await db.dripCampaign.update({
      where: { id },
      data: {
        totalEnrolled: { increment: 1 },
        activeCount: { increment: 1 },
      },
    });

    // Enqueue background drip execution job
    await enqueueJob(
      'whatsapp-drip-step',
      `drip:${enrollment.id}:${firstStep?.id || 'step_1'}`,
      {
        enrollmentId: enrollment.id,
        campaignId: id,
        contactId,
        stepId: firstStep?.id || 'step_1',
      },
      { priority: 5 }
    );

    await logActivity({
      userId: session.userId,
      userEmail: session.email,
      action: 'ENROLL_DRIP_CONTACT',
      entityType: 'DripEnrollment',
      entityId: enrollment.id,
      metadata: { campaignName: campaign.name, contactName: contact.name },
    });

    return NextResponse.json({ success: true, enrollment });
  } catch (error: any) {
    console.error('Enroll in drip error:', error);
    return NextResponse.json({ error: error.message || 'Failed to enroll contact.' }, { status: 500 });
  }
}
