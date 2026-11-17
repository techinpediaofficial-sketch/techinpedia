import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth, requireRole, hashPassword } from '@/lib/auth';
import { logActivity } from '@/lib/activity';
import { Role, UserStatus } from '@prisma/client';

export async function GET(request: Request) {
  try {
    const session = await requireAuth();
    const { searchParams } = new URL(request.url);
    const queryCompanyId = searchParams.get('companyId');

    let userFilter: any = {};

    // 1. Tenant User Context (Session belongs to a tenant company)
    if (session.isTenant || session.companyId) {
      // Strictly scoped to their own company
      userFilter = {
        companyId: session.companyId,
        status: { not: UserStatus.INACTIVE },
      };
    }
    // 2. Platform Super Admin Context
    else if (session.role === Role.SUPER_ADMIN) {
      if (queryCompanyId && queryCompanyId !== 'master' && queryCompanyId !== 'ALL') {
        userFilter = {
          companyId: queryCompanyId,
          status: { not: UserStatus.INACTIVE },
        };
      } else if (queryCompanyId === 'master') {
        userFilter = {
          companyId: null,
          status: { not: UserStatus.INACTIVE },
        };
      } else {
        // Platform Super Admin without query companyId -> return all users
        userFilter = {};
      }
    }
    // 3. Platform Admin with business units
    else if (session.role === Role.ADMIN) {
      if (queryCompanyId && queryCompanyId !== 'master' && queryCompanyId !== 'ALL') {
        userFilter = {
          companyId: queryCompanyId,
          status: { not: UserStatus.INACTIVE },
        };
      } else if (session.businessUnitIds && session.businessUnitIds.length > 0) {
        userFilter = {
          employee: {
            businessUnits: { some: { businessUnitId: { in: session.businessUnitIds } } },
          },
        };
      } else {
        userFilter = {};
      }
    }
    // 4. Other Roles (e.g. non-tenant Editor)
    else {
      userFilter = {
        id: session.userId,
      };
    }

    const users = await db.user.findMany({
      where: userFilter,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        companyRole: true,
        companyId: true,
        status: true,
        mustChangePassword: true,
        createdAt: true,
        updatedAt: true,
        appRole: { select: { displayName: true } },
      },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({ users });
  } catch (error: any) {
    console.error('Fetch users error:', error);
    return NextResponse.json({ error: error.message || 'Forbidden' }, { status: 403 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireRole([Role.SUPER_ADMIN]);
    const body = await request.json();
    const { name, email, password, role, status } = body;

    if (!name || !email || !password || password.length < 8) {
      return NextResponse.json({ error: 'Name, email, and password (min 8 characters) are required.' }, { status: 400 });
    }

    const existing = await db.user.findUnique({ where: { email: email.toLowerCase().trim() } });
    if (existing) {
      return NextResponse.json({ error: 'User with this email already exists.' }, { status: 400 });
    }

    const hashedPassword = await hashPassword(password);

    const newUser = await db.user.create({
      data: {
        name: name.trim(),
        email: email.toLowerCase().trim(),
        password: hashedPassword,
        role: role && Object.values(Role).includes(role) ? role : Role.ADMIN,
        status: status && Object.values(UserStatus).includes(status) ? status : UserStatus.ACTIVE,
        mustChangePassword: true,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        mustChangePassword: true,
        createdAt: true,
      },
    });

    await logActivity({
      userId: session.userId,
      userEmail: session.email,
      action: 'CREATE_USER',
      entityType: 'User',
      entityId: newUser.id,
      metadata: { role: newUser.role },
    });

    return NextResponse.json({ success: true, user: newUser });
  } catch (error) {
    console.error('Create user error:', error);
    return NextResponse.json({ error: 'Failed to create user.' }, { status: 500 });
  }
}
