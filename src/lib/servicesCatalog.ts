export interface ServiceDetail {
  slug: string;
  title: string;
  category: 'Hardware & Rentals' | 'Software & Engineering' | 'Marketing & Growth';
  badge?: string;
  shortDescription: string;
  description: string;
  seoTitle: string;
  seoDescription: string;
  technologies: string[];
  features: string[];
  deliverables: string[];
  faqs: { q: string; a: string }[];
}

export const SERVICES_CATALOG: Record<string, ServiceDetail> = {
  // ==========================================
  // 1. HARDWARE PILLAR
  // ==========================================
  'laptop-rental': {
    slug: 'laptop-rental',
    title: 'Laptop on Rent in Delhi NCR',
    category: 'Hardware & Rentals',
    badge: 'Popular Rental',
    shortDescription: 'Enterprise-grade laptop rentals for startups, corporate teams, developers, and events with flexible tenure and instant doorstep support.',
    description: '💻 Laptops on Rent – Power Your Workflow Without the Upfront Cost!\n\nWhether you need a high-performance Apple MacBook for design and video editing, a robust Lenovo ThinkPad for programming, or bulk budget Dell laptops for your expanding corporate team, TechInPedia offers the ultimate laptop rental solutions. Get access to the latest M-series MacBooks and Intel Core i7/i9 Windows laptops without the heavy CapEx investment.\n\nOur laptops on rent are perfectly maintained, fully sanitized, and ready for deployment. Target your specific business needs with customized OS cloning and instant doorstep hardware replacement support. Enjoy flexible tenure options, from daily event hires to yearly corporate leases.\n\nLooking for a laptop on rent? We provide bulk enterprise laptop rentals, delivering Dell laptop on rent, Lenovo, HP, and Apple laptops instantly to your office.',
    seoTitle: 'Laptop on Rent in Delhi NCR | Dell, HP, Lenovo & MacBook',
    seoDescription: 'Rent laptops in Delhi NCR from TechInPedia. Choose Dell, HP, Lenovo and MacBook laptops for offices, events, projects and short-term requirements. Get a quote today.',
    technologies: ['Apple Silicon M2/M3/M4', 'Intel Core i5/i7/i9', 'AMD Ryzen Pro', 'Windows 11 Pro', 'macOS Sequoia', 'Ubuntu Linux Enterprise'],
    features: [
      'Top Brands: Apple MacBook Pro/Air, Lenovo ThinkPad, Dell XPS/Latitude, HP EliteBook',
      'High-Speed Storage: 256GB / 512GB / 1TB / 2TB NVMe SSD options',
      'Memory Configurations: 8GB, 16GB, 32GB, and 64GB Unified/DDR5 RAM',
      'Flexible tenures: daily events, monthly sprints, or annual corporate leases',
      'Doorstep same-day replacement and instant backup device standby',
      'Zero upfront asset liability (100% tax-deductible operational expenditure)',
      'Pre-installed Software Stack: MS Office, Developer IDEs, Adobe CC, and VPN configurations',
      '100% Sanitized and professionally refurbished enterprise-grade models'
    ],
    deliverables: [
      'Fully tested, sanitised, and configured laptops ready to deploy',
      'Original brand charger, protective sleeve, wireless mouse, and power accessories',
      'Enterprise SLA agreement with guaranteed 4-hour replacement coverage in metro cities',
      'Monthly flexible billing dashboard with asset allocation management',
      'End-of-lease data wiping certificate to ensure your company data is secure'
    ],
    faqs: [
      {
        q: 'What laptop models and configurations are available for rent?',
        a: 'We provide Apple MacBook Air/Pro (M2, M3, M4 series), Lenovo ThinkPad (T and E Series), Dell Latitude and XPS, and HP EliteBooks with Core i5, i7, and i9 configurations. You can choose SSD capacities up to 2TB and RAM up to 64GB.'
      },
      {
        q: 'Can corporate clients rent laptops in bulk for new employee batches?',
        a: 'Yes, TechInPedia specializes in bulk enterprise laptop rentals ranging from 5 to 500+ machines, pre-loaded with your company image, VPNs, and software stack.'
      },
      {
        q: 'What happens if a rented laptop encounters a hardware issue?',
        a: 'Under our enterprise rental SLA, we diagnose and replace faulty hardware at your doorstep within 4 to 24 hours, ensuring zero productivity downtime.'
      },
      {
        q: 'Is there a minimum rental period?',
        a: 'No! We offer highly flexible plans ranging from a 1-day event rental to a 3-year corporate lease. The pricing automatically scales to give you the best deal based on tenure.'
      },
      {
        q: 'Do you provide on-site IT support for rented laptops?',
        a: 'Yes, for enterprise clients renting in bulk, we offer dedicated on-site IT support engineers to handle initial setup, domain binding, and networking.'
      }
    ]
  },

  'computer-rental': {
    slug: 'computer-rental',
    title: 'Desktop on Rent in Delhi NCR',
    category: 'Hardware & Rentals',
    badge: 'High Compute',
    shortDescription: 'High-performance desktop PCs, GPU workstations, multi-monitor setups, and local server rentals for heavy computing and office setups.',
    description: '🖥️ Computers on Rent – Equip Your Office Without CapEx!\n\nEmpower your engineering, 3D rendering, video editing, and standard office workstation teams with our premium computers on rent. TechInPedia supplies powerful commercial desktops from Dell, HP, and Lenovo, custom Nvidia RTX GPU workstations, dual/triple monitor configurations, and local rack-mountable server nodes. Whether you need a standard PC on rent for your BPO or a high-end desktop on rent for AutoCAD and video editing, we have it all.\n\nLooking for an Apple desktop on rent? We offer iMacs and Mac Studios for creative agencies. Getting a computer on rent eliminates the huge upfront costs while ensuring you always have up-to-date hardware. We specialize in setting up entire corporate trading desks and creative studios with full installation, cable management, and immediate replacement SLAs.',
    seoTitle: 'Desktop on Rent in Delhi NCR | Dell, HP & Lenovo',
    seoDescription: 'Rent desktops and computers in Delhi NCR from TechInPedia. Dell, HP and Lenovo PCs for offices, BPOs, events and temporary projects. Get a rental quote.',
    technologies: ['Custom High-Performance Towers', 'Nvidia RTX 4080 / 4090', 'Intel Xeon & Core i7/i9', 'AMD Threadripper', '4K Dual/Triple Monitors', 'Windows & Linux Server'],
    features: [
      'Top Brands & Custom Builds: Dell OptiPlex, HP ProDesk, Lenovo ThinkCentre',
      'Flexible Storage: NVMe M.2 SSDs for OS (256GB - 2TB) and HDDs (1TB - 8TB) for mass storage',
      'Custom GPU workstations engineered for AI training, 3D VFX, and CAD',
      'Multi-monitor trading desks and data analytics desktop configurations',
      'Scheduled preventive dusting, thermal repasting, and hardware audits',
      'Scalable contract upgrades as your team or compute demand expands',
      'Full peripheral ecosystem: Mechanical keyboards, ergonomic mice, and HD webcams'
    ],
    deliverables: [
      'Pre-assembled workstation units tested under 100% stress benchmark loads',
      'Dual/triple display arms, high-refresh rate monitors, and surge protectors',
      'Dedicated on-site hardware installation and network cabling configuration',
      'Hardware maintenance SLA and rapid part replacement agreement',
      'Reliable power backup UPS (600VA to 2KVA) provided per desk'
    ],
    faqs: [
      {
        q: 'Can I customize the RAM, storage, and GPU specifications?',
        a: 'Yes! We configure custom desktop towers based on your exact compute demands—ranging up to 128GB/256GB RAM, high-end Nvidia RTX GPUs, and flexible SSD/HDD hybrid storage setups.'
      },
      {
        q: 'Are monitors and accessories included with computer rental?',
        a: 'Yes, each computer rental includes a choice of 24-inch, 27-inch, or 32-inch 4K IPS monitors, wireless keyboard/mouse combos, and power backup UPS.'
      },
      {
        q: 'How quickly can you deploy a 50-seater desktop setup for a BPO?',
        a: 'We can deploy and network 50 to 100 desktop setups within 48 to 72 hours, depending on your custom imaging and networking requirements.'
      },
      {
        q: 'Do you offer Apple Mac Studio or iMac rentals?',
        a: 'Absolutely. We offer the latest Apple iMacs and Mac Studio (M2 Ultra/Max) rigs on rent for video editors, music producers, and creative agencies.'
      }
    ]
  },

  'amc-maintenance': {
    slug: 'amc-maintenance',
    title: 'AMC Maintenance',
    category: 'Hardware & Rentals',
    badge: '24/7 SLA Support',
    shortDescription: 'Comprehensive Annual Maintenance Contracts (AMC) for corporate IT infrastructure, laptops, desktops, networks, and server systems.',
    description: 'Avoid costly hardware downtime with TechInPedia AMC services. We manage and maintain your entire IT hardware footprint—including employee laptops, desktop PCs, local servers, routers, firewalls, and peripheral devices. Our certified on-call engineers conduct periodic preventive health checks and provide rapid-response emergency repairs.',
    seoTitle: 'Corporate IT AMC Services | Annual Maintenance Contract',
    seoDescription: 'Keep your business IT running 24/7 with TechInPedia IT AMC contracts. Comprehensive and non-comprehensive maintenance for laptops, PCs, servers, and networks.',
    technologies: ['Component-Level Hardware Diagnostic', 'Network Diagnostics & Cabling', 'Thermal Optimization & Cleaning', 'Data Recovery & Backup Systems', 'OS & Firmware Patching', 'Antivirus & Endpoint Security'],
    features: [
      'Guaranteed 4-hour emergency on-site engineer response SLA',
      'Scheduled quarterly preventive maintenance and hardware cleaning',
      'Component-level motherboard, chip, and power supply repairs',
      'LAN/WAN, firewall, Wi-Fi router, and switch infrastructure troubleshooting',
      'Disaster recovery planning, automated data backups, and SSD upgrades',
      'Dedicated IT helpdesk support with transparent ticketing and asset logging'
    ],
    deliverables: [
      'Detailed initial IT health audit report of all office hardware assets',
      'Quarterly preventative maintenance logs and hardware performance scores',
      'Priority on-call hardware engineer dispatch with standby replacement parts',
      'Annual Maintenance Contract certificate and defined SLA guarantee document'
    ],
    faqs: [
      {
        q: 'What is the difference between Comprehensive and Non-Comprehensive AMC?',
        a: 'Comprehensive AMC covers both service engineer labor and replacement of damaged spare parts without extra cost. Non-Comprehensive AMC covers all engineer visits, diagnostic labor, and preventive tune-ups, with spare parts billed at wholesale rates.'
      },
      {
        q: 'What is your response time for emergency server or network outages?',
        a: 'Our AMC agreements guarantee a 2 to 4-hour on-site engineer arrival for critical network, server, or executive workstation failures.'
      }
    ]
  },

  // ==========================================
  // 2. SOFTWARE PILLAR
  // ==========================================
  'mobile-application': {
    slug: 'mobile-application',
    title: 'Mobile Application Development',
    category: 'Software & Engineering',
    badge: 'iOS & Android',
    shortDescription: 'High-performance native and cross-platform mobile apps for iOS and Android with smooth 120fps animations, offline sync, and scalable backends.',
    description: 'TechInPedia engineers intuitive, robust, and scalable mobile applications. Leveraging modern technologies such as Flutter, React Native, Swift, and Kotlin, we take your app from UI/UX architecture and API integration to App Store and Google Play publishing. Designed for maximum retention, bank-grade data security, and seamless user experiences.',
    seoTitle: 'Mobile App Development Agency | iOS & Android Apps',
    seoDescription: 'Build production-ready mobile apps with TechInPedia. Cross-platform Flutter & React Native development, native iOS & Android apps with smooth performance.',
    technologies: ['Flutter', 'React Native', 'Swift (iOS)', 'Kotlin (Android)', 'Firebase', 'GraphQL / REST APIs', 'Fastlane', 'App Store Connect'],
    features: [
      'Native-grade performance with buttery smooth 60fps and 120fps animations',
      'Offline-first architecture with SQLite/Realm local data synchronisation',
      'Secure biometric authentication (FaceID, Fingerprint) and JWT sessions',
      'Push notification automations with deep-linking (Firebase Cloud Messaging)',
      'Integrated payment gateways (Stripe, Razorpay, In-App Purchases, Apple Pay)',
      'End-to-end Google Play Store and Apple App Store compliance and launch'
    ],
    deliverables: [
      'Production-ready iOS (.ipa) and Android (.aab/.apk) release builds',
      'Complete documented source code repository with full IP ownership',
      'App Store and Play Store review approvals and live listing management',
      'Post-launch 90-day bug warranty and performance telemetry monitoring'
    ],
    faqs: [
      {
        q: 'Should I choose Flutter/React Native or Native iOS/Android?',
        a: 'For 90% of business applications, cross-platform frameworks like Flutter or React Native reduce engineering time and cost by 40-50% while sharing a single unified codebase across iOS and Android without sacrificing native performance.'
      },
      {
        q: 'Do you handle the App Store and Google Play Store review process?',
        a: 'Yes, our engineering team manages complete App Store and Google Play Store guidelines compliance, privacy declarations, screenshot assets, and review approvals.'
      }
    ]
  },

  'website-development': {
    slug: 'website-development',
    title: 'Website Development',
    category: 'Software & Engineering',
    badge: 'Next.js & Full-Stack',
    shortDescription: 'Sub-second web applications, SaaS platforms, corporate portals, and headless e-commerce built on Next.js, React, and TypeScript.',
    description: 'Transform your digital presence into a customer acquisition engine. TechInPedia engineers custom, responsive, and ultra-fast web applications built on Next.js 16, React 19, TypeScript, and modern headless CMS backends. We optimize every page for Core Web Vitals, enterprise security, dynamic server rendering, and seamless conversion funnels.',
    seoTitle: 'Custom Website Development Agency | Next.js & React Apps',
    seoDescription: 'High-speed custom website and web app development by TechInPedia. Next.js, React, TypeScript, and enterprise database integrations engineered for conversions.',
    technologies: ['Next.js 16', 'React 19', 'TypeScript', 'Tailwind CSS', 'Node.js', 'Prisma ORM', 'PostgreSQL / MySQL', 'Vercel / CloudLinux'],
    features: [
      'Sub-second page loads with 95+ Google PageSpeed & Core Web Vitals scores',
      'Server-Side Rendering (SSR) and Static Site Generation (SSG) for peak SEO',
      'Fluid mobile-first responsive design across all smartphones and desktops',
      'Interactive client portals, authentication systems, and admin dashboards',
      'API integrations with CRMs, payment gateways, and third-party SaaS services',
      'Automatic JSON-LD schema markup, OpenGraph metadata, and dynamic sitemaps'
    ],
    deliverables: [
      'Production-ready Next.js / full-stack web application source code',
      'Custom admin dashboard for content management and lead tracking',
      'SSL configuration, database schema, and automated cloud deployment',
      'Comprehensive code documentation and handoff training session'
    ],
    faqs: [
      {
        q: 'Why build with Next.js instead of WordPress or generic templates?',
        a: 'Next.js provides enterprise-grade performance, sub-second load times, superior SEO rendering, and custom scalability without the security vulnerabilities and plugin bloat of traditional CMS platforms.'
      },
      {
        q: 'Will the website be easy for our internal team to manage?',
        a: 'Yes! We integrate intuitive custom admin portals where your team can update services, blog posts, testimonials, and media without writing a single line of code.'
      }
    ]
  },

  'cloud-services': {
    slug: 'cloud-services',
    title: 'Cloud Services',
    category: 'Software & Engineering',
    badge: 'AWS / GCP / Azure',
    shortDescription: 'Scalable cloud infrastructure, Docker containerization, automated CI/CD DevOps, and server management engineered for 99.99% uptime.',
    description: 'Architect a rock-solid, auto-scaling cloud environment. TechInPedia engineers robust cloud architectures across Amazon Web Services (AWS), Google Cloud Platform (GCP), and Microsoft Azure. From containerized microservices with Docker and Kubernetes to serverless APIs and automated CI/CD pipelines, we ensure peak reliability, disaster recovery, and reduced cloud hosting costs.',
    seoTitle: 'Cloud Services & DevOps Engineering | AWS, GCP & Azure',
    seoDescription: 'Scale your infrastructure with TechInPedia cloud services. Cloud migrations, DevOps CI/CD pipelines, Docker/Kubernetes containerization, and 24/7 server management.',
    technologies: ['Amazon Web Services (AWS)', 'Google Cloud Platform (GCP)', 'Microsoft Azure', 'Docker', 'Kubernetes', 'Terraform', 'GitHub Actions', 'Nginx & Redis'],
    features: [
      'Multi-region cloud infrastructure design engineered for 99.99% uptime',
      'Automated CI/CD deployment pipelines (GitHub Actions, GitLab CI)',
      'Docker containerization and Kubernetes cluster orchestration',
      'Cloud cost optimization reducing unnecessary server compute expenses',
      'Automated daily database backups, failover replication, and disaster recovery',
      'VPC network security, DDoS mitigation, and SSL/TLS certificate management'
    ],
    deliverables: [
      'Complete Cloud Architecture Blueprint and Infrastructure-as-Code (Terraform)',
      'Automated zero-downtime deployment pipelines for web and API repositories',
      'Cloud monitoring, logging, and alert notification configuration',
      'Monthly infrastructure health review and cost efficiency audit'
    ],
    faqs: [
      {
        q: 'Can you help migrate our legacy on-premise servers to AWS or GCP?',
        a: 'Yes, we specialize in seamless, zero-data-loss cloud migrations from local servers or shared hosting to modern containerized cloud setups on AWS, GCP, or Azure.'
      },
      {
        q: 'How do you help reduce existing cloud bills?',
        a: 'Our cloud audit examines reserved instances, right-sizes overprovisioned compute VMs, configures auto-scaling, and sets up automated caching, typically saving 25% to 40% on monthly cloud bills.'
      }
    ]
  },

  // ==========================================
  // 3. MARKETING PILLAR
  // ==========================================
  'brand-collaboration': {
    slug: 'brand-collaboration',
    title: 'Brand Collaboration',
    category: 'Marketing & Growth',
    badge: 'High Impact',
    shortDescription: 'Strategic B2B partnerships, influencer tie-ups, creator sponsorships, and cross-promotions that expand your reach and brand authority.',
    description: 'Scale your brand credibility and acquire qualified customers through high-impact brand collaborations. TechInPedia connects your business with strategic industry partners, top creators, and complementary brands for collaborative product launches, co-marketing campaigns, podcast features, and influencer promotions that drive authentic engagement.',
    seoTitle: 'Brand Collaboration & Influencer Partnerships',
    seoDescription: 'Drive organic growth and brand authority with TechInPedia strategic brand collaborations, B2B partnerships, and verified influencer marketing campaigns.',
    technologies: ['Creator Matchmaking Engine', 'Influencer CRM', 'Brand Partnership Contracts', 'Campaign Reach Analytics', 'Affiliate Tracking Software'],
    features: [
      'Targeted identification and vetting of creators and complementary brands',
      'End-to-end partnership negotiation, legal contracts, and deliverables roadmap',
      'Co-branded content campaigns across Instagram, YouTube, and LinkedIn',
      'Affiliate and revenue-share collaboration structuring for low-risk growth',
      'Sponsorship activations for tech conferences, podcasts, and digital summits',
      'Transparent campaign attribution, ROI tracking, and performance reporting'
    ],
    deliverables: [
      'Curated collaboration roster tailored to your target demographic and industry',
      'Executed partnership agreements, deliverables schedule, and campaign brief',
      'Multi-channel promotional content assets and collaborative post schedules',
      'Comprehensive campaign post-mortem with reach, engagement, and conversion metrics'
    ],
    faqs: [
      {
        q: 'What types of brand collaborations do you organize?',
        a: 'We organize influencer product reviews, joint webinar and podcast appearances, B2B cross-promotions, co-branded giveaway campaigns, and corporate affiliate partnerships.'
      },
      {
        q: 'How do you select influencers and collaboration partners?',
        a: 'We thoroughly vet partners based on audience demographic match, real engagement rates (excluding bots), brand alignment, and historical campaign conversion performance.'
      }
    ]
  },

  'content-creation-for-social-media': {
    slug: 'content-creation-for-social-media',
    title: 'Content Creation For Social Media',
    category: 'Marketing & Growth',
    badge: 'Viral Formats',
    shortDescription: 'High-retention Instagram Reels, YouTube Shorts, viral visual carousels, and video storytelling engineered to build an engaged community.',
    description: 'Transform your social media channels into powerful customer magnet funnels. TechInPedia produces studio-grade short-form video content (Reels, TikToks, YouTube Shorts), educational carousel slides, branded infographics, and motion graphics. We combine psychology-backed narrative hooks, high-energy editing, and sound design to stop the scroll and turn viewers into loyal brand advocates.',
    seoTitle: 'Social Media Content Creation | Reels, Shorts & Video Production',
    seoDescription: 'Engage your audience with viral social media content creation by TechInPedia. Studio-grade Instagram Reels, YouTube Shorts, carousels, and visual storytelling.',
    technologies: ['Adobe Premiere Pro', 'After Effects', 'Figma Design', 'Photoshop', '4K Cinema Equipment', 'Motion Graphics & Sound Libraries'],
    features: [
      'High-retention 3-second visual and audio hooks designed for maximum watch time',
      'Dynamic caption typography, trending sound selection, and pacing optimization',
      'Educational multi-slide carousel design tailored for high saves and shares',
      'Monthly content calendar planning aligned with your commercial milestones',
      'Brand identity styling: custom typography, color harmony, and motion assets',
      'Multi-platform asset adaptation for Instagram, YouTube, LinkedIn, and X'
    ],
    deliverables: [
      'Monthly package of 15 to 30 high-resolution edited Reels / Shorts ready to publish',
      'Branded graphic carousel designs with editable source templates in Figma',
      'High-click-through rate (CTR) custom thumbnail designs',
      '30-day social media publishing schedule and caption copywriting'
    ],
    faqs: [
      {
        q: 'Do we need to provide raw video footage or do you handle shooting?',
        a: 'We offer both options! We can edit, script, and enhance your founder/team raw footage, or produce complete animated motion graphics, stock-integrated videos, and on-location shoots.'
      },
      {
        q: 'How quickly is content produced and delivered?',
        a: 'We deliver content in bi-weekly batches with a full monthly calendar approved 7 days ahead of publishing, allowing ample time for review and revisions.'
      }
    ]
  },

  'digital-marketing': {
    slug: 'digital-marketing',
    title: 'Digital Marketing',
    category: 'Marketing & Growth',
    badge: 'High ROAS',
    shortDescription: 'Full-funnel performance marketing across Meta Ads, Google PPC, search engine optimization (SEO), and conversion-rate optimization.',
    description: 'Scale your business revenue with data-backed digital marketing. TechInPedia engineers performance advertising campaigns across Meta (Facebook & Instagram Ads) and Google Ads (Search, Performance Max, Display, and YouTube). Paired with technical search engine optimization (SEO) and automated retargeting funnels, we turn marketing budgets into predictable customer acquisition.',
    seoTitle: 'Performance Digital Marketing Agency | Meta Ads & Google PPC',
    seoDescription: 'Scale your sales pipeline with TechInPedia performance digital marketing. High-ROAS Meta Ads, Google PPC campaigns, technical SEO, and conversion optimization.',
    technologies: ['Meta Ads Manager', 'Google Ads & PMax', 'Google Analytics 4 (GA4)', 'Meta Conversions API (CAPI)', 'Google Search Console', 'Hotjar & Clarity'],
    features: [
      'Hyper-targeted audience segmentation and lookalike customer modeling',
      'High-CTR ad copy and creative variants engineered for rapid A/B testing',
      'Google Search intent PPC capturing ready-to-buy commercial searches',
      'Server-side tracking setup (Meta CAPI & Google Tag Manager) for 100% data accuracy',
      'Omnichannel retargeting funnels driving abandoned visitors back to checkout',
      'Weekly transparent performance dashboards tracking real ROAS and CAC'
    ],
    deliverables: [
      'Complete ad account audit, pixel verification, and conversion tracking setup',
      'Multi-tier campaign architecture (Cold Acquisition, Warm Engagement, Hot Retargeting)',
      'Custom ad creative suite (Static graphics, motion clips, video hooks)',
      'Weekly performance briefing and continuous conversion rate optimization (CRO)'
    ],
    faqs: [
      {
        q: 'What is your typical target ROAS (Return on Ad Spend)?',
        a: 'Depending on the industry and offer price point, our campaigns typically target and achieve 3x to 7x blended ROAS for e-commerce and high-intent qualified lead costs for B2B/services.'
      },
      {
        q: 'How do you prevent ad spend wastage?',
        a: 'We implement daily negative keyword monitoring on Google Ads, automated budget bid caps, server-side Conversion API tracking, and continuous creative testing to eliminate underperforming ad sets immediately.'
      }
    ]
  },

  // ==========================================
  // 4. ADDITIONAL CORE ENTERPRISE SERVICES
  // ==========================================
  'macbook-rental': {
    slug: 'macbook-rental',
    title: 'MacBook on Rent in Delhi NCR',
    category: 'Hardware & Rentals',
    badge: 'Apple Silicon Fleet',
    shortDescription: 'Rent Apple MacBook Pro and MacBook Air with M2, M3, and M4 Apple Silicon chips for designers, video editors, and engineering sprints.',
    description: '💻 Rent Apple MacBooks – Peak Performance Without Capital Expenditure!\n\nSupercharge your creative and engineering teams with enterprise Apple MacBook rentals from TechInPedia. Access the latest Apple Silicon hardware — including MacBook Air M2/M3 and MacBook Pro 14" & 16" with M3/M4 Pro and Max processors — without heavy upfront investment. Whether you require single-day setups for creative production or long-term leases for high-growth engineering teams, we deliver tested, sanitised, and ready-to-work MacBooks with same-day doorstep replacement across Delhi NCR.',
    seoTitle: 'MacBook on Rent in Delhi NCR | MacBook Pro & Air M-Series Rental',
    seoDescription: 'Rent Apple MacBook Pro and MacBook Air in Delhi, Noida & Gurgaon from TechInPedia. M2, M3, M4 chips, flexible tenure, doorstep setup & instant support.',
    technologies: ['Apple Silicon M2 / M3 / M4', 'macOS Sequoia & Sonoma', 'Liquid Retina XDR', 'Thunderbolt 4 / MagSafe 3', 'Final Cut Pro & Logic Pro Ready', 'Xcode & Docker Ready'],
    features: [
      'Latest generation Apple Silicon: M2, M3, and M4 Pro/Max models',
      'High-resolution Liquid Retina XDR displays for creative color grading and 4K editing',
      'RAM configurations up to 64GB Unified Memory and SSDs up to 2TB',
      'Flexible corporate tenure: daily shoots, monthly sprints, or multi-year company leases',
      'Zero capital expenditure with 100% tax-deductible operational expense invoices',
      'Rapid replacement guarantee across Delhi, Noida, Gurgaon, Faridabad, and Ghaziabad'
    ],
    deliverables: [
      'Tested and configured MacBook with clean macOS setup',
      'Original Apple MagSafe / USB-C fast charger and power cables',
      'Protective carry case and optional USB-C multiport adapter hubs',
      'Dedicated enterprise hardware SLA with doorstep diagnosis and standby units'
    ],
    faqs: [
      {
        q: 'Which MacBook models are available for corporate rental?',
        a: 'We supply MacBook Air 13" and 15" (M2, M3) and MacBook Pro 14" and 16" (M2 Pro/Max, M3 Pro/Max, M4). All models are inspected, battery-health verified, and fully sanitized.'
      },
      {
        q: 'Can corporate clients rent MacBooks in bulk for engineering teams?',
        a: 'Yes, TechInPedia provides bulk deployments of 5 to 100+ MacBooks pre-configured with MDM, developer tooling (Homebrew, Docker, Node.js), and VPN profiles.'
      },
      {
        q: 'What is the minimum rental tenure for MacBooks?',
        a: 'We provide flexible tenures starting from 1-day event and video shoot rentals up to 12-month renewable corporate lease agreements.'
      }
    ]
  },

  'custom-software-development': {
    slug: 'custom-software-development',
    title: 'Custom Software Development',
    category: 'Software & Engineering',
    badge: 'Enterprise Grade',
    shortDescription: 'Tailored enterprise web applications, bespoke business platforms, and automated workflow engines designed for scalability and high uptime.',
    description: 'Turn complex business operations into scalable software systems. TechInPedia builds bespoke web applications, internal tools, customer portals, and enterprise workflow engines. Built on modern, reliable architectures including Next.js, TypeScript, PostgreSQL/MySQL, and microservice or modular monolith backends, our engineering delivers high performance, robust security, and seamless API integrations.',
    seoTitle: 'Custom Software Development Company | Enterprise Web Applications',
    seoDescription: 'Custom software development services by TechInPedia. Scalable enterprise web apps, client portals, automated workflow systems, and secure API architectures.',
    technologies: ['Next.js & React', 'Node.js & TypeScript', 'PostgreSQL & MySQL', 'Prisma ORM', 'Redis & BullMQ', 'Docker & AWS'],
    features: [
      'Modern modular architecture designed for high throughput and maintainability',
      'Role-Based Access Control (RBAC) and enterprise security compliance',
      'Automated background queue engines and scheduled event processing',
      'Custom API development and seamless third-party service integrations',
      'Responsive, accessible, and intuitive user interfaces built with Tailwind CSS',
      'Automated unit, integration, and security guardrail test suites'
    ],
    deliverables: [
      'Full technical architecture documentation and database schema design',
      'Complete source code with automated CI/CD deployment pipelines',
      'Interactive user and admin training walkthroughs',
      'Post-launch SLA maintenance, security updates, and performance monitoring'
    ],
    faqs: [
      {
        q: 'What types of custom software does TechInPedia build?',
        a: 'We build enterprise resource platforms, customer self-service portals, multi-tenant SaaS applications, workflow automation engines, and internal workforce operations suites.'
      },
      {
        q: 'Do we own the full intellectual property and source code?',
        a: 'Yes. All source code, design assets, and database architectures developed for your project are 100% your intellectual property upon milestone completion.'
      },
      {
        q: 'How do you handle post-deployment maintenance and updates?',
        a: 'We offer dedicated AMC software support SLAs covering uptime monitoring, dependency patching, security audits, and continuous feature enhancements.'
      }
    ]
  },

  'crm-erp-solutions': {
    slug: 'crm-erp-solutions',
    title: 'Custom CRM & ERP Solutions',
    category: 'Software & Engineering',
    badge: 'Operational Efficiency',
    shortDescription: 'Unified customer relationship management and enterprise resource planning platforms tailored to your company exact business workflows.',
    description: 'Replace disconnected spreadsheets and rigid off-the-shelf software with an all-in-one Business Operating System. TechInPedia engineers custom CRM and ERP platforms that consolidate customer lead capture, sales pipelines, billing, inventory, workforce attendance, and automated WhatsApp/email communications into a single command center.',
    seoTitle: 'Custom CRM & ERP Software Development | Unified Business OS',
    seoDescription: 'Build custom CRM and ERP software tailored to your workflow with TechInPedia. Lead management, billing, inventory, HRMS, and automated communications in one platform.',
    technologies: ['TypeScript & Next.js', 'MySQL & PostgreSQL', 'Prisma ORM', 'WhatsApp Cloud API', 'Razorpay & Stripe', 'Google Workspace Integration'],
    features: [
      'Omnichannel lead capture with automated scoring, assignment, and WhatsApp alerts',
      'Customizable multi-stage deal pipelines with SLA countdown tracking',
      'Integrated invoicing, tax management, and automated payment gateway reconciliations',
      'Employee attendance, leave management, and role-based permissions',
      'Real-time executive reporting dashboards tracking revenue, churn, and team productivity',
      'Automated multi-step communication drips via WhatsApp and transactional email'
    ],
    deliverables: [
      'Custom CRM/ERP system tailored to your exact business operations',
      'Legacy data migration from Excel, Google Sheets, or existing CRMs',
      'Role-scoped user accounts with strict tenant data insulation',
      'Comprehensive user manuals and admin video tutorials'
    ],
    faqs: [
      {
        q: 'Why choose a custom CRM/ERP over Salesforce or Zoho?',
        a: 'Off-the-shelf platforms charge steep per-seat monthly subscriptions, force you into rigid workflows, and charge heavily for customizations. A custom CRM built by TechInPedia is 100% owned by your company, matches your exact operations, and has zero recurring per-user licensing fees.'
      },
      {
        q: 'Can you migrate our existing customer data and records?',
        a: 'Yes. We sanitize, normalize, and migrate your legacy data from spreadsheets, CSVs, or existing tools without data loss.'
      },
      {
        q: 'Can the CRM integrate with our WhatsApp Business and Google Workspace?',
        a: 'Yes. We integrate official WhatsApp Cloud APIs for direct inbox chat and automated template alerts, alongside Google Drive and Calendar sync.'
      }
    ]
  }
};

const SERVICE_ALIASES: Record<string, string> = {
  'mobile-application-development': 'mobile-application',
  'cloud-it-services': 'cloud-services',
  'desktop-rental': 'computer-rental',
  'desktop-on-rent': 'computer-rental',
  'laptop-on-rent': 'laptop-rental',
  'macbook-on-rent': 'macbook-rental',
};

export function getCatalogService(slug: string): ServiceDetail | undefined {
  const normalizedSlug = SERVICE_ALIASES[slug] || slug;
  return SERVICES_CATALOG[normalizedSlug];
}
