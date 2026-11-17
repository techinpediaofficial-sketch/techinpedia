const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seedBusinessOS() {
  console.log('🚀 Seeding Business OS defaults...');

  // 1. Seed Permissions
  const permissions = [
    { code: 'crm.leads.view', name: 'View Leads', category: 'CRM', description: 'Can view lead records and inquiries' },
    { code: 'crm.leads.create', name: 'Create Leads', category: 'CRM', description: 'Can add new leads manually or via import' },
    { code: 'crm.leads.edit', name: 'Edit Leads', category: 'CRM', description: 'Can update lead status, details and fields' },
    { code: 'crm.leads.delete', name: 'Delete Leads', category: 'CRM', description: 'Can archive or remove lead records' },
    { code: 'crm.leads.assign', name: 'Assign Leads', category: 'CRM', description: 'Can assign leads to sales executives' },
    { code: 'crm.contacts.manage', name: 'Manage Contacts', category: 'CRM', description: 'Can manage individual contact profiles' },
    { code: 'crm.companies.manage', name: 'Manage Companies', category: 'CRM', description: 'Can manage company accounts and corporate records' },
    { code: 'crm.deals.manage', name: 'Manage Deals', category: 'CRM', description: 'Can operate sales pipeline and deal stages' },
    { code: 'crm.followups.manage', name: 'Manage Follow-ups', category: 'CRM', description: 'Can schedule and record follow-ups' },
    { code: 'comm.whatsapp.view', name: 'View WhatsApp', category: 'Communication', description: 'Can view WhatsApp chat threads' },
    { code: 'comm.whatsapp.send', name: 'Send WhatsApp', category: 'Communication', description: 'Can send WhatsApp messages and templates' },
    { code: 'comm.inbox.manage', name: 'Unified Inbox', category: 'Communication', description: 'Can access unified communication desk' },
    { code: 'comm.chat.manage', name: 'Live Chat', category: 'Communication', description: 'Can respond to live website visitor chats' },
    { code: 'sales.quotations.manage', name: 'Quotations', category: 'Sales & Finance', description: 'Can create and send quotations' },
    { code: 'sales.proposals.manage', name: 'Proposals', category: 'Sales & Finance', description: 'Can build and send client proposals' },
    { code: 'sales.contracts.manage', name: 'Contracts', category: 'Sales & Finance', description: 'Can manage legal client contracts and renewals' },
    { code: 'finance.invoices.manage', name: 'Invoices', category: 'Sales & Finance', description: 'Can generate and manage billing invoices' },
    { code: 'finance.payments.record', name: 'Payments', category: 'Sales & Finance', description: 'Can record and verify payment transactions' },
    { code: 'finance.expenses.manage', name: 'Expenses', category: 'Sales & Finance', description: 'Can log and approve company expenses' },
    { code: 'projects.view', name: 'View Projects', category: 'Projects', description: 'Can view internal client projects' },
    { code: 'projects.manage', name: 'Manage Projects', category: 'Projects', description: 'Can create and configure projects & milestones' },
    { code: 'projects.tasks.manage', name: 'Manage Tasks', category: 'Projects', description: 'Can assign and update project tasks' },
    { code: 'projects.timesheets.manage', name: 'Timesheets', category: 'Projects', description: 'Can log and review project timesheets' },
    { code: 'hr.employees.view', name: 'View Employees', category: 'HRM', description: 'Can view employee directory' },
    { code: 'hr.employees.manage', name: 'Manage Employees', category: 'HRM', description: 'Can add/edit employees, departments, and roles' },
    { code: 'hr.attendance.manage', name: 'Attendance', category: 'HRM', description: 'Can review and adjust attendance logs' },
    { code: 'hr.leaves.manage', name: 'Leave Management', category: 'HRM', description: 'Can approve or reject leave requests' },
    { code: 'hr.payroll.view', name: 'View Payroll', category: 'HRM', description: 'Can view salary structures and payslips' },
    { code: 'hr.payroll.manage', name: 'Manage Payroll', category: 'HRM', description: 'Can generate payroll and update compensations' },
    { code: 'support.tickets.view', name: 'View Tickets', category: 'Support', description: 'Can view support tickets' },
    { code: 'support.tickets.manage', name: 'Manage Tickets', category: 'Support', description: 'Can respond to and resolve support tickets' },
    { code: 'support.kb.manage', name: 'Knowledge Base', category: 'Support', description: 'Can author articles and documentation' },
    { code: 'hardware.assets.manage', name: 'Asset Inventory', category: 'Hardware & Rental', description: 'Can track hardware assets and inventory' },
    { code: 'hardware.rentals.manage', name: 'Rental Orders', category: 'Hardware & Rental', description: 'Can manage rental orders and asset returns' },
    { code: 'hardware.amc.manage', name: 'AMC Contracts', category: 'Hardware & Rental', description: 'Can manage IT AMC service agreements' },
    { code: 'saas.products.manage', name: 'SaaS Products', category: 'SaaS', description: 'Can manage SaaS catalog and pricing plans' },
    { code: 'saas.subscriptions.manage', name: 'Subscriptions', category: 'SaaS', description: 'Can manage customer subscriptions and renewals' },
    { code: 'saas.licenses.manage', name: 'Licenses', category: 'SaaS', description: 'Can issue and revoke software license keys' },
    { code: 'automation.workflows.manage', name: 'Workflows', category: 'Automation', description: 'Can configure automated triggers and actions' },
    { code: 'integrations.sheets.manage', name: 'Google Sheets', category: 'Automation', description: 'Can configure Google Sheet lead syncing' },
    { code: 'integrations.webhooks.manage', name: 'Webhooks', category: 'Automation', description: 'Can configure inbound and outbound webhooks' },
    { code: 'content.services.manage', name: 'Services Catalog', category: 'Content', description: 'Can edit public services catalog' },
    { code: 'content.projects.manage', name: 'Portfolio Showcase', category: 'Content', description: 'Can manage portfolio projects' },
    { code: 'content.blog.manage', name: 'Blog Posts', category: 'Content', description: 'Can publish and edit blog articles' },
    { code: 'content.testimonials.manage', name: 'Testimonials', category: 'Content', description: 'Can manage client reviews' },
    { code: 'content.faqs.manage', name: 'FAQs', category: 'Content', description: 'Can manage FAQs' },
    { code: 'content.media.manage', name: 'Media Library', category: 'Content', description: 'Can upload and delete media files' },
    { code: 'admin.users.manage', name: 'User Management', category: 'Administration', description: 'Can create and manage admin user accounts' },
    { code: 'admin.roles.manage', name: 'Roles & Permissions', category: 'Administration', description: 'Can configure granular role permissions' },
    { code: 'admin.settings.manage', name: 'Global Settings', category: 'Administration', description: 'Can update website and system settings' },
    { code: 'admin.audit.view', name: 'Audit Logs', category: 'Administration', description: 'Can view immutable activity audit logs' },
  ];

  for (const perm of permissions) {
    await prisma.permission.upsert({
      where: { code: perm.code },
      update: { name: perm.name, category: perm.category, description: perm.description },
      create: perm,
    });
  }
  console.log(`✅ Seeded ${permissions.length} granular permissions.`);

  // 2. Seed Default Pipelines & Stages
  const pipelines = [
    {
      name: 'Software & Web Development',
      code: 'software-dev',
      isDefault: true,
      stages: [
        { name: 'New Lead', order: 1, probability: 10, color: '#6366f1' },
        { name: 'Attempted Contact', order: 2, probability: 20, color: '#3b82f6' },
        { name: 'Contacted & Qualified', order: 3, probability: 40, color: '#0ea5e9' },
        { name: 'Discovery & Scope', order: 4, probability: 60, color: '#14b8a6' },
        { name: 'Proposal Sent', order: 5, probability: 75, color: '#f59e0b' },
        { name: 'Negotiation', order: 6, probability: 90, color: '#8b5cf6' },
        { name: 'Won (Closed)', order: 7, probability: 100, isWon: true, color: '#10b981' },
        { name: 'Lost', order: 8, probability: 0, isLost: true, color: '#ef4444' },
      ],
    },
    {
      name: 'IT Hardware & Laptop Rentals',
      code: 'hardware-rentals',
      isDefault: false,
      stages: [
        { name: 'Rental Enquiry', order: 1, probability: 15, color: '#6366f1' },
        { name: 'Specs & Stock Verified', order: 2, probability: 40, color: '#3b82f6' },
        { name: 'Quote Dispatched', order: 3, probability: 70, color: '#f59e0b' },
        { name: 'Agreement & Security Deposit', order: 4, probability: 90, color: '#8b5cf6' },
        { name: 'Delivered & Active', order: 5, probability: 100, isWon: true, color: '#10b981' },
        { name: 'Cancelled / Lost', order: 6, probability: 0, isLost: true, color: '#ef4444' },
      ],
    },
    {
      name: 'IT AMC & Support Contracts',
      code: 'amc-contracts',
      isDefault: false,
      stages: [
        { name: 'AMC Inquiry', order: 1, probability: 20, color: '#6366f1' },
        { name: 'Site Audit & Asset Count', order: 2, probability: 50, color: '#0ea5e9' },
        { name: 'SLA Proposal Sent', order: 3, probability: 75, color: '#f59e0b' },
        { name: 'Contract Executed', order: 4, probability: 100, isWon: true, color: '#10b981' },
        { name: 'Declined', order: 5, probability: 0, isLost: true, color: '#ef4444' },
      ],
    },
    {
      name: 'Digital Marketing & Growth',
      code: 'digital-marketing',
      isDefault: false,
      stages: [
        { name: 'Lead Inbound', order: 1, probability: 15, color: '#6366f1' },
        { name: 'Audit Call Scheduled', order: 2, probability: 35, color: '#3b82f6' },
        { name: 'Pitch & Strategy Shared', order: 3, probability: 65, color: '#f59e0b' },
        { name: 'Retainer Signed', order: 4, probability: 100, isWon: true, color: '#10b981' },
        { name: 'Lost to Competitor', order: 5, probability: 0, isLost: true, color: '#ef4444' },
      ],
    },
  ];

  for (const pipeData of pipelines) {
    const { stages, ...pipeFields } = pipeData;
    const pipeline = await prisma.pipeline.upsert({
      where: { code: pipeFields.code },
      update: { name: pipeFields.name, isDefault: pipeFields.isDefault },
      create: pipeFields,
    });

    for (const stage of stages) {
      const existing = await prisma.pipelineStage.findFirst({
        where: { pipelineId: pipeline.id, name: stage.name },
      });
      if (!existing) {
        await prisma.pipelineStage.create({
          data: {
            pipelineId: pipeline.id,
            name: stage.name,
            order: stage.order,
            probability: stage.probability,
            isWon: stage.isWon || false,
            isLost: stage.isLost || false,
            color: stage.color,
          },
        });
      }
    }
  }
  console.log('✅ Seeded 4 default pipelines with full stages.');

  // 3. Seed Default Departments
  const departments = [
    { name: 'Executive Leadership', description: 'Core strategy and executive operations' },
    { name: 'Sales & Business Development', description: 'Direct sales, client acquisition, and account executives' },
    { name: 'Software Engineering', description: 'Full stack development, mobile engineering, and UI/UX design' },
    { name: 'IT Hardware & Rentals', description: 'Asset provisioning, computer rentals, and hardware maintenance' },
    { name: 'Digital Marketing', description: 'SEO, performance PPC advertising, and social media campaigns' },
    { name: 'HR & Talent Acquisition', description: 'Human resources, attendance, payroll, and recruitment' },
    { name: 'Finance & Accounting', description: 'Invoicing, billing, expense verification, and taxation' },
    { name: 'Customer Support & SLA', description: 'Help desk, technical assistance, and customer happiness' },
  ];

  for (const dept of departments) {
    await prisma.department.upsert({
      where: { name: dept.name },
      update: { description: dept.description },
      create: dept,
    });
  }
  console.log(`✅ Seeded ${departments.length} departments.`);

  // 4. Seed Default Tags
  const tags = [
    { name: 'Enterprise', color: '#6366f1' },
    { name: 'VIP Client', color: '#e11d48' },
    { name: 'Hot Lead', color: '#ea580c' },
    { name: 'Warm Lead', color: '#d97706' },
    { name: 'MacBook Rental', color: '#0284c7' },
    { name: 'Custom Software', color: '#059669' },
    { name: 'High Priority', color: '#dc2626' },
    { name: 'AMC Maintenance', color: '#7c3aed' },
  ];

  for (const t of tags) {
    await prisma.tag.upsert({
      where: { name: t.name },
      update: { color: t.color },
      create: t,
    });
  }
  console.log(`✅ Seeded ${tags.length} core tags.`);

  console.log('🎉 Business OS foundational data seeded successfully!');
}

seedBusinessOS()
  .catch((err) => {
    console.error('❌ Seeding failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
