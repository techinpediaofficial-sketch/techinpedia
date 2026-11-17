import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth, hashPassword } from '@/lib/auth';
import { requirePermission } from '@/lib/permissions';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth();
    const { id } = await params;

    // An employee can view their own profile, or managers/admins can view with permission
    if (session.employeeId !== id) {
      requirePermission(session, 'hr.employees.view');
    }

    const employee = await db.employee.findUnique({
      where: { id },
      include: {
        department: true,
        team: true,
        designation: true,
        appRole: true,
        manager: {
          select: { id: true, name: true, employeeCode: true, companyEmail: true },
        },
        directReports: {
          select: { id: true, name: true, employeeCode: true, designation: { select: { title: true } } },
        },
        user: {
          select: { id: true, email: true, role: true, status: true, lastLoginAt: true } as any,
        },
        businessUnits: {
          select: {
            businessUnitId: true,
            businessUnit: { select: { id: true, code: true, name: true } },
          },
        },
        _count: {
          select: {
            attendance: true,
            leaveRequests: true,
            payrolls: true,
            directReports: true,
          },
        },
      },
    });

    if (!employee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, employee });
  } catch (error: any) {
    if (error.message?.startsWith('Forbidden') || error.message?.startsWith('Unauthorized')) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    console.error('Error fetching employee:', error);
    return NextResponse.json({ error: 'Failed to fetch employee' }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth();
    requirePermission(session, 'hr.employees.manage');

    const { id } = await params;
    const body = await req.json();

    const existing = await db.employee.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
    }

    const {
      name,
      companyEmail,
      personalEmail,
      phone,
      avatar,
      emergencyContactName,
      emergencyContactPhone,
      emergencyContactRelation,
      departmentId,
      teamId,
      designationId,
      designationTitle,
      appRoleId,
      managerId,
      joiningDate,
      employmentType,
      workLocation,
      status,
      probationMonths,
      confirmationDate,
      shift,
      basicSalary,
      hra,
      allowances,
      bankName,
      accountNumber,
      ifscCode,
      panNumber,
      aadhaarNumber,
      notes,
      linkUserId,
      businessUnitId,
      // User Credentials & Role
      password,
      createLoginUser,
      userStatus,
      mustChangePassword,
    } = body;

    // Resolve designation if designationTitle is provided
    let targetDesignationId = designationId !== undefined ? (designationId || null) : undefined;
    if (designationTitle && typeof designationTitle === 'string' && designationTitle.trim() && !designationId) {
      const cleanTitle = designationTitle.trim();
      let desig = await db.designation.findFirst({ where: { title: cleanTitle } });
      if (!desig) {
        desig = await db.designation.create({ data: { title: cleanTitle } });
      }
      targetDesignationId = desig.id;
    }

    const gross = (parseFloat(basicSalary ?? existing.basicSalary) || 0) +
                  (parseFloat(hra ?? existing.hra) || 0) +
                  (parseFloat(allowances ?? existing.allowances) || 0);

    const updated = await db.employee.update({
      where: { id },
      data: {
        name: name !== undefined ? (name && typeof name === 'string' ? name.trim() : existing.name) : undefined,
        companyEmail: companyEmail !== undefined ? (companyEmail && typeof companyEmail === 'string' ? companyEmail.trim().toLowerCase() : existing.companyEmail) : undefined,
        personalEmail: personalEmail !== undefined ? (personalEmail && typeof personalEmail === 'string' ? personalEmail.trim().toLowerCase() : null) : undefined,
        phone: phone !== undefined ? (phone && typeof phone === 'string' ? phone.trim() : null) : undefined,
        avatar: avatar !== undefined ? avatar : undefined,
        emergencyContactName: emergencyContactName !== undefined ? (emergencyContactName && typeof emergencyContactName === 'string' ? emergencyContactName.trim() : null) : undefined,
        emergencyContactPhone: emergencyContactPhone !== undefined ? (emergencyContactPhone && typeof emergencyContactPhone === 'string' ? emergencyContactPhone.trim() : null) : undefined,
        emergencyContactRelation: emergencyContactRelation !== undefined ? (emergencyContactRelation && typeof emergencyContactRelation === 'string' ? emergencyContactRelation.trim() : null) : undefined,
        departmentId: departmentId !== undefined ? departmentId || null : undefined,
        teamId: teamId !== undefined ? teamId || null : undefined,
        designationId: targetDesignationId !== undefined ? targetDesignationId : undefined,
        appRoleId: appRoleId !== undefined ? appRoleId || null : undefined,
        managerId: managerId !== undefined ? (managerId === id ? null : managerId || null) : undefined,
        joiningDate: joiningDate ? new Date(joiningDate) : undefined,
        employmentType: employmentType || undefined,
        workLocation: workLocation || undefined,
        status: status || undefined,
        probationMonths: probationMonths ? parseInt(probationMonths.toString()) : undefined,
        confirmationDate: confirmationDate ? new Date(confirmationDate) : undefined,
        shift: shift || undefined,
        basicSalary: basicSalary !== undefined ? parseFloat(basicSalary) || 0 : undefined,
        hra: hra !== undefined ? parseFloat(hra) || 0 : undefined,
        allowances: allowances !== undefined ? parseFloat(allowances) || 0 : undefined,
        grossSalary: gross,
        bankName: bankName !== undefined ? bankName : undefined,
        accountNumber: accountNumber !== undefined ? accountNumber : undefined,
        ifscCode: ifscCode !== undefined ? (ifscCode && typeof ifscCode === 'string' ? ifscCode.trim().toUpperCase() : null) : undefined,
        panNumber: panNumber !== undefined ? (panNumber && typeof panNumber === 'string' ? panNumber.trim().toUpperCase() : null) : undefined,
        aadhaarNumber: aadhaarNumber !== undefined ? aadhaarNumber : undefined,
        notes: notes !== undefined ? notes : undefined,
      },
      include: {
        department: true,
        team: true,
        designation: true,
        appRole: true,
        manager: true,
        user: {
          select: {
            id: true,
            email: true,
            role: true,
            status: true,
            appRoleId: true,
            mustChangePassword: true,
          },
        },
        businessUnits: {
          select: {
            businessUnitId: true,
            businessUnit: { select: { id: true, code: true, name: true } },
          },
        },
      },
    });

    // Update Business Unit mapping if provided
    if (businessUnitId !== undefined) {
      await db.employeeBusinessUnit.deleteMany({
        where: { employeeId: id },
      });
      if (businessUnitId) {
        await db.employeeBusinessUnit.create({
          data: {
            employeeId: id,
            businessUnitId,
          },
        }).catch((err) => console.error('Error linking Employee to BusinessUnit:', err));
      }
    }

    // Sync User Account & Credentials
    const linkedUser = await db.user.findFirst({ where: { employeeId: id } });

    if (linkedUser) {
      const userUpdateData: any = {};
      if (appRoleId !== undefined) {
        userUpdateData.appRoleId = appRoleId || null;
      }
      if (name && typeof name === 'string' && name.trim()) {
        userUpdateData.name = name.trim();
      }
      if (companyEmail && typeof companyEmail === 'string' && companyEmail.trim()) {
        userUpdateData.email = companyEmail.trim().toLowerCase();
      }
      if (userStatus) {
        userUpdateData.status = userStatus;
      }
      if (mustChangePassword !== undefined) {
        userUpdateData.mustChangePassword = !!mustChangePassword;
      }
      if (password && password.trim()) {
        userUpdateData.password = await hashPassword(password.trim());
      }

      if (Object.keys(userUpdateData).length > 0) {
        await db.user.update({
          where: { id: linkedUser.id },
          data: userUpdateData,
        });
      }
    } else if (createLoginUser || (password && password.trim())) {
      // Create new user account for this employee
      const passwordToHash = password?.trim() || 'TechInPedia@2026';
      const hashedPassword = await hashPassword(passwordToHash);

      await db.user.create({
        data: {
          name: updated.name,
          email: updated.companyEmail,
          password: hashedPassword,
          role: 'EDITOR',
          appRoleId: appRoleId || updated.appRoleId || null,
          employeeId: id,
          status: userStatus || 'ACTIVE',
          mustChangePassword: mustChangePassword !== undefined ? !!mustChangePassword : true,
        },
      });
    } else if (linkUserId) {
      await db.user.update({
        where: { id: linkUserId },
        data: {
          employeeId: id,
          appRoleId: appRoleId || undefined,
        },
      });
    }

    // Refetch employee with fresh user relation
    const finalEmployee = await db.employee.findUnique({
      where: { id },
      include: {
        department: true,
        team: true,
        designation: true,
        appRole: true,
        manager: true,
        user: {
          select: {
            id: true,
            email: true,
            role: true,
            status: true,
            appRoleId: true,
            mustChangePassword: true,
          },
        },
        businessUnits: {
          select: {
            businessUnitId: true,
            businessUnit: { select: { id: true, code: true, name: true } },
          },
        },
      },
    });

    await db.activityLog.create({
      data: {
        userId: session.userId,
        action: 'EMPLOYEE_UPDATED',
        entityType: 'Employee',
        entityId: id,
        metadata: JSON.stringify({
          employeeCode: updated.employeeCode,
          name: updated.name,
          appRoleId: appRoleId || updated.appRoleId,
          passwordChanged: !!(password && password.trim()),
        }),
      },
    });

    return NextResponse.json({ success: true, employee: finalEmployee });
  } catch (error: any) {
    if (error.message?.startsWith('Forbidden') || error.message?.startsWith('Unauthorized')) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    console.error('Error updating employee:', error);
    return NextResponse.json({ error: error.message || 'Failed to update employee' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth();
    requirePermission(session, 'hr.employees.manage');

    const { id } = await params;

    const employee = await db.employee.findUnique({
      where: { id },
      include: {
        _count: {
          select: { directReports: true, teamsLed: true, departmentsHeaded: true },
        },
      },
    });

    if (!employee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
    }

    if (employee._count.directReports > 0) {
      return NextResponse.json(
        { error: `Cannot delete employee who manages ${employee._count.directReports} direct reports. Reassign them first.` },
        { status: 400 }
      );
    }

    // Unlink user if linked
    await db.user.updateMany({
      where: { employeeId: id },
      data: { employeeId: null },
    });

    await db.employee.delete({
      where: { id },
    });

    await db.activityLog.create({
      data: {
        userId: session.userId,
        action: 'EMPLOYEE_DELETED',
        entityType: 'Employee',
        entityId: id,
        metadata: JSON.stringify({ employeeCode: employee.employeeCode, name: employee.name }),
      },
    });

    return NextResponse.json({ success: true, message: 'Employee deleted successfully' });
  } catch (error: any) {
    if (error.message?.startsWith('Forbidden') || error.message?.startsWith('Unauthorized')) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    console.error('Error deleting employee:', error);
    return NextResponse.json({ error: 'Failed to delete employee' }, { status: 500 });
  }
}
