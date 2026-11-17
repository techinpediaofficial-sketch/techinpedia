import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth, hashPassword } from '@/lib/auth';
import { logActivity } from '@/lib/activity';

// 1. GET: List Company Employees
export async function GET() {
  try {
    const session = await requireAuth();

    const companyId = session.companyId;
    if (!companyId) {
      return NextResponse.json({ error: 'No company associated with this account' }, { status: 400 });
    }

    const company = await db.company.findUnique({
      where: { id: companyId },
      select: { id: true, name: true, maxEmployees: true, planName: true },
    });

    if (!company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    const employees = await db.user.findMany({
      where: { companyId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        companyRole: true,
        status: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    return NextResponse.json({
      success: true,
      company: {
        id: company.id,
        name: company.name,
        maxEmployees: company.maxEmployees,
        planName: company.planName,
        usedSeats: employees.length,
      },
      employees,
    });
  } catch (error: any) {
    console.error('Company employees GET error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch employees' }, { status: 500 });
  }
}

// 2. POST: Add Employee / Sub-account to Company
export async function POST(request: Request) {
  try {
    const session = await requireAuth();

    const companyId = session.companyId;
    if (!companyId) {
      return NextResponse.json({ error: 'No company associated with this account' }, { status: 400 });
    }

    const isCompanyAdmin =
      session.role === 'SUPER_ADMIN' ||
      session.companyRole === 'OWNER' ||
      session.companyRole === 'ADMIN' ||
      session.role === 'ADMIN';

    if (!isCompanyAdmin) {
      return NextResponse.json(
        { error: 'Forbidden: Only Company Administrators or Owners can add team members.' },
        { status: 403 }
      );
    }

    const company = await db.company.findUnique({
      where: { id: companyId },
      include: {
        _count: { select: { users: true } },
      },
    });

    if (!company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    if (company._count.users >= company.maxEmployees) {
      return NextResponse.json(
        {
          error: `Seat limit reached: Your current plan allows maximum ${company.maxEmployees} team members. Please upgrade plan to add more seats.`,
        },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { name, email, password, companyRole = 'INBOX_ONLY' } = body;

    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Name, email, and password are required.' }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();
    const existing = await db.user.findUnique({
      where: { email: cleanEmail },
    });

    if (existing) {
      return NextResponse.json({ error: `A user with email "${cleanEmail}" is already registered.` }, { status: 400 });
    }

    const hashedPassword = await hashPassword(password);

    // Map companyRole to system role (strictly SUPER_ADMIN | ADMIN | EDITOR in Prisma)
    const systemRole: 'ADMIN' | 'EDITOR' = companyRole === 'ADMIN' ? 'ADMIN' : 'EDITOR';

    const newEmployee = await db.user.create({
      data: {
        email: cleanEmail,
        password: hashedPassword,
        name: name.trim(),
        role: systemRole as any,
        companyId,
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
      metadata: { companyId, employeeEmail: cleanEmail, companyRole },
    });

    return NextResponse.json({
      success: true,
      message: `Employee "${name.trim()}" added successfully.`,
      employee: newEmployee,
    });
  } catch (error: any) {
    console.error('Company employee POST error:', error);
    return NextResponse.json({ error: error.message || 'Failed to add employee' }, { status: 500 });
  }
}

// 3. PATCH: Update Employee Role or Status
export async function PATCH(request: Request) {
  try {
    const session = await requireAuth();

    const companyId = session.companyId;
    if (!companyId) {
      return NextResponse.json({ error: 'No company associated with this account' }, { status: 400 });
    }

    const isCompanyAdmin =
      session.role === 'SUPER_ADMIN' ||
      session.companyRole === 'OWNER' ||
      session.companyRole === 'ADMIN' ||
      session.role === 'ADMIN';

    if (!isCompanyAdmin) {
      return NextResponse.json(
        { error: 'Forbidden: Only Company Administrators or Owners can update team members.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { userId, companyRole, status } = body;

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const targetUser = await db.user.findFirst({
      where: { id: userId, companyId },
    });

    if (!targetUser) {
      return NextResponse.json({ error: 'Employee not found in your company' }, { status: 404 });
    }

    if (targetUser.companyRole === 'OWNER' && companyRole && companyRole !== 'OWNER') {
      return NextResponse.json({ error: 'Cannot demote the primary Company Owner account.' }, { status: 400 });
    }

    const updateData: any = {};
    if (companyRole) {
      updateData.companyRole = companyRole;
      updateData.role = companyRole === 'ADMIN' ? 'ADMIN' : 'EDITOR';
    }

    if (status) {
      updateData.status = status;
    }

    const updated = await db.user.update({
      where: { id: userId },
      data: updateData,
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
      action: 'UPDATE_COMPANY_EMPLOYEE',
      entityType: 'User',
      entityId: userId,
      metadata: { companyId, updatedFields: updateData },
    });

    return NextResponse.json({
      success: true,
      message: 'Employee updated successfully.',
      employee: updated,
    });
  } catch (error: any) {
    console.error('Company employee PATCH error:', error);
    return NextResponse.json({ error: error.message || 'Failed to update employee' }, { status: 500 });
  }
}

// 4. DELETE: Remove Employee
export async function DELETE(request: Request) {
  try {
    const session = await requireAuth();

    const companyId = session.companyId;
    if (!companyId) {
      return NextResponse.json({ error: 'No company associated with this account' }, { status: 400 });
    }

    const isCompanyAdmin =
      session.role === 'SUPER_ADMIN' ||
      session.companyRole === 'OWNER' ||
      session.companyRole === 'ADMIN' ||
      session.role === 'ADMIN';

    if (!isCompanyAdmin) {
      return NextResponse.json(
        { error: 'Forbidden: Only Company Administrators or Owners can remove team members.' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const targetUser = await db.user.findFirst({
      where: { id: userId, companyId },
    });

    if (!targetUser) {
      return NextResponse.json({ error: 'Employee not found in your company' }, { status: 404 });
    }

    if (targetUser.companyRole === 'OWNER') {
      return NextResponse.json({ error: 'Cannot remove the primary Company Owner account.' }, { status: 400 });
    }

    if (targetUser.id === session.userId) {
      return NextResponse.json({ error: 'You cannot remove your own active account.' }, { status: 400 });
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
      metadata: { companyId, employeeEmail: targetUser.email },
    });

    return NextResponse.json({
      success: true,
      message: `Employee "${targetUser.name}" removed successfully.`,
    });
  } catch (error: any) {
    console.error('Company employee DELETE error:', error);
    return NextResponse.json({ error: error.message || 'Failed to remove employee' }, { status: 500 });
  }
}
