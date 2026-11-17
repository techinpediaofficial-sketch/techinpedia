import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { requirePermission } from '@/lib/permissions';
import { logActivity } from '@/lib/activity';
import { recordLeadTimelineEvent } from '@/lib/crm';
import { EnquiryStatus } from '@prisma/client';
import { handleApiAuthError } from '@/lib/auth-errors';
import { requireBusinessUnitAccess, canEmployeeAccessBusinessUnit } from '@/lib/business-units';
import { canUserAccessLead } from '@/lib/access-policy';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth();
    requirePermission(session, 'crm.leads.view');
    const { id } = await params;

    const enquiry = await db.enquiry.findUnique({
      where: { id },
      include: {
        assignedUser: { select: { id: true, name: true, email: true, role: true } },
        assignedEmployee: { select: { id: true, name: true, employeeCode: true, companyEmail: true, phone: true } },
        department: { select: { id: true, name: true, code: true } },
        team: { select: { id: true, name: true, code: true } },
        businessUnit: { select: { id: true, code: true, name: true } },
        wonDeal: { select: { id: true, title: true, value: true, stageId: true } },
        notes: {
          orderBy: { createdAt: 'desc' },
          include: { user: { select: { id: true, name: true, email: true } } },
        },
      },
    });

    if (!enquiry) {
      return NextResponse.json({ error: 'Enquiry not found.' }, { status: 404 });
    }

    // Policy check: tenant isolation & visibility
    const access = await canUserAccessLead(session, enquiry);
    if (!access.allowed) {
      return NextResponse.json({ error: 'Forbidden: ' + access.reason }, { status: 403 });
    }

    requireBusinessUnitAccess(session, enquiry.businessUnitId);

    // Track firstViewedAt on first successful view after assignment
    if (
      (enquiry.assignedTo === session.userId || enquiry.assignedEmployeeId === session.employeeId) &&
      !enquiry.firstViewedAt &&
      enquiry.assignedAt
    ) {
      await db.enquiry.update({
        where: { id: enquiry.id },
        data: { firstViewedAt: new Date() },
      }).catch(() => {});
    }

    // Parallel fetch related CRM records
    const [stage, contact, companyEntity, timelineEvents, followUps, meetings] = await Promise.all([
      enquiry.pipelineStageId
        ? db.pipelineStage.findUnique({
            where: { id: enquiry.pipelineStageId },
            include: {
              pipeline: {
                include: {
                  stages: { orderBy: { order: 'asc' } },
                },
              },
            },
          })
        : null,
      enquiry.email
        ? db.contact.findFirst({
            where: { email: enquiry.email.toLowerCase() },
            include: { company: true },
          })
        : null,
      enquiry.company
        ? db.company.findFirst({
            where: { name: enquiry.company },
            include: {
              contacts: true,
              deals: { take: 5, orderBy: { createdAt: 'desc' } },
            },
          })
        : null,
      db.leadTimelineEvent.findMany({
        where: { enquiryId: id },
        orderBy: { createdAt: 'desc' },
        take: 50,
      }),
      db.followUp.findMany({
        where: { enquiryId: id },
        orderBy: { scheduledAt: 'desc' },
        include: {
          assignedEmployee: { select: { id: true, name: true, employeeCode: true } },
        },
      }),
      db.meeting.findMany({
        where: { enquiryId: id },
        orderBy: { startTime: 'desc' },
        select: {
          id: true,
          title: true,
          startTime: true,
          endTime: true,
          status: true,
          meetingType: true,
          location: true,
          description: true,
        },
      }),
    ]);

    return NextResponse.json({
      enquiry: {
        ...enquiry,
        stage,
        contact,
        companyEntity,
        timelineEvents,
        followUps,
        meetings,
      },
    });
  } catch (error: any) {
    const authResponse = handleApiAuthError(error);
    if (authResponse) return authResponse;

    console.error('Fetch enquiry detail error:', error);
    return NextResponse.json({ error: 'Failed to fetch enquiry detail.' }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth();
    requirePermission(session, 'crm.leads.edit');
    const { id } = await params;
    const body = await request.json();

    const existing = await db.enquiry.findUnique({
      where: { id },
      include: { assignedUser: true, assignedEmployee: true },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Enquiry not found.' }, { status: 404 });
    }

    const access = await canUserAccessLead(session, existing);
    if (!access.allowed) {
      return NextResponse.json({ error: 'Forbidden: ' + access.reason }, { status: 403 });
    }

    requireBusinessUnitAccess(session, existing.businessUnitId);

    const {
      status,
      assignedTo,
      assignedEmployeeId,
      departmentId,
      teamId,
      businessUnitId,
      pipelineStageId,
      priority,
      temperature,
      estimatedValue,
      score,
      lostReason,
      lostNotes,
      internalNotes,
      nextFollowUp,
      name,
      email,
      phone,
      company,
      service,
      budget,
      message,
    } = body;

    const updateData: any = {};

    // Track firstResponseAt when lead moves out of NEW or is contacted
    if (!existing.firstResponseAt && existing.assignedAt && status && status !== 'NEW') {
      updateData.firstResponseAt = new Date();
    }

    if (status && Object.values(EnquiryStatus).includes(status)) {
      updateData.status = status;
      if (status === 'WON' || status === 'CONVERTED') {
        updateData.convertedDate = new Date();
      } else if (status === 'LOST' || status === 'REJECTED') {
        updateData.lostDate = new Date();
      }
    }

    if (businessUnitId !== undefined) {
      if (businessUnitId) {
        requireBusinessUnitAccess(session, businessUnitId);
      }
      updateData.businessUnitId = businessUnitId || null;
    }

    if (assignedTo !== undefined) {
      if (assignedTo !== existing.assignedTo) {
        updateData.assignedTo = assignedTo || null;
        updateData.assignedAt = new Date();
        updateData.assignmentAcceptedAt = null;
        updateData.assignmentAcceptedBy = null;
      }
    }
    if (assignedEmployeeId !== undefined) {
      if (assignedEmployeeId !== existing.assignedEmployeeId) {
        if (assignedEmployeeId) {
          const canAssign = await canEmployeeAccessBusinessUnit(assignedEmployeeId, businessUnitId !== undefined ? businessUnitId : existing.businessUnitId);
          if (!canAssign) {
            return NextResponse.json({ error: 'Cannot assign to an employee without access to this Business Unit.' }, { status: 400 });
          }
        }
        updateData.assignedEmployeeId = assignedEmployeeId || null;
        updateData.assignedAt = new Date();
        updateData.assignmentAcceptedAt = null;
        updateData.assignmentAcceptedBy = null;
      }
    }
    if (departmentId !== undefined) updateData.departmentId = departmentId || null;
    if (teamId !== undefined) updateData.teamId = teamId || null;
    if (pipelineStageId !== undefined) updateData.pipelineStageId = pipelineStageId || null;

    if (priority) updateData.priority = priority;
    if (temperature) updateData.temperature = temperature;
    if (estimatedValue !== undefined) updateData.estimatedValue = estimatedValue ? parseFloat(estimatedValue) : null;
    if (score !== undefined) updateData.score = parseInt(score);
    if (lostReason !== undefined) updateData.lostReason = lostReason;
    if (lostNotes !== undefined) updateData.lostNotes = lostNotes;
    if (internalNotes !== undefined) updateData.internalNotes = internalNotes;
    if (nextFollowUp !== undefined) updateData.nextFollowUp = nextFollowUp ? new Date(nextFollowUp) : null;
    if (name) updateData.name = name.trim();
    if (email) updateData.email = email.trim().toLowerCase();
    if (phone !== undefined) updateData.phone = phone ? phone.trim() : null;
    if (company !== undefined) updateData.company = company ? company.trim() : null;
    if (service !== undefined) updateData.service = service ? service.trim() : null;
    if (budget !== undefined) updateData.budget = budget ? budget.trim() : null;
    if (message !== undefined) updateData.message = message ? message.trim() : null;

    const updated = await db.enquiry.update({
      where: { id },
      data: updateData,
      include: {
        assignedUser: { select: { id: true, name: true, email: true } },
        assignedEmployee: { select: { id: true, name: true, employeeCode: true, companyEmail: true } },
        department: { select: { id: true, name: true } },
        team: { select: { id: true, name: true } },
        businessUnit: { select: { id: true, code: true, name: true } },
        wonDeal: { select: { id: true, title: true, value: true } },
      },
    });

    // Record Timeline Events for significant transitions
    if (pipelineStageId && pipelineStageId !== existing.pipelineStageId) {
      const [newStage, oldStage] = await Promise.all([
        db.pipelineStage.findUnique({ where: { id: pipelineStageId } }),
        existing.pipelineStageId ? db.pipelineStage.findUnique({ where: { id: existing.pipelineStageId } }) : null,
      ]);

      await recordLeadTimelineEvent({
        enquiryId: id,
        type: 'STATUS_CHANGE',
        title: `Pipeline Stage Changed to ${newStage?.name || 'New Stage'}`,
        description: `Stage moved from "${oldStage?.name || 'None'}" to "${newStage?.name || 'Unknown'}" by ${session.email}`,
        metadata: { fromStage: oldStage?.name, toStage: newStage?.name },
        actorEmail: session.email,
      });
    }

    if (assignedTo !== undefined && assignedTo !== existing.assignedTo) {
      const newUser = assignedTo ? await db.user.findUnique({ where: { id: assignedTo } }) : null;
      await recordLeadTimelineEvent({
        enquiryId: id,
        type: 'ASSIGNMENT',
        title: newUser ? `Lead Assigned to ${newUser.name}` : 'Lead Unassigned',
        description: newUser ? `Ownership assigned to ${newUser.name} (${newUser.email})` : 'Lead ownership cleared',
        metadata: { previousUser: existing.assignedUser?.name, newUser: newUser?.name },
        actorEmail: session.email,
      });
    }

    if (status && status !== existing.status) {
      await recordLeadTimelineEvent({
        enquiryId: id,
        type: 'STATUS_CHANGE',
        title: `Lead Status Changed to ${status}`,
        description: `Status updated from ${existing.status} to ${status}`,
        actorEmail: session.email,
      });
    }

    await logActivity({
      userId: session.userId,
      userEmail: session.email,
      action: 'UPDATE_ENQUIRY',
      entityType: 'Enquiry',
      entityId: id,
      metadata: updateData,
    });

    return NextResponse.json({ success: true, enquiry: updated });
  } catch (error: any) {
    const authResponse = handleApiAuthError(error);
    if (authResponse) return authResponse;

    console.error('Update enquiry error:', error);
    return NextResponse.json({ error: 'Failed to update enquiry.' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth();
    requirePermission(session, 'crm.leads.delete');
    const { id } = await params;

    const existing = await db.enquiry.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Enquiry not found.' }, { status: 404 });
    }

    if (session.isTenant && existing.companyId !== session.companyId) {
      return NextResponse.json({ error: 'Access denied to this company lead.' }, { status: 403 });
    }
    
    requireBusinessUnitAccess(session, existing.businessUnitId);

    await db.enquiry.delete({ where: { id } });

    await logActivity({
      userId: session.userId,
      userEmail: session.email,
      action: 'DELETE_ENQUIRY',
      entityType: 'Enquiry',
      entityId: id,
      metadata: { deletedBy: session.email },
    });

    return NextResponse.json({ success: true, message: 'Enquiry deleted successfully.' });
  } catch (error: any) {
    const authResponse = handleApiAuthError(error);
    if (authResponse) return authResponse;

    console.error('Delete enquiry error:', error);
    return NextResponse.json({ error: 'Failed to delete enquiry.' }, { status: 500 });
  }
}
