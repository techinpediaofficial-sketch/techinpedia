import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { hasPermission } from '@/lib/permissions';
import { logActivity } from '@/lib/activity';

export async function GET(request: Request) {
  try {
    const session = await requireAuth();

    // Permission check
    const canExport =
      hasPermission(session, 'crm.leads.export') ||
      session.role === 'SUPER_ADMIN' ||
      session.role === 'ADMIN' ||
      session.companyRole === 'OWNER';

    if (!canExport) {
      return NextResponse.json(
        { error: 'Forbidden: You do not have permission to export contact data.' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const isTenant = session.isTenant;
    const requestedCompanyId = searchParams.get('companyId');
    const companyId = isTenant && session.companyId ? session.companyId : requestedCompanyId || undefined;

    const where: any = {};
    if (companyId && companyId !== 'master') {
      where.companyId = companyId;
    }

    const contacts = await db.contact.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 5000,
    });

    const headers = [
      'ID',
      'Name',
      'Phone',
      'Email',
      'Job Title',
      'Department',
      'Lead Status',
      'Source',
      'Tags',
      'Opt-In Status',
      'Marketing Opt-In',
      'Is Blacklisted',
      'Created At',
      'Last Interaction At',
    ];

    const escapeCsv = (val: any) => {
      if (val === null || val === undefined) return '';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };

    const csvRows = [headers.join(',')];
    for (const c of contacts) {
      let tagsStr = '';
      try {
        if (c.tags) {
          const parsed = JSON.parse(c.tags);
          if (Array.isArray(parsed)) tagsStr = parsed.join('; ');
          else tagsStr = String(c.tags);
        }
      } catch {
        tagsStr = String(c.tags || '');
      }

      const row = [
        escapeCsv(c.id),
        escapeCsv(c.name),
        escapeCsv(c.phone),
        escapeCsv(c.email),
        escapeCsv(c.jobTitle),
        escapeCsv(c.department),
        escapeCsv(c.leadStatus),
        escapeCsv(c.source),
        escapeCsv(tagsStr),
        escapeCsv(c.optInStatus),
        escapeCsv(c.marketingOptIn ? 'YES' : 'NO'),
        escapeCsv(c.isBlacklisted ? 'YES' : 'NO'),
        escapeCsv(c.createdAt ? new Date(c.createdAt).toISOString() : ''),
        escapeCsv(c.lastInteractionAt ? new Date(c.lastInteractionAt).toISOString() : ''),
      ];
      csvRows.push(row.join(','));
    }

    await logActivity({
      userId: session.userId,
      userEmail: session.email,
      action: 'EXPORT_CONTACTS_CSV',
      entityType: 'Contact',
      metadata: { count: contacts.length, companyId },
    });

    const csvContent = csvRows.join('\n');
    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="contacts-export-${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    });
  } catch (error: any) {
    console.error('Export contacts error:', error);
    return NextResponse.json({ error: error.message || 'Failed to export contacts.' }, { status: 500 });
  }
}
