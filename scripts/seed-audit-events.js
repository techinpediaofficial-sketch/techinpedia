const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seedAuditEvents() {
  console.log('Seeding rich audit events with field diffs...');

  const admin = await prisma.user.findFirst({ where: { email: 'admin@techinpedia.com' } });

  const events = [
    {
      action: 'STAGE_CHANGED',
      entityType: 'DEAL',
      entityId: 'deal-corp-cloud-99',
      metadata: JSON.stringify({
        details: 'Enterprise Cloud Migration deal advanced after technical review with CTO.',
        ip: '49.36.120.45',
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Chrome/124.0.0.0 Safari/537.36',
        diffs: [
          { field: 'stage', before: 'Discovery & Qualification', after: 'Proposal & Scope Review' },
          { field: 'value', before: 150000, after: 220000 },
          { field: 'probability', before: 25, after: 65 },
          { field: 'expectedCloseDate', before: '2026-09-28', after: '2026-10-15' },
        ],
        beforeSnapshot: {
          title: 'Cloud Infrastructure Migration & Multi-region Setup',
          stage: 'Discovery & Qualification',
          value: 150000,
          probability: 25,
          contact: 'Rajiv Sharma (VP Tech)',
          notes: 'Customer inquiring about high-availability AWS architecture',
        },
        afterSnapshot: {
          title: 'Cloud Infrastructure Migration & Multi-region Setup',
          stage: 'Proposal & Scope Review',
          value: 220000,
          probability: 65,
          contact: 'Rajiv Sharma (VP Tech)',
          notes: 'Presented 3-tier Terraform deployment with DR failover. Awaiting procurement sign-off.',
        },
      }),
    },
    {
      action: 'UPDATED',
      entityType: 'EMPLOYEE',
      entityId: 'emp-crm-01',
      metadata: JSON.stringify({
        details: 'Annual compensation revision & designation progression approved by HR Directorate.',
        ip: '106.51.78.22',
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Chrome/124.0.0.0 Safari/537.36',
        diffs: [
          { field: 'designation', before: 'Fullstack Engineer', after: 'Lead Solutions Architect' },
          { field: 'basicSalary', before: 65000, after: 82000 },
          { field: 'hra', before: 26000, after: 32800 },
          { field: 'grossSalary', before: 91000, after: 114800 },
        ],
        beforeSnapshot: {
          code: 'EMP-CRM-01',
          name: 'Vikram Mehta',
          designation: 'Fullstack Engineer',
          department: 'Engineering & Delivery',
          grossSalary: 91000,
        },
        afterSnapshot: {
          code: 'EMP-CRM-01',
          name: 'Vikram Mehta',
          designation: 'Lead Solutions Architect',
          department: 'Engineering & Delivery',
          grossSalary: 114800,
        },
      }),
    },
    {
      action: 'RESCHEDULED',
      entityType: 'MEETING',
      entityId: 'meet-q3-board',
      metadata: JSON.stringify({
        details: 'Client requested postponement to accommodate overseas executive attendees.',
        ip: '49.36.120.45',
        diffs: [
          { field: 'startTime', before: '2026-09-18T10:00:00.000Z', after: '2026-09-19T14:30:00.000Z' },
          { field: 'endTime', before: '2026-09-18T11:00:00.000Z', after: '2026-09-19T15:30:00.000Z' },
          { field: 'conferenceLink', before: 'https://meet.google.com/tip-old-abc', after: 'https://meet.google.com/tip-wmr-hp9' },
        ],
        beforeSnapshot: {
          title: 'Q3 Enterprise Architecture Roadmap Discussion',
          startTime: '2026-09-18T10:00:00.000Z',
          conferenceLink: 'https://meet.google.com/tip-old-abc',
        },
        afterSnapshot: {
          title: 'Q3 Enterprise Architecture Roadmap Discussion',
          startTime: '2026-09-19T14:30:00.000Z',
          conferenceLink: 'https://meet.google.com/tip-wmr-hp9',
        },
      }),
    },
  ];

  for (const evt of events) {
    await prisma.activityLog.create({
      data: {
        userId: admin?.id || null,
        userEmail: admin?.email || 'admin@techinpedia.com',
        action: evt.action,
        entityType: evt.entityType,
        entityId: evt.entityId,
        metadata: evt.metadata,
      },
    });
  }

  console.log(`✅ Successfully seeded ${events.length} rich audit events!`);
}

seedAuditEvents()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
  });
