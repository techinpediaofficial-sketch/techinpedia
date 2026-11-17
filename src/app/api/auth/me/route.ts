import { NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET() {
  const session = await getAuthSession();
  if (!session) {
    return NextResponse.json({ authenticated: false, user: null }, { status: 401 });
  }

  const user = await db.user.findUnique({
    where: { id: session.userId },
    select: { id: true, name: true, email: true, role: true, mustChangePassword: true },
  });

  if (!user) {
    return NextResponse.json({ authenticated: false, user: null }, { status: 401 });
  }

  return NextResponse.json({
    authenticated: true,
    user: {
      ...user,
      companyId: session.companyId,
      companyName: session.companyName,
      companyRole: session.companyRole,
      isTenant: session.isTenant,
      tenantStatus: session.tenantStatus,
      allowedModules: session.allowedModules,
      permissions: session.permissions,
    },
    session,
  });
}
