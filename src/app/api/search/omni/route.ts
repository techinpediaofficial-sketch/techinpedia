import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';

export interface SearchResultItem {
  id: string;
  category: 'LEAD' | 'CUSTOMER' | 'DEAL' | 'EMPLOYEE' | 'INVOICE' | 'MEETING' | 'PROJECT';
  title: string;
  subtitle: string;
  badge?: string;
  badgeColor?: string;
  url: string;
  createdAt?: string;
}

export async function GET(request: Request) {
  const startTime = Date.now();
  try {
    await requireAuth();
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q')?.trim() || '';
    const category = searchParams.get('category') || 'ALL';

    if (!q || q.length < 2) {
      return NextResponse.json({
        success: true,
        query: q,
        totalCount: 0,
        responseTimeMs: Date.now() - startTime,
        results: {
          leads: [],
          customers: [],
          deals: [],
          employees: [],
          invoices: [],
          meetings: [],
          projects: [],
        },
      });
    }

    const limitPerCategory = 5;

    // Parallel multi-entity queries using Promise.all
    const [
      leads,
      customers,
      deals,
      employees,
      invoices,
      meetings,
      projects,
    ] = await Promise.all([
      // 1. Leads / Inquiries
      category === 'ALL' || category === 'LEAD'
        ? db.enquiry.findMany({
            where: {
              OR: [
                { name: { contains: q } },
                { email: { contains: q } },
                { phone: { contains: q } },
                { company: { contains: q } },
              ],
            },
            select: { id: true, name: true, email: true, phone: true, company: true, status: true, createdAt: true },
            take: limitPerCategory,
            orderBy: { createdAt: 'desc' },
          })
        : Promise.resolve([]),

      // 2. Customers
      category === 'ALL' || category === 'CUSTOMER'
        ? db.customer.findMany({
            where: {
              OR: [
                { name: { contains: q } },
                { email: { contains: q } },
                { phone: { contains: q } },
              ],
            },
            select: { id: true, name: true, email: true, phone: true, status: true, lifetimeValue: true },
            take: limitPerCategory,
            orderBy: { createdAt: 'desc' },
          })
        : Promise.resolve([]),

      // 3. Deals
      category === 'ALL' || category === 'DEAL'
        ? db.deal.findMany({
            where: {
              OR: [
                { title: { contains: q } },
                { notes: { contains: q } },
              ],
            },
            select: {
              id: true,
              title: true,
              value: true,
              stage: { select: { name: true, color: true } },
              customer: { select: { name: true } },
            },
            take: limitPerCategory,
            orderBy: { createdAt: 'desc' },
          })
        : Promise.resolve([]),

      // 4. Employees
      category === 'ALL' || category === 'EMPLOYEE'
        ? db.employee.findMany({
            where: {
              OR: [
                { name: { contains: q } },
                { employeeCode: { contains: q } },
                { companyEmail: { contains: q } },
                { designation: { title: { contains: q } } },
              ],
            },
            select: {
              id: true,
              name: true,
              employeeCode: true,
              companyEmail: true,
              designation: { select: { title: true } },
              department: { select: { name: true } },
              status: true,
            },
            take: limitPerCategory,
            orderBy: { createdAt: 'desc' },
          })
        : Promise.resolve([]),

      // 5. Invoices
      category === 'ALL' || category === 'INVOICE'
        ? db.invoice.findMany({
            where: {
              OR: [
                { invoiceNumber: { contains: q } },
                { clientName: { contains: q } },
                { clientEmail: { contains: q } },
              ],
            },
            select: { id: true, invoiceNumber: true, clientName: true, totalAmount: true, status: true },
            take: limitPerCategory,
            orderBy: { createdAt: 'desc' },
          })
        : Promise.resolve([]),

      // 6. Meetings
      category === 'ALL' || category === 'MEETING'
        ? db.meeting.findMany({
            where: {
              OR: [
                { title: { contains: q } },
                { description: { contains: q } },
                { location: { contains: q } },
              ],
            },
            select: {
              id: true,
              title: true,
              meetingType: true,
              status: true,
              startTime: true,
              conferenceLink: true,
              customer: { select: { name: true } },
            },
            take: limitPerCategory,
            orderBy: { startTime: 'desc' },
          })
        : Promise.resolve([]),

      // 7. Projects
      category === 'ALL' || category === 'PROJECT'
        ? db.projectRecord.findMany({
            where: {
              OR: [
                { name: { contains: q } },
                { code: { contains: q } },
              ],
            },
            select: { id: true, name: true, code: true, status: true, budget: true, customer: { select: { name: true } } },
            take: limitPerCategory,
            orderBy: { createdAt: 'desc' },
          })
        : Promise.resolve([]),
    ]);

    // Format results with distinct category badges and deep links
    const formattedLeads: SearchResultItem[] = leads.map((l) => ({
      id: l.id,
      category: 'LEAD',
      title: l.name,
      subtitle: `${l.email || l.phone || 'No Contact'} • ${l.company || 'Direct'}`,
      badge: l.status,
      badgeColor: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
      url: `/admin/leads`,
      createdAt: l.createdAt.toISOString(),
    }));

    const formattedCustomers: SearchResultItem[] = customers.map((c) => ({
      id: c.id,
      category: 'CUSTOMER',
      title: c.name,
      subtitle: `${c.email || c.phone || 'Customer'} • ₹${(c.lifetimeValue || 0).toLocaleString('en-IN')}`,
      badge: c.status,
      badgeColor: 'bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20',
      url: `/admin/customers/${c.id}`,
    }));

    const formattedDeals: SearchResultItem[] = deals.map((d) => ({
      id: d.id,
      category: 'DEAL',
      title: d.title,
      subtitle: `₹${d.value.toLocaleString('en-IN')} • ${d.customer?.name || 'Unassigned'}`,
      badge: d.stage?.name || 'Deal',
      badgeColor: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
      url: `/admin/deals`,
    }));

    const formattedEmployees: SearchResultItem[] = employees.map((e) => ({
      id: e.id,
      category: 'EMPLOYEE',
      title: e.name,
      subtitle: `${e.employeeCode || 'EMP'} • ${e.department?.name || e.designation?.title || 'Staff'}`,
      badge: e.status,
      badgeColor: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20',
      url: `/admin/hr/employees`,
    }));

    const formattedInvoices: SearchResultItem[] = invoices.map((inv) => ({
      id: inv.id,
      category: 'INVOICE',
      title: inv.invoiceNumber,
      subtitle: `${inv.clientName} • ₹${inv.totalAmount.toLocaleString('en-IN')}`,
      badge: inv.status,
      badgeColor: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
      url: `/admin/invoices`,
    }));

    const formattedMeetings: SearchResultItem[] = meetings.map((m) => ({
      id: m.id,
      category: 'MEETING',
      title: m.title,
      subtitle: `${new Date(m.startTime).toLocaleDateString('en-IN', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })} • ${m.meetingType.replace(/_/g, ' ')}`,
      badge: m.status,
      badgeColor: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
      url: `/admin/meetings`,
    }));

    const formattedProjects: SearchResultItem[] = projects.map((p) => ({
      id: p.id,
      category: 'PROJECT',
      title: p.name,
      subtitle: `${p.code} • ${p.customer?.name || 'Internal'}`,
      badge: p.status,
      badgeColor: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20',
      url: `/admin/projects`,
    }));

    const totalCount =
      formattedLeads.length +
      formattedCustomers.length +
      formattedDeals.length +
      formattedEmployees.length +
      formattedInvoices.length +
      formattedMeetings.length +
      formattedProjects.length;

    const responseTimeMs = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      query: q,
      totalCount,
      responseTimeMs,
      results: {
        leads: formattedLeads,
        customers: formattedCustomers,
        deals: formattedDeals,
        employees: formattedEmployees,
        invoices: formattedInvoices,
        meetings: formattedMeetings,
        projects: formattedProjects,
      },
    });
  } catch (error: any) {
    console.error('Omnibox search error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to execute omnibox search' },
      { status: 500 }
    );
  }
}
