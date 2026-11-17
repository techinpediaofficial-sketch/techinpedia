import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth, hashPassword } from '@/lib/auth';
import { requirePermission } from '@/lib/permissions';
import { getEmployeeFilter } from '@/lib/rbac/dataScoping';

export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth();
    requirePermission(session, 'hr.employees.view');

    const { searchParams } = new URL(request.url);
    const departmentId = searchParams.get('departmentId');
    const teamId = searchParams.get('teamId');
    const status = searchParams.get('status');
    const businessUnitId = searchParams.get('businessUnitId');
    const search = searchParams.get('search') || '';

    // Base scoping filter for the staff member
    const scopeFilter = getEmployeeFilter(session);

    const where: any = {
      ...scopeFilter,
    };

    if (departmentId) where.departmentId = departmentId;
    if (teamId) where.teamId = teamId;
    if (status) where.status = status;
    if (businessUnitId) {
      where.businessUnits = {
        some: { businessUnitId },
      };
    }
    if (search.trim()) {
      where.AND = [
        ...(where.AND || []),
        {
          OR: [
            { name: { contains: search } },
            { companyEmail: { contains: search } },
            { employeeCode: { contains: search } },
            { phone: { contains: search } },
          ],
        },
      ];
    }

    const employees = await db.employee.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        department: { select: { id: true, name: true, code: true } },
        team: { select: { id: true, name: true, code: true } },
        designation: { select: { id: true, title: true } },
        appRole: { select: { id: true, name: true, displayName: true } },
        manager: { select: { id: true, name: true, employeeCode: true } },
        user: { select: { id: true, email: true, role: true, status: true, appRoleId: true, mustChangePassword: true } },
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

    return NextResponse.json({ success: true, employees });
  } catch (error: any) {
    if (error.message?.startsWith('Forbidden') || error.message?.startsWith('Unauthorized')) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    console.error('Fetch employees error:', error);
    return NextResponse.json({ error: 'Failed to fetch employees.' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth();
    requirePermission(session, 'hr.employees.manage');

    const body = await request.json();
    const {
      name,
      companyEmail,
      personalEmail,
      phone,
      avatar,
      // Emergency Contact
      emergencyContactName,
      emergencyContactPhone,
      emergencyContactRelation,
      // Organization Hierarchy
      departmentId,
      teamId,
      designationId,
      appRoleId,
      managerId,
      // Employment Details
      joiningDate,
      employmentType = 'FULL_TIME',
      workLocation = 'HYBRID',
      status = 'ACTIVE',
      probationMonths = 3,
      shift = 'REGULAR_DAY',
      // Compensation & Bank
      basicSalary = 0,
      hra = 0,
      allowances = 0,
      bankName,
      accountNumber,
      ifscCode,
      panNumber,
      aadhaarNumber,
      notes,
      // User Account Provisioning
      createLoginUser = false,
      loginPassword,
      linkExistingUserId,
      businessUnitId,
    } = body;

    if (!name?.trim() || !companyEmail?.trim()) {
      return NextResponse.json(
        { error: 'Employee name and official company email are required.' },
        { status: 400 }
      );
    }

    const normalizedEmail = companyEmail.trim().toLowerCase();

    // Check duplicate employee email
    const existingEmployee = await db.employee.findUnique({
      where: { companyEmail: normalizedEmail },
    });
    if (existingEmployee) {
      return NextResponse.json(
        { error: `An employee with company email "${normalizedEmail}" already exists.` },
        { status: 400 }
      );
    }

    // Auto-generate employee code if not provided
    const totalCount = await db.employee.count();
    const employeeCode = `TIP-EMP-${(totalCount + 1).toString().padStart(3, '0')}`;

    // Calculate probation end date
    const joinDateObj = joiningDate ? new Date(joiningDate) : new Date();
    const probationEnd = new Date(joinDateObj);
    probationEnd.setMonth(probationEnd.getMonth() + parseInt(probationMonths.toString() || '3'));

    const gross = (parseFloat(basicSalary) || 0) + (parseFloat(hra) || 0) + (parseFloat(allowances) || 0);

    // Create Employee record
    const employee = await db.employee.create({
      data: {
        employeeCode,
        name: name.trim(),
        companyEmail: normalizedEmail,
        personalEmail: personalEmail ? personalEmail.trim().toLowerCase() : null,
        phone: phone ? phone.trim() : null,
        avatar: avatar || null,
        emergencyContactName: emergencyContactName?.trim() || null,
        emergencyContactPhone: emergencyContactPhone?.trim() || null,
        emergencyContactRelation: emergencyContactRelation?.trim() || null,
        departmentId: departmentId || null,
        teamId: teamId || null,
        designationId: designationId || null,
        appRoleId: appRoleId || null,
        managerId: managerId || null,
        joiningDate: joinDateObj,
        employmentType,
        workLocation,
        status,
        probationMonths: parseInt(probationMonths.toString() || '3'),
        probationEndDate: probationEnd,
        shift,
        basicSalary: parseFloat(basicSalary) || 0,
        hra: parseFloat(hra) || 0,
        allowances: parseFloat(allowances) || 0,
        grossSalary: gross,
        bankName: bankName?.trim() || null,
        accountNumber: accountNumber?.trim() || null,
        ifscCode: ifscCode?.trim() ? ifscCode.trim().toUpperCase() : null,
        panNumber: panNumber?.trim() ? panNumber.trim().toUpperCase() : null,
        aadhaarNumber: aadhaarNumber?.trim() || null,
        notes: notes?.trim() || null,
      },
      include: {
        department: true,
        team: true,
        designation: true,
        appRole: true,
        manager: true,
      },
    });

    // Optionally create or link User account for authentication
    let createdUser = null;
    if (createLoginUser) {
      const existingUser = await db.user.findUnique({
        where: { email: normalizedEmail },
      });

      if (existingUser) {
        // Link existing user to this employee
        createdUser = await db.user.update({
          where: { id: existingUser.id },
          data: {
            employeeId: employee.id,
            appRoleId: appRoleId || existingUser.appRoleId,
          },
        });
      } else {
        const passwordToHash = loginPassword || 'TechInPedia@2026';
        const hashedPassword = await hashPassword(passwordToHash);

        createdUser = await db.user.create({
          data: {
            name: employee.name,
            email: normalizedEmail,
            password: hashedPassword,
            role: 'EDITOR', // default legacy role
            appRoleId: appRoleId || null,
            employeeId: employee.id,
            mustChangePassword: true,
            status: 'ACTIVE',
          },
        });
      }
    } else if (linkExistingUserId) {
      createdUser = await db.user.update({
        where: { id: linkExistingUserId },
        data: {
          employeeId: employee.id,
          appRoleId: appRoleId || undefined,
        },
      });
    }

    // Link Business Unit if specified
    if (businessUnitId) {
      await db.employeeBusinessUnit.create({
        data: {
          employeeId: employee.id,
          businessUnitId,
        },
      }).catch((err) => console.error('Error linking Employee to BusinessUnit:', err));
    }

    // Log Activity
    await db.activityLog.create({
      data: {
        userId: session.userId,
        action: 'EMPLOYEE_ONBOARDED',
        entityType: 'Employee',
        entityId: employee.id,
        metadata: JSON.stringify({
          employeeCode,
          name: employee.name,
          companyEmail,
          departmentId,
          teamId,
          hasLinkedUser: !!createdUser,
        }),
      },
    });

    return NextResponse.json(
      {
        success: true,
        employee: {
          ...employee,
          user: createdUser
            ? { id: createdUser.id, email: createdUser.email, role: createdUser.role }
            : null,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    if (error.message?.startsWith('Forbidden') || error.message?.startsWith('Unauthorized')) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    console.error('Employee onboarding error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to onboard employee.' },
      { status: 500 }
    );
  }
}
