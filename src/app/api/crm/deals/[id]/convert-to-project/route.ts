import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { logActivity } from '@/lib/activity';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth();
    const { id } = await params;
    const body = await request.json().catch(() => ({}));

    const deal = await db.deal.findUnique({
      where: { id },
      include: {
        customer: true,
        company: true,
        items: true,
      },
    });

    if (!deal) {
      return NextResponse.json({ error: 'Deal not found.' }, { status: 404 });
    }

    if (!deal.customerId) {
      return NextResponse.json(
        { error: 'Deal must be linked to a customer before converting to a delivery project.' },
        { status: 400 }
      );
    }

    const projectCode = `PRJ-${Date.now().toString().slice(-6)}`;
    const projectName = body.name || `${deal.title} - Project`;

    const project = await db.projectRecord.create({
      data: {
        code: projectCode,
        name: projectName,
        customerId: deal.customerId,
        status: 'ACTIVE',
        budget: deal.value,
        progress: 0,
        description: body.description || `Initialized from Deal "${deal.title}".\nValue: ₹${deal.value.toLocaleString()}`,
      },
    });

    // If deal had line items, create them as initial milestone/deliverable tasks
    if (deal.items && deal.items.length > 0) {
      const taskCreates = deal.items.map((item, idx) => ({
        projectId: project.id,
        title: `Deliverable: ${item.serviceName}`,
        description: item.notes || `Deliver ${item.quantity}x ${item.serviceName}`,
        status: 'TODO',
        priority: 'MEDIUM',
        order: idx,
      }));
      await db.task.createMany({ data: taskCreates });
    }

    await logActivity({
      userId: session.userId,
      userEmail: session.email,
      action: 'CONVERT_DEAL_TO_PROJECT',
      entityType: 'ProjectRecord',
      entityId: project.id,
      metadata: { dealId: deal.id, customerId: deal.customerId, projectCode },
    });

    return NextResponse.json({
      success: true,
      message: 'Delivery project created successfully!',
      project,
    });
  } catch (error) {
    console.error('Convert deal to project error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to convert deal to project.' },
      { status: 500 }
    );
  }
}
