import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';

// GET: Fetch or init employee live status
// POST: Update employee status

export async function GET() {
  try {
    const session = await requireAuth();

    const status = await db.employeeStatus.findUnique({
      where: { userId: session.userId },
    });

    return NextResponse.json({ status: status || { userId: session.userId, status: 'OFFLINE' } });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireAuth();
    const body = await request.json();

    const { status, currentLeadId, currentChatId, currentTicketId } = body;

    const validStatuses = [
      'ONLINE', 'OFFLINE', 'AVAILABLE', 'BUSY',
      'HANDLING_LEAD', 'HANDLING_CHAT', 'HANDLING_TICKET',
      'ON_BREAK', 'ON_LEAVE',
    ];

    if (status && !validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    const employeeStatus = await db.employeeStatus.upsert({
      where: { userId: session.userId },
      update: {
        status: status || undefined,
        currentLeadId: currentLeadId !== undefined ? currentLeadId : undefined,
        currentChatId: currentChatId !== undefined ? currentChatId : undefined,
        currentTicketId: currentTicketId !== undefined ? currentTicketId : undefined,
        lastActivityAt: new Date(),
      },
      create: {
        userId: session.userId,
        companyId: session.companyId || null,
        status: status || 'ONLINE',
        currentLeadId: currentLeadId || null,
        currentChatId: currentChatId || null,
        currentTicketId: currentTicketId || null,
        lastActivityAt: new Date(),
      },
    });

    return NextResponse.json({ success: true, status: employeeStatus });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
