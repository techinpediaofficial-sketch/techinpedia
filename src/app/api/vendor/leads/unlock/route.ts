import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { recordLeadTimelineEvent } from '@/lib/crm';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { leadId, vendorId = 'demo-vendor' } = body;

    if (!leadId) {
      return NextResponse.json({ error: 'leadId is required' }, { status: 400 });
    }

    const lead = await db.enquiry.findUnique({
      where: { id: leadId },
      include: { notes: true },
    });

    if (!lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    // Check if already unlocked
    const alreadyUnlocked = lead.notes.some((n) =>
      n.note.includes(`[URBAN_UNLOCKED`) || n.note.includes(vendorId)
    );

    if (!alreadyUnlocked) {
      // Find a system user or admin to associate the note
      const adminUser = await db.user.findFirst({
        where: { role: 'SUPER_ADMIN' },
        select: { id: true, email: true },
      });

      if (adminUser) {
        await db.enquiryNote.create({
          data: {
            enquiryId: lead.id,
            userId: adminUser.id,
            note: `[URBAN_UNLOCKED:${vendorId}] Vendor unlocked buyer contact details. 1 credit deducted.`,
          },
        });
      }

      // Record CRM timeline event
      await recordLeadTimelineEvent({
        enquiryId: lead.id,
        type: 'MARKETPLACE_LEAD_UNLOCKED',
        title: 'Lead Contact Unlocked',
        description: `Vendor (${vendorId}) unlocked buyer contact info. 1 lead credit deducted.`,
        metadata: {
          vendorId,
          leadId: lead.id,
          buyerPhone: lead.phone,
          unlockedAt: new Date().toISOString(),
        },
        actorEmail: adminUser?.email || 'vendor@urban.techinpedia.com',
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Lead contact unlocked successfully',
      lead: {
        id: lead.id,
        customerName: lead.name,
        company: lead.company,
        phone: lead.phone,
        email: lead.email,
        city: lead.city,
        address: lead.address,
        service: lead.service,
        message: lead.message,
        budget: lead.budget,
        unlocked: true,
      },
    });
  } catch (error: any) {
    console.error('Vendor unlock lead POST error:', error);
    return NextResponse.json(
      { error: 'Failed to unlock lead' },
      { status: 500 }
    );
  }
}
