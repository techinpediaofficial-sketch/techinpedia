import { MetadataRoute } from 'next';
import { db } from '@/lib/db';
import { ContentStatus } from '@prisma/client';
import { ncrLocations } from '@/lib/locations';
export const revalidate = 3600; // Re-generate every 1 hour

const STATIC_SERVICE_SLUGS = [
  'laptop-rental',
  'computer-rental',
  'macbook-rental',
  'amc-maintenance',
  'mobile-application',
  'website-development',
  'custom-software-development',
  'crm-erp-solutions',
  'cloud-services',
  'brand-collaboration',
  'content-creation-for-social-media',
  'digital-marketing',
];

const STATIC_BLOG_SLUGS = [
  'best-tech-stack-ecommerce-app-2026',
  'react-native-vs-flutter-android-ios-2026',
  'custom-crm-vs-off-the-shelf-saas',
  'how-much-does-website-development-cost-in-india',
  'custom-software-vs-ready-made-software',
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const isUrban =
    process.env.NEXT_PUBLIC_SITE_CODE === 'MARKETPLACE_PUBLIC' ||
    process.env.NEXT_PUBLIC_SITE_URL?.includes('urban');

  // ========================================================
  // 1. URBAN MARKETPLACE SITEMAP (urban.techinpedia.com)
  // Strictly includes marketplace discovery URLs; zero company blogs or IT services.
  // ========================================================
  if (isUrban) {
    const baseUrl = 'https://urban.techinpedia.com';

    const urbanStaticRoutes = [
      {
        url: `${baseUrl}/`,
        changeFrequency: 'daily' as const,
        priority: 1.0,
      },
      {
        url: `${baseUrl}/list-business`,
        changeFrequency: 'weekly' as const,
        priority: 0.9,
      },
      {
        url: `${baseUrl}/vendor`,
        changeFrequency: 'weekly' as const,
        priority: 0.8,
      },
      {
        url: `${baseUrl}/privacy-policy`,
        changeFrequency: 'monthly' as const,
        priority: 0.5,
      },
      {
        url: `${baseUrl}/terms`,
        changeFrequency: 'monthly' as const,
        priority: 0.5,
      },
      {
        url: `${baseUrl}/refund-policy`,
        changeFrequency: 'monthly' as const,
        priority: 0.5,
      },
    ];

    try {
      const [categories, vendors] = await Promise.all([
        db.marketplaceCategory.findMany({
          where: { status: 'ACTIVE' },
          select: { slug: true, updatedAt: true },
        }),
        db.marketplaceVendor.findMany({
          where: { status: 'ACTIVE' },
          select: { slug: true, city: true, updatedAt: true },
        }),
      ]);

      const categoryRoutes = categories.map((c) => ({
        url: `${baseUrl}/category/${c.slug}`,
        lastModified: c.updatedAt,
        changeFrequency: 'daily' as const,
        priority: 0.85,
      }));

      const vendorRoutes = vendors.map((v) => ({
        url: `${baseUrl}/biz/${v.city ? v.city.toLowerCase() : 'lucknow'}/${v.slug}`,
        lastModified: v.updatedAt,
        changeFrequency: 'weekly' as const,
        priority: 0.8,
      }));

      return [...urbanStaticRoutes, ...categoryRoutes, ...vendorRoutes];
    } catch {
      return urbanStaticRoutes;
    }
  }

  // ========================================================
  // 2. TECHINPEDIA COMPANY SITEMAP (techinpedia.com)
  // Strictly includes company blogs, IT services, rentals, and portfolio.
  // ========================================================
  const baseUrl = 'https://techinpedia.com';

  const staticBlogRoutes = STATIC_BLOG_SLUGS.map((slug) => ({
    url: `${baseUrl}/blog/${slug}`,
    changeFrequency: 'weekly' as const,
    priority: 0.75,
  }));

  // Core static company routes
  const baseStaticRoutes = [
    '',
    '/services',
    '/work',
    '/workflows',
    '/about',
    '/contact',
    '/start-project',
    '/blog',
    '/privacy-policy',
    '/terms',
    '/refund-policy',
  ];

  const staticRouteMaps = baseStaticRoutes.map((route) => ({
    url: `${baseUrl}${route}`,
    changeFrequency: 'weekly' as const,
    priority: route === '' ? 1.0 : 0.8,
  }));

  const locationRoutes = [
    ...ncrLocations.map((loc) => ({
      url: `${baseUrl}/laptop-on-rent/${loc.slug}`,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    })),
    ...ncrLocations.map((loc) => ({
      url: `${baseUrl}/desktop-on-rent/${loc.slug}`,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    })),
  ];

  const staticRoutes = [...staticRouteMaps, ...locationRoutes];

  // Static service routes
  const staticServiceRoutes: MetadataRoute.Sitemap = STATIC_SERVICE_SLUGS.map((slug) => ({
    url: `${baseUrl}/services/${slug}`,
    changeFrequency: 'monthly' as const,
    priority: 0.75,
  }));

  try {
    const [services, projects, blogs, seoPages] = await Promise.all([
      db.service.findMany({ where: { status: ContentStatus.PUBLISHED }, select: { slug: true, updatedAt: true } }),
      db.project.findMany({ where: { status: ContentStatus.PUBLISHED }, select: { slug: true, updatedAt: true } }),
      db.blogPost.findMany({ where: { status: ContentStatus.PUBLISHED }, select: { slug: true, updatedAt: true } }),
      db.seoLandingPage.findMany({ where: { status: 'PUBLISHED' }, select: { slug: true, updatedAt: true, internalName: true } }),
    ]);

    // DB service slugs (deduplicate against static ones)
    const staticSlugsSet = new Set(STATIC_SERVICE_SLUGS);
    const dbServiceRoutes = services
      .filter((s: { slug: string; updatedAt: Date }) => !staticSlugsSet.has(s.slug))
      .map((s: { slug: string; updatedAt: Date }) => ({
        url: `${baseUrl}/services/${s.slug}`,
        lastModified: s.updatedAt,
        changeFrequency: 'monthly' as const,
        priority: 0.75,
      }));

    const projectRoutes = projects.map((p: { slug: string; updatedAt: Date }) => ({
      url: `${baseUrl}/work/${p.slug}`,
      lastModified: p.updatedAt,
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    }));

    const blogRoutes = blogs.map((b: { slug: string; updatedAt: Date }) => ({
      url: `${baseUrl}/blog/${b.slug}`,
      lastModified: b.updatedAt,
      changeFrequency: 'weekly' as const,
      priority: 0.65,
    }));

    const seoPageRoutes: any[] = [];
    seoPages.forEach((p: { slug: string; updatedAt: Date; internalName?: string | null }) => {
      seoPageRoutes.push({
        url: `${baseUrl}/${p.slug}`,
        lastModified: p.updatedAt,
        changeFrequency: 'weekly' as const,
        priority: 0.8,
      });
    });

    const allRoutes = [
      ...staticRoutes,
      ...staticServiceRoutes,
      ...staticBlogRoutes,
      ...dbServiceRoutes,
      ...projectRoutes,
      ...blogRoutes,
      ...seoPageRoutes,
    ];
    const uniqueRoutesMap = new Map();
    allRoutes.forEach((route) => {
      uniqueRoutesMap.set(route.url, route);
    });
    return Array.from(uniqueRoutesMap.values());
  } catch {
    const allRoutes = [...staticRoutes, ...staticServiceRoutes, ...staticBlogRoutes];
    const uniqueRoutesMap = new Map();
    allRoutes.forEach((route) => {
      uniqueRoutesMap.set(route.url, route);
    });
    return Array.from(uniqueRoutesMap.values());
  }
}
