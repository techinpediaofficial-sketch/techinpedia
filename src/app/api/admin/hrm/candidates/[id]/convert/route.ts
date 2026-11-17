import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAdminSession } from '@/lib/auth';
import { hasPermission } from '@/lib/permissions';

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await requireAdminSession();
    if (!hasPermission(session, 'hr.recruitment.manage') || !hasPermission(session, 'hr.employees.manage')) {
      return NextResponse.json({ error: 'Unauthorized to convert candidates to employees' }, { status: 403 });
    }

    const candidate = await prisma.candidate.findUnique({
      where: { id: params.id },
      include: {
        offers: {
          where: { status: 'ACCEPTED' },
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      }
    });

    if (!candidate) {
      return NextResponse.json({ error: 'Candidate not found' }, { status: 404 });
    }

    if (candidate.status === 'JOINED') {
      return NextResponse.json({ error: 'Candidate has already joined as an employee' }, { status: 400 });
    }

    const acceptedOffer = candidate.offers[0];
    if (!acceptedOffer) {
      return NextResponse.json({ error: 'No accepted offer found for this candidate. Candidate must accept an offer first.' }, { status: 400 });
    }

    const body = await request.json();

    // Auto-generate employee code
    const empCount = await prisma.employee.count();
    const employeeCode = body.employeeCode || `EMP${String(empCount + 1).padStart(4, '0')}`;

    // Transaction to safely convert
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create Employee Record
      const newEmployee = await tx.employee.create({
        data: {
          employeeCode,
          name: candidate.fullName,
          personalEmail: candidate.email,
          companyEmail: body.companyEmail || candidate.email, // Prefer formal company email
          phone: candidate.phone,
          departmentId: acceptedOffer.departmentId,
          designationId: acceptedOffer.designationId,
          managerId: acceptedOffer.managerId,
          joiningDate: acceptedOffer.proposedJoiningDate,
          employmentType: acceptedOffer.employmentType,
          workLocation: acceptedOffer.workLocation,
          status: 'ACTIVE',
          probationMonths: acceptedOffer.probationMonths,
          basicSalary: acceptedOffer.salary, // Base mapping
          grossSalary: acceptedOffer.salary, // Base mapping
        }
      });

      // 2. Update Candidate Status
      await tx.candidate.update({
        where: { id: candidate.id },
        data: { status: 'JOINED' }
      });

      // 3. Create Career Event Timeline
      await tx.employeeCareerEvent.create({
        data: {
          employeeId: newEmployee.id,
          type: 'JOINING',
          title: 'Joined Company',
          description: `Joined as ${acceptedOffer.employmentType} from recruitment pipeline (Candidate ID: ${candidate.candidateId})`,
          date: newEmployee.joiningDate
        }
      });

      // 4. Log Activity
      await tx.activityLog.create({
        data: {
          action: 'EMPLOYEE_JOINED',
          userId: session.id,
          entityType: 'EMPLOYEE',
          entityId: newEmployee.id,
          details: `Converted candidate ${candidate.fullName} to employee ${employeeCode}`,
        }
      });

      return newEmployee;
    });

    return NextResponse.json({ 
      message: 'Successfully converted candidate to employee',
      employee: result 
    }, { status: 201 });

  } catch (error) {
    console.error('Error converting candidate:', error);
    return NextResponse.json({ error: 'Failed to convert candidate' }, { status: 500 });
  }
}
