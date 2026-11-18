import type { Metadata } from 'next';

import './globals.css';
import { db } from '@/lib/db';
import { getGeneralWhatsAppLink } from '@/lib/whatsapp';
import PublicLayout from '@/components/PublicLayout';
import { ThemeProvider } from '@/components/ThemeProvider';
import JsonLd from '@/components/JsonLd';
import { siteConfig } from '@/config/site';

import { headers } from 'next/headers';

const defaultSiteUrl = 'https://techinpedia.com';

export async function generateMetadata(): Promise<Metadata> {
  let isUrban = process.env.NEXT_PUBLIC_SITE_CODE === 'MARKETPLACE_PUBLIC';
  try {
    const headersList = await headers();
    const host = (headersList.get('x-forwarded-host') || headersList.get('host') || '').toLowerCase();
    if (host.includes('urban.techinpedia.com')) {
      isUrban = true;
    }
  } catch {}

  if (isUrban) {
    const siteUrl = 'https://urban.techinpedia.com';
    return {
      metadataBase: new URL(siteUrl),
      title: {
        default: 'Urban | Local Discovery & B2B Marketplace in Lucknow',
        template: `%s | Urban Marketplace`,
      },
      description: 'Discover trusted local service providers, rate-cards, verified suppliers, and B2B wholesale manufacturers on Urban.',
      alternates: {
        canonical: siteUrl,
      },
      openGraph: {
        title: 'Urban | Local Discovery & B2B Marketplace',
        description: 'Discover trusted local service providers, rate-cards, and verified suppliers on Urban.',
        url: siteUrl,
        siteName: 'Urban Marketplace',
        locale: 'en_US',
        type: 'website',
      },
      robots: {
        index: true,
        follow: true,
      },
    };
  }

  try {
    const settings = await db.setting.findMany().catch(() => []);

    const map: Record<string, string> = {};
    if (Array.isArray(settings)) {
      settings.forEach((s: { key: string; value: string }) => {
        map[s.key] = s.value;
      });
    }

    const title = map.seo_default_title || 'TechInPedia | Laptop & Desktop Rental, Mobile App, Website & Software Development';
    const description = map.seo_default_description || 'TechInPedia is an IT company offering laptop & desktop rentals, mobile app development, website development, custom software, CRM, ERP and digital marketing services.';
    const siteUrl = 'https://techinpedia.com';

    return {
      metadataBase: new URL(siteUrl),
      title: {
        default: title,
        template: `%s | TechInPedia`,
      },
      description,
      alternates: {
        canonical: siteUrl,
      },
      keywords: [
        'TechInPedia',
        'Laptop Rental',
        'Computer Rental',
        'AMC Maintenance',
        'Mobile Application Development',
        'Website Development',
        'Cloud Services',
        'Brand Collaboration',
        'Content Creation For Social Media',
        'Digital Marketing Agency',
        'IT Infrastructure Rentals India',
      ],
      authors: [{ name: 'TechInPedia', url: siteUrl }],
      creator: 'TechInPedia',
      publisher: 'TechInPedia',
      openGraph: {
        title,
        description,
        url: siteUrl,
        siteName: 'TechInPedia',
        locale: 'en_US',
        type: 'website',
        images: [
          {
            url: `${siteUrl}/logo.png`,
            width: 1200,
            height: 630,
            alt: 'TechInPedia - Hardware, Software & Digital Marketing',
          },
        ],
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        images: [`${siteUrl}/logo.png`],
      },
      icons: {
        icon: [
          { url: '/favicon.png', type: 'image/png' },
          { url: '/logo.png', type: 'image/png' },
          { url: '/favicon.ico' },
        ],
        shortcut: '/favicon.png',
        apple: '/favicon.png',
      },
      verification: {
        google: 'gUeg7FqbFNp7Pc7Ee7uhCEqru0wRg2phSW2K83U7Fcc',
      },
      robots: {
        index: true,
        follow: true,
        googleBot: {
          index: true,
          follow: true,
          'max-video-preview': -1,
          'max-image-preview': 'large',
          'max-snippet': -1,
        },
      },
    };
  } catch {
    return {
      metadataBase: new URL(defaultSiteUrl),
      title: 'TechInPedia | Laptop & Desktop Rental, Mobile App, Website & Software Development',
      description: 'TechInPedia is an IT company offering laptop & desktop rentals, mobile app development, website development, custom software, CRM, ERP and digital marketing services.',
    };
  }
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let isUrban = process.env.NEXT_PUBLIC_SITE_CODE === 'MARKETPLACE_PUBLIC';
  try {
    const headersList = await headers();
    const host = (headersList.get('x-forwarded-host') || headersList.get('host') || '').toLowerCase();
    if (host.includes('urban.techinpedia.com')) {
      isUrban = true;
    }
  } catch {}

  let settingsMap: Record<string, string> = {};
  let waLink = 'https://wa.me/919876543210';
  let seoPages: Array<{ id: string; title: string; slug: string }> = [];

  try {
    const [settings, seoLandingPages] = await Promise.all([
      db.setting.findMany().catch(() => []),
      db.seoLandingPage.findMany({
        where: { status: 'PUBLISHED' },
        select: { id: true, title: true, slug: true },
        orderBy: { createdAt: 'desc' },
        take: 60,
      }).catch(() => []),
    ]);

    if (Array.isArray(settings)) {
      settings.forEach((s: { key: string; value: string }) => {
        settingsMap[s.key] = s.value;
      });
    }
    if (Array.isArray(seoLandingPages)) {
      seoPages = seoLandingPages;
    }
    waLink = (await getGeneralWhatsAppLink().catch(() => 'https://wa.me/919876543210')) || 'https://wa.me/919876543210';
  } catch {
    // DB fallback
  }

  const siteUrl = isUrban ? 'https://urban.techinpedia.com' : 'https://techinpedia.com';

  const orgSchema = isUrban
    ? {
        '@context': 'https://schema.org',
        '@graph': [
          {
            '@type': 'Organization',
            '@id': `${siteUrl}/#organization`,
            name: 'Urban Marketplace',
            url: siteUrl,
            description: 'Urban Marketplace — Local discovery and B2B marketplace platform in Lucknow.',
          },
          {
            '@type': 'WebSite',
            '@id': `${siteUrl}/#website`,
            url: siteUrl,
            name: 'Urban Marketplace',
          },
        ],
      }
    : {
        '@context': 'https://schema.org',
        '@graph': [
      {
        '@type': 'Organization',
        '@id': `${siteUrl}/#organization`,
        name: 'TechInPedia',
        legalName: 'TechInPedia',
        alternateName: ['techinpedia', 'Tech In Pedia', 'Techinpedia', 'techinpedia.com'],
        disambiguatingDescription: 'TechInPedia is an Indian technology company providing enterprise IT hardware rentals (laptops, desktops, MacBooks), custom software engineering, ERP solutions, and digital marketing. Distinct from MS Motorservice Technipedia.',
        url: siteUrl,
        logo: {
          '@type': 'ImageObject',
          url: siteConfig.logo,
          width: 200,
          height: 60,
        },
        image: siteConfig.logo,
        description: 'TechInPedia is India\'s trusted technology company offering enterprise hardware rentals, custom software development, and digital marketing services.',
        foundingDate: '2020',
        areaServed: ['Delhi', 'Noida', 'Gurgaon', 'Faridabad', 'Ghaziabad', 'Delhi NCR', 'India'],
        knowsAbout: [
          'Corporate Laptop Rental',
          'MacBook Rental',
          'Desktop Rental',
          'Custom Software Development',
          'Mobile App Development',
          'ERP Software Development',
          'CRM Solutions',
          'IT Infrastructure Maintenance (AMC)',
          'Digital Marketing Agency',
        ],
        sameAs: [
          'https://linkedin.com/company/techinpedia',
          'https://www.linkedin.com/in/himanshu-arora-824133409/',
          'https://github.com/techinpedia',
          'https://x.com/techinpedia',
          'https://twitter.com/techinpedia',
          'https://www.instagram.com/techinpedia/',
          'https://www.facebook.com/people/Techinpedia/61585484607333/',
          'https://www.youtube.com/@Techinpediaofficial',
        ],
        contactPoint: {
          '@type': 'ContactPoint',
          ...(settingsMap.company_phone ? { telephone: settingsMap.company_phone } : {}),
          contactType: 'customer service',
          email: settingsMap.company_email || siteConfig.email,
          areaServed: ['IN'],
          availableLanguage: ['English', 'Hindi'],
        },
        address: {
          '@type': 'PostalAddress',
          addressLocality: 'Delhi',
          addressRegion: 'Delhi NCR',
          addressCountry: 'IN',
        },
      },
      {
        '@type': 'Brand',
        '@id': `${siteUrl}/#brand`,
        name: 'TechInPedia',
        alternateName: ['techinpedia', 'Tech In Pedia'],
        url: siteUrl,
        logo: siteConfig.logo,
        description: 'TechInPedia — Enterprise IT hardware rentals and custom software engineering.',
      },
      {
        '@type': 'WebSite',
        '@id': `${siteUrl}/#website`,
        url: siteUrl,
        name: 'TechInPedia',
        alternateName: ['techinpedia', 'techinpedia.com', 'Tech In Pedia'],
        description: 'TechInPedia — Enterprise hardware rentals, custom software & digital marketing in India.',
        publisher: { '@id': `${siteUrl}/#organization` },
        inLanguage: 'en-US',
        // Google Sitelinks Searchbox — key signal for brand search recognition
        potentialAction: {
          '@type': 'SearchAction',
          target: {
            '@type': 'EntryPoint',
            urlTemplate: `${siteUrl}/services?q={search_term_string}`,
          },
          'query-input': 'required name=search_term_string',
        },
      },
      {
        '@type': ['LocalBusiness', 'ProfessionalService'],
        '@id': `${siteUrl}/#localbusiness`,
        name: 'TechInPedia - Laptop, Desktop & Computer Rental Delhi NCR',
        alternateName: ['TechInPedia Laptop Rental', 'TechInPedia Computer Rentals', 'TechInPedia Rentals'],
        url: `${siteUrl}/services/laptop-rental`,
        logo: siteConfig.logo,
        image: `${siteUrl}/logo.png`,
        description: 'Leading provider of commercial laptop rentals, desktop computer hiring, Apple MacBook leasing, and IT hardware on rent near you across Noida, Gurgaon, Delhi, and Manesar.',
        priceRange: '₹1,499 - ₹8,500/month',
        currenciesAccepted: 'INR',
        paymentAccepted: 'Cash, Credit Card, Bank Transfer, UPI, GST Invoice',
        telephone: settingsMap.company_phone || '+91-9876543210',
        email: settingsMap.company_email || siteConfig.email,
        address: {
          '@type': 'PostalAddress',
          addressLocality: 'Delhi NCR',
          addressRegion: 'Delhi',
          addressCountry: 'IN',
        },
        geo: {
          '@type': 'GeoCoordinates',
          latitude: 28.5355,
          longitude: 77.3910,
        },
        openingHoursSpecification: [
          {
            '@type': 'OpeningHoursSpecification',
            dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
            opens: '09:00',
            closes: '20:00',
          },
        ],
        areaServed: [
          'Noida', 'Sector 62 Noida', 'Sector 18 Noida', 'Sector 125 Noida', 'Sector 135 Noida', 'Noida Expressway', 'Greater Noida', 'Greater Noida West',
          'Gurgaon', 'DLF Cyber City', 'CyberHub Gurgaon', 'Udyog Vihar', 'Golf Course Road', 'Sohna Road', 'Manesar', 'IMT Manesar',
          'Delhi', 'Nehru Place', 'Okhla', 'Connaught Place', 'Saket', 'Dwarka', 'Janakpuri', 'Netaji Subhash Place', 'Rohini',
          'Ghaziabad', 'Indirapuram', 'Faridabad', 'Delhi NCR'
        ],
        hasOfferCatalog: {
          '@type': 'OfferCatalog',
          name: 'IT Hardware & Laptop Rental Services',
          itemListElement: [
            {
              '@type': 'Offer',
              itemOffered: {
                '@type': 'Service',
                name: 'Laptop on Rent Near Me',
                description: 'Doorstep rental of Intel Core i5/i7 & AMD laptops with 24-hr delivery in Noida, Gurgaon, and Delhi.',
                url: `${siteUrl}/services/laptop-rental`,
              },
            },
            {
              '@type': 'Offer',
              itemOffered: {
                '@type': 'Service',
                name: 'Corporate Bulk Laptop Rental',
                description: 'Bulk enterprise laptop leasing for startups, MNCs, and BPO operations with buffer units and AMC.',
                url: `${siteUrl}/corporate-laptop-rental`,
              },
            },
            {
              '@type': 'Offer',
              itemOffered: {
                '@type': 'Service',
                name: 'Computer & Desktop on Rent',
                description: 'Desktop towers, Core i7/i9 workstations, multimonitor PCs for office and engineering teams.',
                url: `${siteUrl}/services/computer-rental`,
              },
            },
            {
              '@type': 'Offer',
              itemOffered: {
                '@type': 'Service',
                name: 'MacBook on Rent (M-Series Silicon)',
                description: 'Apple MacBook Air and Pro rentals for iOS developers, creative agencies, and video editors.',
                url: `${siteUrl}/services/macbook-rental`,
              },
            },
          ],
        },
      },
    ]
  };

  return (
    <html lang="en" className="scroll-smooth font-sans" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var p = window.location.pathname || '';
                  if (p.indexOf('/admin') === 0) {
                    var t = localStorage.getItem('theme');
                    var d = window.matchMedia('(prefers-color-scheme: dark)').matches;
                    if (t === 'dark' || ((!t || t === 'system') && d)) {
                      document.documentElement.classList.add('dark');
                      document.documentElement.classList.remove('light');
                      document.documentElement.style.colorScheme = 'dark';
                      return;
                    }
                  }
                  document.documentElement.classList.remove('dark');
                  document.documentElement.classList.add('light');
                  document.documentElement.style.colorScheme = 'light';
                } catch (e) {}
              })();
            `,
          }}
        />
        
        <link rel="shortcut icon" href="/favicon.ico" />
        <link rel="icon" href="/icon.png" type="image/png" />
        <link rel="icon" href="/logo.png" type="image/png" />
        <link rel="apple-touch-icon" href="/apple-icon.png" />
        <JsonLd data={orgSchema} />
        {/* Google Analytics */}
        <script async src="https://www.googletagmanager.com/gtag/js?id=G-X5J0BRM1KK" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'G-X5J0BRM1KK');
            `,
          }}
        />
      </head>
      <body className="font-sans bg-[#faf8ff] text-slate-800 antialiased selection:bg-violet-600 selection:text-white min-h-screen flex flex-col">
        <ThemeProvider>
          <PublicLayout settingsMap={settingsMap} waLink={waLink} seoPages={seoPages}>
            {children}
          </PublicLayout>
        </ThemeProvider>
      </body>
    </html>
  );
}
