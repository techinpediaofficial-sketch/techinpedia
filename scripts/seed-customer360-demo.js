const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seedCustomer360Demo() {
  console.log('Seeding enterprise Customer 360 demo record...');

  // 1. Company
  let company = await prisma.company.findFirst({ where: { name: 'InfraCorp Cloud Technologies' } });
  if (!company) {
    company = await prisma.company.create({
      data: {
        name: 'InfraCorp Cloud Technologies',
        email: 'accounts@infracorp.example',
        phone: '+91 98200 12345',
        website: 'https://infracorp.example',
      },
    });
  }

  // 2. Customer
  let customer = await prisma.customer.findFirst({ where: { email: 'arun.mehra@infracorp.example' } });
  if (!customer) {
    customer = await prisma.customer.create({
      data: {
        name: 'Arun Mehra',
        email: 'arun.mehra@infracorp.example',
        phone: '+91 98200 12345',
        companyId: company.id,
        status: 'ACTIVE',
        notes: 'Key Enterprise Account. Prefers quarterly hardware review calls and dedicated technician SLA.',
      },
    });
  }

  // 3. Contact
  let contact = await prisma.contact.findFirst({ where: { email: 'arun.mehra@infracorp.example' } });
  if (!contact) {
    contact = await prisma.contact.create({
      data: {
        name: 'Arun Mehra',
        firstName: 'Arun',
        lastName: 'Mehra',
        email: 'arun.mehra@infracorp.example',
        phone: '+91 98200 12345',
        jobTitle: 'Chief Technology Officer',
        companyId: company.id,
      },
    });
  }

  // 4. Pipeline & Stages
  let pipeline = await prisma.pipeline.findFirst({
    include: { stages: { orderBy: { order: 'asc' } } },
  });

  if (pipeline && pipeline.stages.length > 0) {
    const stage = pipeline.stages[pipeline.stages.length - 1]; // Won or advanced stage

    // 5. Deal
    let deal = await prisma.deal.findFirst({ where: { customerId: customer.id } });
    if (!deal) {
      deal = await prisma.deal.create({
        data: {
          title: 'InfraCorp - 30 Developer Laptops Lease & AMC Contract',
          value: 450000,
          probability: stage.probability,
          pipelineId: pipeline.id,
          stageId: stage.id,
          customerId: customer.id,
          companyId: company.id,
          notes: 'High-spec configurations for AI engineers. 3-year refresh cycle.',
        },
      });

      // Deal Line Items
      await prisma.dealItem.createMany({
        data: [
          {
            dealId: deal.id,
            serviceName: 'Dell Latitude 7440 Core i7 / 32GB RAM (Rental)',
            quantity: 20,
            unitPrice: 15000,
            totalPrice: 300000,
          },
          {
            dealId: deal.id,
            serviceName: 'MacBook Pro 16" M3 Max (Rental)',
            quantity: 10,
            unitPrice: 15000,
            totalPrice: 150000,
          },
        ],
      });

      // Deal Stage History
      await prisma.dealStageHistory.create({
        data: {
          dealId: deal.id,
          toStageId: stage.id,
          durationHours: 48,
          notes: 'Contract signed and advance payment received.',
        },
      });
    }

    // 6. Project
    let project = await prisma.projectRecord.findFirst({ where: { customerId: customer.id } });
    if (!project) {
      project = await prisma.projectRecord.create({
        data: {
          code: 'PRJ-INFRACORP-01',
          name: 'InfraCorp Fleet Provisioning & MDM Enrollment',
          description: 'Deploy 30 corporate machines with zero-touch MDM and VPN configuration',
          budget: 450000,
          status: 'ACTIVE',
          progress: 65,
          customerId: customer.id,
        },
      });

      await prisma.task.createMany({
        data: [
          {
            projectId: project.id,
            title: 'Procure & Configure Dell Latitude Fleet',
            status: 'DONE',
            priority: 'HIGH',
          },
          {
            projectId: project.id,
            title: 'MDM & Enterprise Security Setup',
            status: 'IN_PROGRESS',
            priority: 'URGENT',
          },
        ],
      });
    }

    // 7. Follow-up Task
    let followUp = await prisma.followUp.findFirst({ where: { customerId: customer.id } });
    if (!followUp) {
      await prisma.followUp.create({
        data: {
          title: 'Q4 Hardware Delivery Status & Setup Confirmation',
          type: 'MEETING',
          status: 'PENDING',
          scheduledAt: new Date(Date.now() + 48 * 60 * 60 * 1000),
          customerId: customer.id,
          dealId: deal.id,
          notes: 'Confirm all 30 laptops received at Bangalore campus and verify employee logins.',
        },
      });
    }

    // 8. Lead Timeline Event
    await prisma.leadTimelineEvent.create({
      data: {
        customerId: customer.id,
        dealId: deal.id,
        type: 'DEAL_WON',
        title: 'Enterprise Contract Awarded',
        description: 'InfraCorp signed 30-laptop provisioning contract worth ₹4,50,000.',
      },
    });

    // 9. Invoice & Payment
    let inv = await prisma.invoice.findFirst({ where: { customerId: customer.id } });
    if (!inv) {
      inv = await prisma.invoice.create({
        data: {
          invoiceNumber: 'INV-2026-0089',
          clientName: customer.name,
          clientEmail: customer.email,
          customer: { connect: { id: customer.id } },
          issueDate: new Date(),
          dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
          subtotal: 450000,
          taxAmount: 81000,
          totalAmount: 531000,
          status: 'PARTIALLY_PAID',
        },
      });

      await prisma.payment.create({
        data: {
          invoice: { connect: { id: inv.id } },
          customer: { connect: { id: customer.id } },
          amount: 250000,
          paymentDate: new Date(),
          paymentMethod: 'NEFT_BANK_TRANSFER',
          referenceNumber: 'UTR-HDFC-99882211',
          status: 'COMPLETED',
        },
      });
    }
  }

  console.log(`✅ Demo Customer 360 seeded: ${customer.name} (ID: ${customer.id})`);
  await prisma.$disconnect();
}

seedCustomer360Demo();
