import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth, hashPassword } from '@/lib/auth';
import { logActivity } from '@/lib/activity';

interface Params {
  params: Promise<{ id: string }>;
}

// 1. GET: List All Company Employees / Sub-Accounts
export async function GET(request: Request, { params }: Params) {
  try {
    const session = await requireAuth();
    const { id } = await params;

    if (session.isTenant && session.companyId !== id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const employees = await db.user.findMany({
      where: { companyId: id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        companyRole: true,
        status: true,
        createdAt: true,
        appRole: {
          select: { id: true, name: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    return NextResponse.json({ success: true, employees });
  } catch (error: any) {
    console.error('Company employees GET error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch employees' }, { status: 500 });
  }
}

// 2. POST: Add Employee / Sub-Account with Granular Role Permissions
export async function POST(request: Request, { params }: Params) {
  try {
    const session = await requireAuth();
    const { id } = await params;

    const isSuperAdmin = session.role === 'SUPER_ADMIN';
    const isTenantAdmin = session.companyId === id && (session.companyRole === 'OWNER' || session.companyRole === 'ADMIN' || session.role === 'ADMIN');

    if (!isSuperAdmin && !isTenantAdmin) {
      return NextResponse.json({ error: 'Forbidden: Insufficient privileges to add team members.' }, { status: 403 });
    }

    const company = await db.company.findUnique({
      where: { id },
      include: {
        _count: { select: { users: true } },
      },
    });

    if (!company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    // Check plan limits
    if (company._count.users >= company.maxEmployees) {
      return NextResponse.json({
        error: `Plan limit reached: This company is permitted a maximum of ${company.maxEmployees} team accounts. Please upgrade plan to add more members.`,
      }, { status: 400 });
    }

    const body = await request.json();
    const {
      name,
      email,
      password,
      companyRole = 'INBOX_ONLY', // 'ADMIN', 'MANAGER', 'AGENT', 'INBOX_ONLY'
    } = body;

    if (!email || !password || !name) {
      return NextResponse.json({ error: 'Name, email, and password are required.' }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();
    const existingUser = await db.user.findUnique({
      where: { email: cleanEmail },
    });

    if (existingUser) {
      return NextResponse.json({ error: `A user with email "${cleanEmail}" is already registered.` }, { status: 400 });
    }

    const hashedPassword = await hashPassword(password);

    // Map companyRole to system Role enum (strictly SUPER_ADMIN | ADMIN | EDITOR in Prisma)
    const systemRole: 'ADMIN' | 'EDITOR' = companyRole === 'ADMIN' ? 'ADMIN' : 'EDITOR';

    const newEmployee = await db.user.create({
      data: {
        email: cleanEmail,
        password: hashedPassword,
        name: name.trim(),
        role: systemRole as any,
        companyId: id,
        companyRole,
        status: 'ACTIVE',
        mustChangePassword: false,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        companyRole: true,
        status: true,
        createdAt: true,
      },
    });

    await logActivity({
      userId: session.userId,
      userEmail: session.email,
      action: 'ADD_COMPANY_EMPLOYEE',
      entityType: 'User',
      entityId: newEmployee.id,
      metadata: { companyId: id, companyName: company.name, employeeEmail: cleanEmail, companyRole },
    });

    return NextResponse.json({
      success: true,
      message: `Employee "${name}" successfully registered for ${company.name}.`,
      employee: newEmployee,
    });
  } catch (error: any) {
    console.error('Company employee POST error:', error);
    return NextResponse.json({ error: error.message || 'Failed to add employee.' }, { status: 500 });
  }
}

// 3. DELETE: Remove or Deactivate Employee
export async function DELETE(request: Request, { params }: Params) {
  try {
    const session = await requireAuth();
    const { id } = await params;

    const isSuperAdmin = session.role === 'SUPER_ADMIN';
    const isTenantAdmin = session.companyId === id && (session.companyRole === 'OWNER' || session.role === 'ADMIN');

    if (!isSuperAdmin && !isTenantAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const user = await db.user.findFirst({
      where: { id: userId, companyId: id },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found in this company' }, { status: 404 });
    }

    if (user.companyRole === 'OWNER') {
      return NextResponse.json({ error: 'Cannot delete the Company Owner account.' }, { status: 400 });
    }

    await db.user.delete({
      where: { id: userId },
    });

    await logActivity({
      userId: session.userId,
      userEmail: session.email,
      action: 'REMOVE_COMPANY_EMPLOYEE',
      entityType: 'User',
      entityId: userId,
      metadata: { companyId: id, userEmail: user.email },
    });

    return NextResponse.json({ success: true, message: 'Employee removed successfully.' });
  } catch (error: any) {
    console.error('Company employee DELETE error:', error);
    return NextResponse.json({ error: error.message || 'Failed to remove employee' }, { status: 500 });
  }
}
