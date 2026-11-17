import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth, hashPassword } from '@/lib/auth';
import { logActivity } from '@/lib/activity';

export async function GET(request: Request) {
  try {
    const session = await requireAuth();

    let user: any = null;
    let company: any = null;

    if (session.userType === 'Employee' && session.employeeId) {
      user = await db.employee.findUnique({
        where: { id: session.employeeId },
        select: { name: true, companyEmail: true, phone: true },
      });
      if (user) {
        user.email = user.companyEmail;
      }
    } else {
      user = await db.user.findUnique({
        where: { id: session.userId },
        select: { name: true, email: true, phone: true },
      });
    }

    if (session.isTenant && session.companyId) {
      company = await db.company.findUnique({
        where: { id: session.companyId },
        select: { name: true, website: true, phone: true, address: true, gstNumber: true },
      });
    }

    return NextResponse.json({ success: true, user, company });
  } catch (error) {
    console.error('Fetch profile error:', error);
    return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await requireAuth();
    const body = await request.json();
    const { user, company } = body;

    // Update User
    if (user) {
      const updateData: any = {};
      if (user.name) updateData.name = user.name;
      if (user.phone) updateData.phone = user.phone;
      if (user.newPassword) {
        updateData.passwordHash = await hashPassword(user.newPassword);
      }

      if (session.userType === 'Employee' && session.employeeId) {
        await db.employee.update({
          where: { id: session.employeeId },
          data: updateData,
        });
      } else {
        await db.user.update({
          where: { id: session.userId },
          data: updateData,
        });
      }
    }

    // Update Company (if tenant owner)
    if (session.isTenant && session.companyId && company) {
      const updateData: any = {};
      if (company.name) updateData.name = company.name;
      if (company.website !== undefined) updateData.website = company.website;
      if (company.phone !== undefined) updateData.phone = company.phone;
      if (company.address !== undefined) updateData.address = company.address;
      if (company.gstNumber !== undefined) updateData.gstNumber = company.gstNumber;

      await db.company.update({
        where: { id: session.companyId },
        data: updateData,
      });
    }

    await logActivity({
      userId: session.userId,
      userEmail: session.email,
      action: 'UPDATE_PROFILE',
      entityType: 'User',
      entityId: session.userId,
      details: 'User updated their profile/settings',
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Update profile error:', error);
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
  }
}
