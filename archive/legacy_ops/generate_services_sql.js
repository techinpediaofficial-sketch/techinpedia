const fs = require('fs');

const services = [
  {
    title: 'Web Application Development',
    slug: 'web-application-development',
    shortDescription: 'High-performance, responsive React & Next.js applications custom-engineered for business growth.',
    description: 'We architect and build enterprise-grade web applications that deliver lightning-fast performance, flawless mobile responsiveness, and intuitive UI/UX. Using modern frameworks like Next.js, Node.js, and modern cloud databases, we ensure your platform scales effortlessly as your user base expands.',
    icon: 'Globe',
    technologies: JSON.stringify(['React', 'Next.js', 'Node.js', 'TypeScript', 'Tailwind CSS', 'MySQL', 'GraphQL']),
    seoTitle: 'Custom Web Application Development Services | TechInPedia India',
    seoDescription: 'Build scalable, secure web applications with TechInPedia India. Node.js, Next.js, React, and MySQL expert developers.',
    displayOrder: 1,
  },
  {
    title: 'Mobile App Development',
    slug: 'mobile-app-development',
    shortDescription: 'Cross-platform iOS and Android applications crafted for native performance and user engagement.',
    description: 'Turn your mobile product vision into reality. We design and launch seamless iOS and Android applications built with React Native and Flutter. From API integrations to real-time sync and push notifications, our mobile apps deliver top-tier user experiences.',
    icon: 'Smartphone',
    technologies: JSON.stringify(['React Native', 'Flutter', 'iOS', 'Android', 'REST API', 'Firebase']),
    seoTitle: 'Mobile App Development Agency | TechInPedia India',
    seoDescription: 'High-performance React Native & Flutter cross-platform mobile apps built for scale.',
    displayOrder: 2,
  },
  {
    title: 'Custom Software & SaaS Development',
    slug: 'custom-software-saas-development',
    shortDescription: 'End-to-end SaaS engineering, multi-tenant architectures, subscription billing, and cloud deployment.',
    description: 'Transform ideas into profitable SaaS products. We engineer multi-tenant cloud platforms, complete with user role management, billing gateway integrations (Stripe/Razorpay), automated analytics, and bulletproof security.',
    icon: 'Cpu',
    technologies: JSON.stringify(['Node.js', 'TypeScript', 'Prisma', 'MySQL', 'Docker', 'AWS', 'Stripe']),
    seoTitle: 'SaaS & Custom Software Development | TechInPedia India',
    seoDescription: 'End-to-end SaaS architecture, cloud infrastructure, and custom software development.',
    displayOrder: 3,
  },
  {
    title: 'UI/UX & Product Design',
    slug: 'ui-ux-product-design',
    shortDescription: 'Human-centered design systems, interactive prototypes, and conversion-focused digital interfaces.',
    description: 'Create products users love. Our UI/UX designers map user journeys, build interactive prototypes, design design systems, and optimize conversion funnels to ensure your business goals are met with elegance.',
    icon: 'Layout',
    technologies: JSON.stringify(['Figma', 'Prototyping', 'Design Systems', 'User Research', 'Wireframing']),
    seoTitle: 'UI/UX Design Agency | TechInPedia India',
    seoDescription: 'Custom digital product UI/UX design, interactive prototyping, and design system engineering.',
    displayOrder: 4,
  },
  {
    title: 'E-Commerce Solutions',
    slug: 'ecommerce-solutions',
    shortDescription: 'Custom, high-converting e-commerce platforms with multi-currency checkout and inventory management.',
    description: 'Drive sales with custom e-commerce stores designed for speed, security, and effortless checkout experiences. Features include payment gateway integration, real-time inventory tracking, and custom admin dashboards.',
    icon: 'ShoppingBag',
    technologies: JSON.stringify(['Next.js', 'Node.js', 'MySQL', 'Stripe', 'Razorpay', 'Tailwind CSS']),
    seoTitle: 'E-Commerce Web Development | TechInPedia India',
    seoDescription: 'Build high-converting custom e-commerce stores with Next.js and secure payment integrations.',
    displayOrder: 5,
  },
  {
    title: 'CRM & Enterprise ERP Systems',
    slug: 'crm-erp-development',
    shortDescription: 'Tailored CRM pipelines, ERP workflows, and internal business automation tools.',
    description: 'Streamline operational efficiency with custom internal software. We build lead management CRMs, inventory tools, automated reporting dashboards, and workforce tracking solutions tailored to your workflow.',
    icon: 'Database',
    technologies: JSON.stringify(['React', 'Node.js', 'Express', 'MySQL', 'Prisma', 'REST APIs']),
    seoTitle: 'Custom CRM & ERP Development | TechInPedia India',
    seoDescription: 'Bespoke CRM and ERP software engineering for business automation and lead tracking.',
    displayOrder: 6,
  },
];

let sql = [];

for (const s of services) {
  const desc = s.description.replace(/'/g, "\\'");
  const sdesc = s.shortDescription.replace(/'/g, "\\'");
  const tech = s.technologies.replace(/'/g, "\\'");
  sql.push(`INSERT INTO \`Service\` (\`id\`, \`title\`, \`slug\`, \`shortDescription\`, \`description\`, \`icon\`, \`technologies\`, \`seoTitle\`, \`seoDescription\`, \`displayOrder\`, \`status\`, \`createdAt\`, \`updatedAt\`) VALUES
(UUID(), '${s.title}', '${s.slug}', '${sdesc}', '${desc}', '${s.icon}', '${tech}', '${s.seoTitle}', '${s.seoDescription}', ${s.displayOrder}, 'PUBLISHED', NOW(3), NOW(3))
ON DUPLICATE KEY UPDATE \`title\` = VALUES(\`title\`), \`shortDescription\` = VALUES(\`shortDescription\`), \`description\` = VALUES(\`description\`), \`updatedAt\` = NOW(3);`);
}

fs.writeFileSync('seed_services.sql', sql.join('\n\n'));
console.log('✅ Generated seed_services.sql');
