import { PrismaClient, Role, ContentStatus, SettingCategory } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting TechInPedia India database seeding...');

  // 1. Seed Super Admin User (only if not already existing)
  const existingSuperAdmin = await prisma.user.findFirst({
    where: { role: Role.SUPER_ADMIN },
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
    { key: 'company_name', value: 'TechInPedia India', category: SettingCategory.COMPANY },
    { key: 'company_tagline', value: 'We Build Digital Products That Move Businesses Forward', category: SettingCategory.COMPANY },
    { key: 'company_email', value: 'contact@techinpedia.com', category: SettingCategory.COMPANY },
    { key: 'company_phone', value: '+91 98765 43210', category: SettingCategory.COMPANY },
    { key: 'whatsapp_number', value: '919876543210', category: SettingCategory.COMPANY },
    { key: 'company_address', value: 'Cyber City, Tech Hub, Bengaluru, Karnataka, India', category: SettingCategory.COMPANY },
    { key: 'company_about', value: 'TechInPedia India is a high-performance digital product and software engineering agency delivering web applications, mobile solutions, custom SaaS, and enterprise software to global clients.', category: SettingCategory.COMPANY },
    
    // Social Links
    { key: 'social_linkedin', value: 'https://linkedin.com/company/techinpedia-india', category: SettingCategory.SOCIAL },
    { key: 'social_github', value: 'https://github.com/techinpedia', category: SettingCategory.SOCIAL },
    { key: 'social_twitter', value: 'https://x.com/techinpedia', category: SettingCategory.SOCIAL },
    { key: 'social_instagram', value: 'https://www.instagram.com/techlynk.in/', category: SettingCategory.SOCIAL },

    // SEO Settings
    { key: 'seo_default_title', value: 'TechInPedia India | Software Development & Digital Solutions Agency', category: SettingCategory.SEO },
    { key: 'seo_default_description', value: 'TechInPedia India builds custom web apps, mobile apps, enterprise SaaS platforms, and UI/UX design solutions for ambitious businesses globally.', category: SettingCategory.SEO },
    { key: 'seo_og_image', value: '/images/og-techinpedia.jpg', category: SettingCategory.SEO },
    { key: 'google_analytics_id', value: '', category: SettingCategory.SEO },

    // Website Assets
    { key: 'website_logo_text', value: 'TechInPedia', category: SettingCategory.WEBSITE },
    { key: 'website_footer_text', value: '© 2026 TechInPedia India. All rights reserved. Building scalable software solutions.', category: SettingCategory.WEBSITE },
  ];

  for (const s of defaultSettings) {
    await prisma.setting.upsert({
      where: { key: s.key },
      update: { value: s.value, category: s.category },
      create: { key: s.key, value: s.value, category: s.category },
    });
  }
  console.log('✅ Upserted default site settings.');

  // 3. Seed Services
  const services = [
    {
      title: 'Web Application Development',
      slug: 'web-application-development',
      shortDescription: 'High-performance, responsive React & Next.js applications custom-engineered for business growth.',
      description: `We architect and build enterprise-grade web applications that deliver lightning-fast performance, flawless mobile responsiveness, and intuitive UI/UX. Using modern frameworks like Next.js, Node.js, and modern cloud databases, we ensure your platform scales effortlessly as your user base expands.`,
      icon: 'Globe',
      technologies: JSON.stringify(['React', 'Next.js', 'Node.js', 'TypeScript', 'Tailwind CSS', 'MySQL', 'GraphQL']),
      seoTitle: 'Custom Web Application Development Services | TechInPedia India',
      seoDescription: 'Build scalable, secure web applications with TechInPedia India. Node.js, Next.js, React, and MySQL expert developers.',
      displayOrder: 1,
      status: ContentStatus.PUBLISHED,
    },
    {
      title: 'Mobile App Development',
      slug: 'mobile-app-development',
      shortDescription: 'Cross-platform iOS and Android applications crafted for native performance and user engagement.',
      description: `Turn your mobile product vision into reality. We design and launch seamless iOS and Android applications built with React Native and Flutter. From API integrations to real-time sync and push notifications, our mobile apps deliver top-tier user experiences.`,
      icon: 'Smartphone',
      technologies: JSON.stringify(['React Native', 'Flutter', 'iOS', 'Android', 'REST API', 'Firebase']),
      seoTitle: 'Mobile App Development Agency | TechInPedia India',
      seoDescription: 'High-performance React Native & Flutter cross-platform mobile apps built for scale.',
      displayOrder: 2,
      status: ContentStatus.PUBLISHED,
    },
    {
      title: 'Custom Software & SaaS Development',
      slug: 'custom-software-saas-development',
      shortDescription: 'End-to-end SaaS engineering, multi-tenant architectures, subscription billing, and cloud deployment.',
      description: `Transform ideas into profitable SaaS products. We engineer multi-tenant cloud platforms, complete with user role management, billing gateway integrations (Stripe/Razorpay), automated analytics, and bulletproof security.`,
      icon: 'Cpu',
      technologies: JSON.stringify(['Node.js', 'TypeScript', 'Prisma', 'MySQL', 'Docker', 'AWS', 'Stripe']),
      seoTitle: 'SaaS & Custom Software Development | TechInPedia India',
      seoDescription: 'End-to-end SaaS architecture, cloud infrastructure, and custom software development.',
      displayOrder: 3,
      status: ContentStatus.PUBLISHED,
    },
    {
      title: 'UI/UX & Product Design',
      slug: 'ui-ux-product-design',
      shortDescription: 'Human-centered design systems, interactive prototypes, and conversion-focused digital interfaces.',
      description: `Create products users love. Our UI/UX designers map user journeys, build interactive prototypes, design design systems, and optimize conversion funnels to ensure your business goals are met with elegance.`,
      icon: 'Layout',
      technologies: JSON.stringify(['Figma', 'Prototyping', 'Design Systems', 'User Research', 'Wireframing']),
      seoTitle: 'UI/UX Design Agency | TechInPedia India',
      seoDescription: 'Custom digital product UI/UX design, interactive prototyping, and design system engineering.',
      displayOrder: 4,
      status: ContentStatus.PUBLISHED,
    },
    {
      title: 'E-Commerce Solutions',
      slug: 'ecommerce-solutions',
      shortDescription: 'Custom, high-converting e-commerce platforms with multi-currency checkout and inventory management.',
      description: `Drive sales with custom e-commerce stores designed for speed, security, and effortless checkout experiences. Features include payment gateway integration, real-time inventory tracking, and custom admin dashboards.`,
      icon: 'ShoppingBag',
      technologies: JSON.stringify(['Next.js', 'Node.js', 'MySQL', 'Stripe', 'Razorpay', 'Tailwind CSS']),
      seoTitle: 'E-Commerce Web Development | TechInPedia India',
      seoDescription: 'Build high-converting custom e-commerce stores with Next.js and secure payment integrations.',
      displayOrder: 5,
      status: ContentStatus.PUBLISHED,
    },
    {
      title: 'CRM & Enterprise ERP Systems',
      slug: 'crm-erp-development',
      shortDescription: 'Tailored CRM pipelines, ERP workflows, and internal business automation tools.',
      description: `Streamline operational efficiency with custom internal software. We build lead management CRMs, inventory tools, automated reporting dashboards, and workforce tracking solutions tailored to your workflow.`,
      icon: 'Database',
      technologies: JSON.stringify(['React', 'Node.js', 'Express', 'MySQL', 'Prisma', 'REST APIs']),
      seoTitle: 'Custom CRM & ERP Development | TechInPedia India',
      seoDescription: 'Bespoke CRM and ERP software engineering for business automation and lead tracking.',
      displayOrder: 6,
      status: ContentStatus.PUBLISHED,
    },
  ];

  for (const s of services) {
    await prisma.service.upsert({
      where: { slug: s.slug },
      update: s,
      create: s,
    });
  }
  console.log('✅ Seeded core services.');

  // 4. Seed Portfolio Projects
  const projects = [
    {
      title: 'Vijaya Bharna Jewellers',
      slug: 'vijaya-bharna-jewellers',
      category: 'Jewellery / E-commerce',
      clientType: 'Vijaya Bharna Jewellers',
      shortDesc: 'Dedicated Android mobile application for exploring jewellery products and digital customer experience.',
      description: 'A dedicated mobile application developed for Vijaya Bharna Jewellers to provide customers with a convenient digital experience for exploring jewellery products and connecting with the business. The application was developed with a focus on a smooth user experience, easy navigation, product presentation, and reliable mobile performance.',
      problem: 'Customers lacked an easy, dedicated mobile catalog to browse latest jewellery collections remotely.',
      solution: 'Developed a high-performance Android mobile application with rich product presentation, categorised catalogues, and direct store inquiry features.',
      features: JSON.stringify(['Android App Development', 'UI Implementation', 'Product Catalogue', 'User Experience Development', 'Backend/API Integration', 'Application Testing', 'Deployment & Play Store Publishing']),
      technologies: JSON.stringify(['Android', 'API Integration', 'Database', 'Mobile UI']),
      results: JSON.stringify(['Published on Google Play Store', 'Seamless Digital Shopping Experience']),
      featuredImage: 'https://play-lh.googleusercontent.com/CE2m2M1weOkVBu2WzhlYlUyRynAoxKGCW9znGDEiSJkeNGm8NZoG6ynMRQDdlflqMLFfejhwMZwqiDBfd4jD3w=w1200-h800-rw',
      gallery: JSON.stringify(['https://play.google.com/store/apps/details?id=com.vijayabharna.jewellers']),
      featured: true,
      status: ContentStatus.PUBLISHED,
      displayOrder: 1,
    },
    {
      title: 'Jagmohan Exam Sathi',
      slug: 'jagmohan-exam-sathi',
      category: 'Education / Exam Preparation',
      clientType: 'Jagmohan Institute',
      shortDesc: 'Educational mobile application designed for student learning and exam preparation.',
      description: 'Jagmohan Exam Sathi is an educational mobile application designed to provide students and exam aspirants with a convenient digital platform for learning and exam preparation. The application focuses on delivering educational content through an accessible mobile experience with a simple and user-friendly interface.',
      problem: 'Students needed a unified mobile platform to access structured study material and practice tests anywhere.',
      solution: 'Engineered an accessible educational Android application with subject categories, test modules, and streamlined UI.',
      features: JSON.stringify(['Android App Development', 'Educational Platform Development', 'UI/UX Implementation', 'API Integration', 'Content Management Integration', 'Performance Optimization', 'Play Store Deployment']),
      technologies: JSON.stringify(['Android', 'API Integration', 'Database', 'Mobile UI']),
      results: JSON.stringify(['Published on Google Play Store', 'High Student Engagement Rate']),
      featuredImage: 'https://play-lh.googleusercontent.com/W-JfZNKwRpfC5uYb1vSeHYgfwcZ_UcdF6nTAPCvJvw_Tc1367qNenguCM1ye8neYn1gqaMHCNK6-R5TSgsJRfw=w1200-h800-rw',
      gallery: JSON.stringify(['https://play.google.com/store/apps/details?id=com.jagmohanexamsathi.app']),
      featured: true,
      status: ContentStatus.PUBLISHED,
      displayOrder: 2,
    },
    {
      title: 'IPL Bus',
      slug: 'ipl-bus',
      category: 'Transportation / Bus Services',
      clientType: 'IPL Bus Services',
      shortDesc: 'Transportation mobile application for convenient bus services and route management.',
      description: 'A transportation-focused mobile application developed to provide users with a convenient digital experience for bus-related services. The application was designed with a focus on simple navigation, accessible information, and a smooth mobile experience.',
      problem: 'Commuters required an easy mobile interface to access bus schedules, route information, and service alerts.',
      solution: 'Built a reliable transportation Android app with quick route lookup, user-friendly interface, and fast response times.',
      features: JSON.stringify(['Android App Development', 'Mobile UI Development', 'API Integration', 'Service Management', 'Application Testing', 'Performance Optimization', 'Play Store Deployment']),
      technologies: JSON.stringify(['Android', 'API Integration', 'Database', 'Mobile UI']),
      results: JSON.stringify(['Published on Google Play Store', 'Optimized Commuter Route Discovery']),
      featuredImage: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=1200&q=80',
      gallery: JSON.stringify(['https://play.google.com/store/apps/details?id=com.iplbus.bmnaveen']),
      featured: true,
      status: ContentStatus.PUBLISHED,
      displayOrder: 3,
    },
    {
      title: 'BM Naveen Movies',
      slug: 'bm-naveen-movies',
      category: 'Entertainment / Movies',
      clientType: 'BM Naveen Entertainment',
      shortDesc: 'Entertainment mobile application for exploring movie content and digital media.',
      description: 'BM Naveen Movies is an entertainment-focused mobile application developed to provide users with a convenient way to explore movie-related content through a dedicated mobile platform. The application was built with an emphasis on a clean interface, easy navigation, content discovery, and an engaging user experience.',
      problem: 'Movie enthusiasts needed a smooth mobile application for discovering movie trailers, reviews, and updates.',
      solution: 'Created an engaging entertainment Android app with media streaming API integration and dynamic content categories.',
      features: JSON.stringify(['Android App Development', 'UI/UX Implementation', 'Movie Content Integration', 'API Integration', 'Application Testing', 'Performance Optimization', 'Play Store Deployment']),
      technologies: JSON.stringify(['Android', 'API Integration', 'Database', 'Mobile UI']),
      results: JSON.stringify(['Published on Google Play Store', 'Fast Content Streaming & Discovery']),
      featuredImage: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=1200&q=80',
      gallery: JSON.stringify(['https://play.google.com/store/apps/details?id=com.movies.bmnaveen']),
      featured: true,
      status: ContentStatus.PUBLISHED,
      displayOrder: 4,
    },
    {
      title: 'Naveen Taxi',
      slug: 'naveen-taxi',
      category: 'Transportation / Taxi Booking',
      clientType: 'Naveen Mobility',
      shortDesc: 'On-demand transportation application for convenient taxi booking services.',
      description: 'Naveen Taxi is a transportation application developed to provide users with a convenient digital experience for taxi-related services. The application was developed around the requirements of an on-demand transportation platform, focusing on usability, service accessibility, and a smooth mobile experience.',
      problem: 'Riders needed a simple, accessible mobile app for quick taxi booking and location-based ride requests.',
      solution: 'Engineered an on-demand taxi Android application featuring location services, streamlined booking flow, and driver dispatch API.',
      features: JSON.stringify(['Android App Development', 'Booking Flow Development', 'User Interface Development', 'API Integration', 'Location-Based Features', 'Application Testing', 'Play Store Deployment']),
      technologies: JSON.stringify(['Android', 'API Integration', 'Location Services', 'Database']),
      results: JSON.stringify(['Published on Google Play Store', 'On-Demand Ride Dispatch System']),
      featuredImage: 'https://images.unsplash.com/photo-1556122071-e404eaedb77f?auto=format&fit=crop&w=1200&q=80',
      gallery: JSON.stringify(['https://play.google.com/store/apps/details?id=com.naveen.taxi.user']),
      featured: true,
      status: ContentStatus.PUBLISHED,
      displayOrder: 5,
    },
    {
      title: 'AllOut',
      slug: 'allout',
      category: 'Business / Services',
      clientType: 'AllOut Enterprise',
      shortDesc: 'Business-focused mobile application for accessing commercial services.',
      description: 'A business-focused mobile application developed to provide customers with a convenient digital platform for accessing services and interacting with the business. The application was designed with a focus on usability, simple navigation, efficient functionality, and a reliable mobile experience.',
      problem: 'Clients required a unified mobile app to request corporate services and track service requests.',
      solution: 'Architected a robust business services Android app with customer account management and service tracking API.',
      features: JSON.stringify(['Android App Development', 'UI/UX Implementation', 'API Integration', 'Business Feature Development', 'Application Testing', 'Performance Optimization', 'Play Store Deployment']),
      technologies: JSON.stringify(['Android', 'API Integration', 'Database', 'Mobile UI']),
      results: JSON.stringify(['Published on Google Play Store', 'Streamlined B2C Service Delivery']),
      featuredImage: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1200&q=80',
      gallery: JSON.stringify(['https://play.google.com/store/apps/details?id=com.customer.allout']),
      featured: true,
      status: ContentStatus.PUBLISHED,
      displayOrder: 6,
    },
    {
      title: 'Namasthe Daily',
      slug: 'namasthe-daily',
      category: 'News / Media',
      clientType: 'Namasthe Daily Media',
      shortDesc: 'Digital news application for discovering and consuming latest news content.',
      description: 'Namasthe Daily is a digital news application developed to provide users with an accessible mobile platform for discovering and consuming news content. The application brings news content into a convenient mobile experience with a focus on content discovery, categories, notifications, and user engagement.',
      problem: 'Readers wanted a fast-loading daily news app with category filtering and real-time push alerts.',
      solution: 'Developed a news & media Android app featuring push notifications, category filters, and lightweight article rendering.',
      features: JSON.stringify(['Android App Development', 'News Content Integration', 'Category-Based Content', 'API Integration', 'Push Notifications', 'UI/UX Development', 'Performance Optimization', 'Play Store Deployment']),
      technologies: JSON.stringify(['Android', 'API Integration', 'Push Notifications', 'Database']),
      results: JSON.stringify(['Published on Google Play Store', 'Real-Time News Push Alerts']),
      featuredImage: 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=1200&q=80',
      gallery: JSON.stringify(['https://play.google.com/store/apps/details?id=com.namasethedaily.news']),
      featured: true,
      status: ContentStatus.PUBLISHED,
      displayOrder: 7,
    },
    {
      title: 'JobsChoose',
      slug: 'jobschoose',
      category: 'Jobs / Recruitment',
      clientType: 'JobsChoose Recruitment',
      shortDesc: 'Recruitment-focused mobile application for discovering job opportunities.',
      description: 'JobsChoose is a recruitment-focused mobile application developed to provide users with a convenient digital platform for discovering and accessing job opportunities. The application was designed to make job-related information more accessible through a simple and user-friendly mobile experience.',
      problem: 'Job seekers needed a straightforward mobile application to browse career openings and apply quickly.',
      solution: 'Built a job search Android application with role filtering, employer listings, and fast application flow.',
      features: JSON.stringify(['Android App Development', 'Job Listing Integration', 'Search & Discovery Features', 'API Integration', 'UI/UX Development', 'Application Testing', 'Performance Optimization', 'Play Store Deployment']),
      technologies: JSON.stringify(['Android', 'API Integration', 'Database', 'Mobile UI']),
      results: JSON.stringify(['Published on Google Play Store', 'Accessible Job Discovery Platform']),
      featuredImage: 'https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?auto=format&fit=crop&w=1200&q=80',
      gallery: JSON.stringify(['https://play.google.com/store/apps/details?id=com.jobschoose.customer']),
      featured: true,
      status: ContentStatus.PUBLISHED,
      displayOrder: 8,
    },
  ];

  for (const p of projects) {
    await prisma.project.upsert({
      where: { slug: p.slug },
      update: p,
      create: p,
    });
  }
  console.log('✅ Seeded portfolio projects.');

  // 5. Seed Testimonials
  const testimonials = [
    {
      clientName: 'Vikram Sharma',
      company: 'FinEdge Global Solutions',
      designation: 'Co-Founder & CTO',
      testimonial: 'TechInPedia India delivered our SaaS dashboard ahead of deadline with exceptional quality. Their engineering standards, clear communication, and grasp of complex workflows made them feel like an in-house core team.',
      rating: 5,
      displayOrder: 1,
      status: ContentStatus.PUBLISHED,
    },
    {
      clientName: 'Sarah Jenkins',
      company: 'Pulse Digital Health',
      designation: 'VP of Product',
      testimonial: 'Working with TechInPedia India transformed our digital product strategy. The telemedicine portal they built is clean, fast, and praised by both our doctors and patients.',
      rating: 5,
      displayOrder: 2,
      status: ContentStatus.PUBLISHED,
    },
    {
      clientName: 'Rajesh Patel',
      company: 'Apex Logistics & Freight',
      designation: 'Operations Director',
      testimonial: 'The custom mobile driver app engineered by TechInPedia India cut our delivery processing times dramatically. Their team is reliable, skilled, and business-focused.',
      rating: 5,
      displayOrder: 3,
      status: ContentStatus.PUBLISHED,
    },
  ];

  for (const t of testimonials) {
    const existing = await prisma.testimonial.findFirst({
      where: { clientName: t.clientName, company: t.company },
    });
    if (!existing) {
      await prisma.testimonial.create({ data: t });
    }
  }
  console.log('✅ Seeded testimonials.');

  // 6. Seed FAQs
  const faqs = [
    {
      question: 'What software development services does TechInPedia India offer?',
      answer: 'We specialize in Web Application Development (React/Next.js/Node.js), Cross-Platform Mobile Apps (React Native/Flutter), Custom SaaS Product Engineering, UI/UX Design, E-Commerce Solutions, and Custom CRM/ERP Systems.',
      category: 'General',
      displayOrder: 1,
      status: ContentStatus.PUBLISHED,
    },
    {
      question: 'How does TechInPedia India handle project communication and updates?',
      answer: 'We believe in transparent, frequent communication. We establish dedicated communication channels (Slack/WhatsApp/Teams), provide weekly sprint updates, maintain clear Jira/Trello boards, and conduct regular video syncs.',
      category: 'Process',
      displayOrder: 2,
      status: ContentStatus.PUBLISHED,
    },
    {
      question: 'What is the typical timeline for building a custom web or mobile application?',
      answer: 'Small projects or MVPs typically take 3-6 weeks. Full-scale custom platforms, SaaS systems, or enterprise CRMs range from 8 to 16 weeks depending on feature requirements and API integrations.',
      category: 'Pricing & Timeline',
      displayOrder: 3,
      status: ContentStatus.PUBLISHED,
    },
    {
      question: 'Do you offer ongoing technical maintenance and support after launch?',
      answer: 'Yes! We provide structured post-launch support and maintenance contracts including regular security updates, server monitoring, bug fixes, database optimizations, and feature enhancements.',
      category: 'Support',
      displayOrder: 4,
      status: ContentStatus.PUBLISHED,
    },
    {
      question: 'Who owns the source code and intellectual property (IP)?',
      answer: 'You retain 100% full ownership of all intellectual property, source code, designs, and database assets upon project completion.',
      category: 'General',
      displayOrder: 5,
      status: ContentStatus.PUBLISHED,
    },
  ];

  for (const f of faqs) {
    const existing = await prisma.faq.findFirst({
      where: { question: f.question },
    });
    if (!existing) {
      await prisma.faq.create({ data: f });
    }
  }
  console.log('✅ Seeded FAQs.');

  // 7. Seed Blog Posts
  const blogs = [
    {
      title: 'Why Next.js & Node.js Are the Ideal Tech Stack for Modern Enterprise Applications',
      slug: 'why-nextjs-nodejs-ideal-stack-modern-apps',
      excerpt: 'Discover why combining Next.js App Router with Node.js and MySQL delivers unmatched performance, SEO advantage, and rapid time-to-market.',
      content: `<h2>The Evolution of Modern Web Engineering</h2><p>In today's digital landscape, speed and scalability dictate business success. Enterprise platforms need server-side rendering for SEO, instant interactive UI transitions for user satisfaction, and lightweight backend APIs for mobile app connectivity.</p><h3>Key Benefits of Next.js for Enterprise Products</h3><ul><li><strong>Server-Side Rendering & SSG:</strong> Blazing-fast initial page loads and search engine indexing.</li><li><strong>Built-in API Architecture:</strong> Seamless integration between frontend components and backend logic.</li><li><strong>TypeScript Security:</strong> Strict type safety reduces runtime errors across complex codebases.</li></ul><p>At TechInPedia India, we leverage this stack to build high-converting products engineered for long-term scalability.</p>`,
      category: 'Engineering',
      tags: 'Next.js, Node.js, Web Development, Software Architecture',
      author: 'TechInPedia Engineering Team',
      status: ContentStatus.PUBLISHED,
      publishedAt: new Date(),
    },
    {
      title: 'Building a High-Converting Digital Product: From Discovery to Deployment',
      slug: 'building-high-converting-digital-product-discovery-to-deployment',
      excerpt: 'Learn our proven 7-step engineering process for turning ambitious business ideas into market-ready software solutions.',
      content: `<h2>The Anatomy of Product Success</h2><p>Building successful software requires more than just clean code—it demands deep alignment between business goals, user psychology, and technical architecture.</p><h3>Our 7-Step Development Philosophy</h3><ol><li><strong>Discovery & Strategy:</strong> Uncovering user pain points and defining core features.</li><li><strong>UI/UX Prototyping:</strong> Designing wireframes that reduce cognitive load.</li><li><strong>Scalable Development:</strong> Clean code architecture with automated tests.</li><li><strong>Quality Assurance:</strong> End-to-end security and performance checks.</li></ol>`,
      category: 'Product Strategy',
      tags: 'Product Management, UI/UX, Agile Development',
      author: 'TechInPedia Product Team',
      status: ContentStatus.PUBLISHED,
      publishedAt: new Date(),
    },
  ];

  for (const b of blogs) {
    await prisma.blogPost.upsert({
      where: { slug: b.slug },
      update: b,
      create: b,
    });
  }
  console.log('✅ Seeded blog posts.');

  console.log('🎉 Seeding complete successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
