import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { logActivity } from '@/lib/activity';
import { logAuditEvent } from '@/lib/auditLogger';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth();
    const { id } = await params;

    const deal = await db.deal.findUnique({
      where: { id },
      include: {
        stage: true,
        pipeline: { include: { stages: { orderBy: { order: 'asc' } } } },
        customer: true,
        company: { include: { contacts: true } },
        contact: true,
        assignedEmployee: { select: { id: true, name: true, employeeCode: true, companyEmail: true } },
        items: { orderBy: { createdAt: 'asc' } },
        stageHistories: { orderBy: { createdAt: 'desc' } },
        quotations: { orderBy: { createdAt: 'desc' } },
        proposals: { orderBy: { createdAt: 'desc' } },
        contracts: { orderBy: { createdAt: 'desc' } },
        followUps: { orderBy: { scheduledAt: 'desc' }, include: { assignedEmployee: true } },
      },
    });

    if (!deal) {
      return NextResponse.json({ error: 'Deal not found.' }, { status: 404 });
    }

    return NextResponse.json({ success: true, deal });
  } catch (error) {
    console.error('Fetch deal error:', error);
    return NextResponse.json({ error: 'Failed to fetch deal.' }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth();
    const { id } = await params;
    const body = await request.json();

    const existing = await db.deal.findUnique({
      where: { id },
      include: { stage: true },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Deal not found.' }, { status: 404 });
    }

    const {
      title,
      stageId,
      pipelineId,
      value,
      probability,
      expectedCloseDate,
      lostReason,
      lostNotes,
      notes,
      assignedToId,
      assignedEmployeeId,
      items,
      convertToProject,
      projectName,
    } = body;

    const updateData: any = {};

    if (title) updateData.title = title.trim();
    if (pipelineId) updateData.pipelineId = pipelineId;
    if (value !== undefined) updateData.value = parseFloat(value) || 0;
    if (probability !== undefined) updateData.probability = parseInt(probability);
    if (expectedCloseDate !== undefined) updateData.expectedCloseDate = expectedCloseDate ? new Date(expectedCloseDate) : null;
    if (lostReason !== undefined) updateData.lostReason = lostReason;
    if (lostNotes !== undefined) updateData.lostNotes = lostNotes;
    if (notes !== undefined) updateData.notes = notes;
    if (assignedToId !== undefined) updateData.assignedToId = assignedToId || null;
    if (assignedEmployeeId !== undefined) updateData.assignedEmployeeId = assignedEmployeeId || null;

    let targetStage: any = null;
    if (stageId && stageId !== existing.stageId) {
      targetStage = await db.pipelineStage.findUnique({ where: { id: stageId } });
      if (targetStage) {
        updateData.stageId = stageId;
        updateData.probability = targetStage.probability;
        if (targetStage.isWon) {
          updateData.wonDate = new Date();
          updateData.lostDate = null;
        } else if (targetStage.isLost) {
          updateData.lostDate = new Date();
          updateData.wonDate = null;
        } else {
          updateData.wonDate = null;
          updateData.lostDate = null;
        }

        // Calculate duration in previous stage
        const lastHistory = await db.dealStageHistory.findFirst({
          where: { dealId: id },
          orderBy: { createdAt: 'desc' },
        });
        const durationHours = lastHistory
          ? Math.max(1, Math.round((Date.now() - new Date(lastHistory.createdAt).getTime()) / (1000 * 60 * 60)))
          : 0;

        // Record Stage History
        await db.dealStageHistory.create({
          data: {
            dealId: id,
            fromStageId: existing.stageId,
            toStageId: stageId,
            changedById: session.userId,
            durationHours,
            notes: targetStage.isLost && lostReason ? `Lost Reason: ${lostReason}` : null,
          },
        });
      }
    }

    // Handle line items replacement if provided
    if (Array.isArray(items)) {
      await db.dealItem.deleteMany({ where: { dealId: id } });
      let itemsTotal = 0;
      if (items.length > 0) {
        const itemCreates = items.map((item: any) => {
          const qty = parseInt(item.quantity) || 1;
          const price = parseFloat(item.unitPrice) || 0;
          const total = qty * price;
          itemsTotal += total;
          return {
            dealId: id,
            serviceName: item.serviceName || 'Service',
            quantity: qty,
            unitPrice: price,
            totalPrice: total,
            notes: item.notes || null,
          };
        });
        await db.dealItem.createMany({ data: itemCreates });
      }
      if (value === undefined) {
        updateData.value = itemsTotal;
      }
    }

    const updatedDeal = await db.deal.update({
      where: { id },
      data: updateData,
      include: {
        stage: true,
        pipeline: true,
        customer: true,
        assignedEmployee: true,
        items: true,
        stageHistories: { orderBy: { createdAt: 'desc' }, take: 10 },
      },
    });

    // If deal won and user wants to convert to project
    let projectCreated = null;
    if (convertToProject && updatedDeal.stage.isWon && updatedDeal.customerId) {
      projectCreated = await db.projectRecord.create({
        data: {
          code: `PRJ-${Date.now().toString().slice(-6)}`,
          name: projectName || `${updatedDeal.title} Project`,
          customerId: updatedDeal.customerId,
          status: 'ACTIVE',
          budget: updatedDeal.value,
          description: `Automatically created from Won Deal: ${updatedDeal.title}`,
        },
      });

      await logActivity({
        userId: session.userId,
        userEmail: session.email,
        action: 'CONVERT_DEAL_TO_PROJECT',
        entityType: 'ProjectRecord',
        entityId: projectCreated.id,
        metadata: { dealId: updatedDeal.id, customerId: updatedDeal.customerId },
      });
    }

    const beforeSnapshot = {
      title: existing.title,
      value: existing.value,
      stage: existing.stage.name,
      stageId: existing.stageId,
      probability: existing.probability,
      expectedCloseDate: existing.expectedCloseDate,
      lostReason: existing.lostReason,
      lostNotes: existing.lostNotes,
      notes: existing.notes,
    };

    const afterSnapshot = {
      title: updatedDeal.title,
      value: updatedDeal.value,
      stage: updatedDeal.stage.name,
      stageId: updatedDeal.stageId,
      probability: updatedDeal.probability,
      expectedCloseDate: updatedDeal.expectedCloseDate,
      lostReason: updatedDeal.lostReason,
      lostNotes: updatedDeal.lostNotes,
      notes: updatedDeal.notes,
    };

    const isStageChange = existing.stageId !== updatedDeal.stageId;
    await logAuditEvent({
      userId: session.userId,
      userEmail: session.email,
      action: isStageChange ? 'STAGE_CHANGED' : 'UPDATED',
      entityType: 'DEAL',
      entityId: id,
      before: beforeSnapshot,
      after: afterSnapshot,
      details: isStageChange
        ? `Stage changed from "${existing.stage.name}" to "${updatedDeal.stage.name}" (Value: ₹${updatedDeal.value})`
        : `Updated deal "${updatedDeal.title}"`,
    });

    return NextResponse.json({
      success: true,
      deal: updatedDeal,
      project: projectCreated,
    });
  } catch (error) {
    console.error('Update deal error:', error);
    return NextResponse.json({ error: 'Failed to update deal.' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth();
    const { id } = await params;

    await db.deal.delete({ where: { id } });

    await logActivity({
      userId: session.userId,
      userEmail: session.email,
      action: 'DELETE_DEAL',
      entityType: 'Deal',
      entityId: id,
      metadata: { deletedBy: session.email },
    });

    return NextResponse.json({ success: true, message: 'Deal deleted successfully.' });
  } catch (error) {
    console.error('Delete deal error:', error);
    return NextResponse.json({ error: 'Failed to delete deal.' }, { status: 500 });
  }
}
