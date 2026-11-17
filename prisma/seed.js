const { PrismaClient, Role, ContentStatus, SettingCategory } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting TechInPedia database seeding...');

  // 1. Seed Super Admin User
  const existingSuperAdmin = await prisma.user.findFirst({
    where: { email: 'admin@techinpedia.com' },
  });

  if (!existingSuperAdmin) {
    const hashedPassword = await bcrypt.hash('Admin@123456', 10);
    const admin = await prisma.user.create({
      data: {
        name: 'TechInPedia Admin',
        email: 'admin@techinpedia.com',
        password: hashedPassword,
        role: Role.SUPER_ADMIN,
        mustChangePassword: true,
      },
    });
    console.log('✅ Created default Super Admin user:', admin.email);
  } else {
    console.log('ℹ️ Super Admin user already exists.');
  }

  // 2. Seed Default System Settings
  const defaultSettings = [
    { key: 'company_name', value: 'TechInPedia', category: SettingCategory.COMPANY },
    { key: 'company_tagline', value: 'Hardware Rentals, Custom Software & Strategic Digital Marketing', category: SettingCategory.COMPANY },
    { key: 'company_email', value: 'contact@techinpedia.com', category: SettingCategory.COMPANY },
    { key: 'company_phone', value: '+91 98765 43210', category: SettingCategory.COMPANY },
    { key: 'whatsapp_number', value: '919876543210', category: SettingCategory.COMPANY },
    { key: 'company_address', value: 'Cyber Hub & Worldwide Services, India', category: SettingCategory.COMPANY },
    { key: 'company_about', value: 'TechInPedia delivers premium business laptop & computer rentals, IT AMC maintenance, custom web & mobile app engineering, scalable cloud infrastructure, and ROI-focused digital marketing.', category: SettingCategory.COMPANY },
    { key: 'social_linkedin', value: 'https://linkedin.com/company/techinpedia', category: SettingCategory.SOCIAL },
    { key: 'social_github', value: 'https://github.com/techinpedia', category: SettingCategory.SOCIAL },
    { key: 'social_twitter', value: 'https://x.com/techinpedia', category: SettingCategory.SOCIAL },
    { key: 'social_instagram', value: 'https://www.instagram.com/techinpedia/', category: SettingCategory.SOCIAL },
    { key: 'seo_default_title', value: 'TechInPedia | Hardware Rentals, Software Engineering & Digital Marketing', category: SettingCategory.SEO },
    { key: 'seo_default_description', value: 'Enterprise laptop & computer rentals, IT AMC maintenance, custom web & mobile apps, cloud services, and strategic digital marketing.', category: SettingCategory.SEO },
    { key: 'seo_og_image', value: '/logo.png', category: SettingCategory.SEO },
    { key: 'google_analytics_id', value: '', category: SettingCategory.SEO },
    { key: 'website_logo_text', value: 'TechInPedia', category: SettingCategory.WEBSITE },
    { key: 'website_footer_text', value: '© 2026 TechInPedia. All rights reserved.', category: SettingCategory.WEBSITE },
  ];

  for (const s of defaultSettings) {
    await prisma.setting.upsert({
      where: { key: s.key },
      update: { value: s.value, category: s.category },
      create: { key: s.key, value: s.value, category: s.category },
    });
  }
  console.log('✅ Upserted default site settings.');

  // 3. Seed Services (9 Core Services across Hardware, Software, Marketing)
  const services = [
    // Hardware
    {
      title: 'Laptop Rental',
      slug: 'laptop-rental',
      shortDescription: 'Enterprise MacBook Pros & Windows laptops on flexible rental tenures with doorstep replacement.',
      description: 'TechInPedia delivers premium business laptops on flexible short-term and long-term rental plans. Apple Silicon MacBooks, ThinkPads, and Dell XPS workstations backed by guaranteed doorstep hardware replacement SLAs.',
      icon: 'Laptop',
      technologies: JSON.stringify(['Apple M2/M3/M4', 'Intel Core i7/i9', 'AMD Ryzen', 'Windows 11 Pro', 'macOS Sequoia']),
      seoTitle: 'Laptop Rental Services | MacBook & Windows Laptops | TechInPedia',
      seoDescription: 'Rent commercial laptops with TechInPedia. Zero maintenance worries, flexible daily/monthly/annual tenures, and instant doorstep support.',
      displayOrder: 1,
      status: ContentStatus.PUBLISHED,
    },
    {
      title: 'Computer Rental',
      slug: 'computer-rental',
      shortDescription: 'Custom GPU workstations, desktop rigs, multi-display setups, and office servers on rent.',
      description: 'High-performance commercial desktop PCs, custom Nvidia RTX GPU workstations, dual/triple monitor configurations, and rack-mountable server nodes tailored to your project requirements.',
      icon: 'Monitor',
      technologies: JSON.stringify(['Nvidia RTX 4090/A6000', 'Custom Towers', 'Dual 4K Monitors', 'Intel Xeon', 'Windows Server']),
      seoTitle: 'Computer & Desktop PC Rental | Workstations & GPU Rigs | TechInPedia',
      seoDescription: 'Rent high-performance computers, Nvidia GPU rendering workstations, and corporate desktop setups from TechInPedia.',
      displayOrder: 2,
      status: ContentStatus.PUBLISHED,
    },
    {
      title: 'AMC Maintenance',
      slug: 'amc-maintenance',
      shortDescription: 'Comprehensive Annual Maintenance Contracts (AMC) for IT infrastructure with 4-hour SLA response.',
      description: 'Manage and maintain your entire IT hardware footprint—employee laptops, desktop PCs, local servers, routers, firewalls, and peripheral devices—with scheduled quarterly preventive maintenance.',
      icon: 'Wrench',
      technologies: JSON.stringify(['Preventive Maintenance', 'Network Diagnostics', 'Thermal Tuning', 'Data Recovery', 'Hardware SLA']),
      seoTitle: 'Corporate IT AMC Services | Annual Maintenance Contract | TechInPedia',
      seoDescription: 'Keep your business IT running 24/7 with TechInPedia IT AMC contracts. Comprehensive maintenance for laptops, PCs, servers, and networks.',
      displayOrder: 3,
      status: ContentStatus.PUBLISHED,
    },

    // Software
    {
      title: 'Mobile Application',
      slug: 'mobile-application',
      shortDescription: 'Native iOS & Android apps and Flutter cross-platform mobile applications.',
      description: 'Engineered for smooth 120fps animations, biometric authentication, offline database sync, and published seamlessly to the App Store and Google Play.',
      icon: 'Smartphone',
      technologies: JSON.stringify(['Flutter', 'React Native', 'Swift (iOS)', 'Kotlin (Android)', 'Firebase', 'GraphQL']),
      seoTitle: 'Mobile App Development Agency | iOS & Android Apps | TechInPedia',
      seoDescription: 'Build production-ready mobile apps with TechInPedia. Cross-platform Flutter & React Native development, native iOS & Android apps.',
      displayOrder: 4,
      status: ContentStatus.PUBLISHED,
    },
    {
      title: 'Website Development',
      slug: 'website-development',
      shortDescription: 'Sub-second web applications, corporate portals, and SaaS platforms built on Next.js & React.',
      description: 'Custom, responsive, and ultra-fast web applications built on Next.js 16, React 19, TypeScript, and modern headless CMS backends. Optimized for Core Web Vitals and high conversions.',
      icon: 'Globe',
      technologies: JSON.stringify(['Next.js 16', 'React 19', 'TypeScript', 'Tailwind CSS', 'Node.js', 'Prisma ORM']),
      seoTitle: 'Custom Website Development Agency | Next.js & React Apps | TechInPedia',
      seoDescription: 'High-speed custom website and web app development by TechInPedia. Next.js, React, TypeScript, and enterprise database integrations.',
      displayOrder: 5,
      status: ContentStatus.PUBLISHED,
    },
    {
      title: 'Cloud Services',
      slug: 'cloud-services',
      shortDescription: 'Scalable cloud architecture, Docker containerization, Kubernetes, and automated CI/CD DevOps.',
      description: 'Auto-scaling cloud infrastructure across AWS, GCP, and Azure. Microservices containerization with Docker/Kubernetes, automated CI/CD pipelines, and 99.99% uptime SLAs.',
      icon: 'Cloud',
      technologies: JSON.stringify(['AWS', 'Google Cloud', 'Microsoft Azure', 'Docker', 'Kubernetes', 'CI/CD Pipelines']),
      seoTitle: 'Cloud Services & DevOps Engineering | AWS, GCP & Azure | TechInPedia',
      seoDescription: 'Scale your infrastructure with TechInPedia cloud services. Cloud migrations, DevOps CI/CD pipelines, and 24/7 server management.',
      displayOrder: 6,
      status: ContentStatus.PUBLISHED,
    },

    // Marketing
    {
      title: 'Brand Collaboration',
      slug: 'brand-collaboration',
      shortDescription: 'Strategic B2B partnerships, influencer creator tie-ups, and co-branded cross promotions.',
      description: 'Connect your brand with top industry creators and complementary brands for collaborative product launches, co-marketing campaigns, podcast features, and influencer promotions.',
      icon: 'Handshake',
      technologies: JSON.stringify(['Influencer CRM', 'Brand Matchmaking', 'Partnership Legal', 'Campaign Analytics', 'PR Syndication']),
      seoTitle: 'Brand Collaboration & Influencer Partnerships | TechInPedia',
      seoDescription: 'Drive organic growth and brand authority with TechInPedia strategic brand collaborations, B2B partnerships, and verified creator campaigns.',
      displayOrder: 7,
      status: ContentStatus.PUBLISHED,
    },
    {
      title: 'Content Creation For Social Media',
      slug: 'content-creation-for-social-media',
      shortDescription: 'High-retention Instagram Reels, YouTube Shorts, viral carousels, and visual storytelling.',
      description: 'Produce studio-grade short-form video content (Reels, Shorts), educational carousel slides, branded infographics, and motion graphics that stop the scroll and build an engaged community.',
      icon: 'Video',
      technologies: JSON.stringify(['Adobe Premiere Pro', 'After Effects', 'Figma', 'Motion Graphics', 'Sound Design', '4K Production']),
      seoTitle: 'Social Media Content Creation | Reels, Shorts & Video Production | TechInPedia',
      seoDescription: 'Engage your audience with viral social media content creation by TechInPedia. Studio-grade Instagram Reels, YouTube Shorts, and carousels.',
      displayOrder: 8,
      status: ContentStatus.PUBLISHED,
    },
    {
      title: 'Digital Marketing',
      slug: 'digital-marketing',
      shortDescription: 'High-ROAS Meta Ads, Google PPC, technical SEO, and conversion-rate optimization.',
      description: 'End-to-end performance marketing across Meta Ads (Facebook & Instagram) and Google Ads (Search, PMax, YouTube) paired with technical SEO and conversion funnels.',
      icon: 'TrendingUp',
      technologies: JSON.stringify(['Meta Ads Manager', 'Google Ads', 'GA4', 'Meta Conversions API', 'Technical SEO', 'CRO Funnels']),
      seoTitle: 'Performance Digital Marketing Agency | Meta Ads & Google PPC | TechInPedia',
      seoDescription: 'Scale your sales pipeline with TechInPedia performance digital marketing. High-ROAS Meta Ads, Google PPC campaigns, and technical SEO.',
      displayOrder: 9,
      status: ContentStatus.PUBLISHED,
    },
  ];

  for (const svc of services) {
    await prisma.service.upsert({
      where: { slug: svc.slug },
      update: svc,
      create: svc,
    });
  }
  console.log(`✅ Upserted ${services.length} core services.`);

  console.log('🎉 TechInPedia database seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
