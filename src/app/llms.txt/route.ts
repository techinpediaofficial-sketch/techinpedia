import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const host = (
    request.headers.get('x-forwarded-host') ||
    request.headers.get('host') ||
    ''
  ).toLowerCase();

  const isUrban =
    host.includes('urban.techinpedia.com') ||
    process.env.NEXT_PUBLIC_SITE_CODE === 'MARKETPLACE_PUBLIC' ||
    process.env.NEXT_PUBLIC_SITE_URL?.includes('urban');

  if (isUrban) {
    const urbanContent = `# Urban by TechInPedia (Local Services & Vendor Discovery Marketplace)
> Marketplace Website: https://urban.techinpedia.com
> Business Unit: MARKETPLACE
> Region: Lucknow & Uttar Pradesh, India

Urban by TechInPedia is a localized business discovery platform connecting residential and commercial consumers with verified local service providers, contractors, and trade specialists across Lucknow and Uttar Pradesh.

## Marketplace Features
- **Local Service Directory**: Browse and compare verified service professionals across AC repair, electricians, plumbers, home cleaning, packers & movers, and automotive care.
- **Transparent Rate-Cards**: Inspect scanned rate-cards, upfront inspection charges, and itemized service pricing.
- **Verified Business Profiles**: Comprehensive 360° business listings with photo galleries, verified owner credentials, ratings, and customer reviews.
- **Direct Contact CTAs**: Connect immediately via 1-tap WhatsApp consultation or phone call without middleman booking commissions.
- **Vendor Hub**: Local business owners can register at https://urban.techinpedia.com/list-business to receive targeted buyer leads and manage customer requirements.

## Key Marketplace URLs
- Marketplace Home: https://urban.techinpedia.com
- List Your Business: https://urban.techinpedia.com/list-business
- Vendor Hub: https://urban.techinpedia.com/vendor
- Privacy Policy: https://urban.techinpedia.com/privacy-policy
- Terms of Service: https://urban.techinpedia.com/terms
- Refund Policy: https://urban.techinpedia.com/refund-policy
`;
    return new NextResponse(urbanContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'public, max-age=3600, s-maxage=3600',
      },
    });
  }

  const mainContent = `# TechInPedia (Enterprise IT, Hardware Rentals & Software Engineering)
> Primary Website: https://techinpedia.com
> Business Unit: COMPANY_SERVICES
> Headquarters: Delhi NCR, India

TechInPedia is an enterprise technology solutions provider delivering high-performance IT hardware rentals, custom software engineering, and digital marketing services to startups, corporate enterprises, and high-growth businesses across India.

## Core Enterprise Services

### 1. IT Hardware & Equipment Rentals (Delhi NCR & Pan-India)
- **Laptop on Rent**: High-performance Apple MacBooks (M2/M3/M4 Pro & Max), Lenovo ThinkPads, Dell Latitudes, and HP EliteBooks for developers, designers, and corporate teams with flexible tenures and 4-hour doorstep hardware replacement SLAs.
- **Desktop & Computer Rental**: Enterprise desktop workstations, Core i7/i9 and AMD Ryzen towers, multimonitor setups, and bulk office deployments.
- **MacBook Rental**: Dedicated Apple Silicon rental fleets for creative agencies, iOS developers, and video production sprints.
- **AMC Maintenance**: Comprehensive Annual Maintenance Contracts covering corporate IT infrastructure, preventive diagnosis, network maintenance, and emergency on-site engineer support.

### 2. Software Engineering & Digital Solutions
- **Website Development**: Enterprise web applications engineered with Next.js, React, Node.js, and TypeScript, optimized for high Core Web Vitals and low latency.
- **Mobile Application Development**: Native and cross-platform mobile apps for iOS and Android built on Flutter and React Native.
- **Custom Software Development**: Bespoke business operating systems, client portals, and automated workflow engines tailored to proprietary business models.
- **CRM & ERP Solutions**: Centralized business management platforms unifying lead triage, pipeline stages, automated WhatsApp communications, invoicing, and workforce attendance.
- **Cloud & IT Services**: Cloud infrastructure management, AWS/GCP deployments, microservice orchestrations, and database performance tuning.
- **Digital Marketing**: Data-driven performance marketing across Google PPC, Meta Ads, Technical SEO, and Conversion Rate Optimization.

## Key URLs & Resources
- Website: https://techinpedia.com
- Services Catalog: https://techinpedia.com/services
- Laptop Rentals: https://techinpedia.com/services/laptop-rental
- Desktop Rentals: https://techinpedia.com/services/computer-rental
- MacBook Rentals: https://techinpedia.com/services/macbook-rental
- AMC Maintenance: https://techinpedia.com/services/amc-maintenance
- Custom Software: https://techinpedia.com/services/custom-software-development
- CRM/ERP Solutions: https://techinpedia.com/services/crm-erp-solutions
- Mobile Apps: https://techinpedia.com/services/mobile-application
- Web Development: https://techinpedia.com/services/website-development
- Cloud & IT Services: https://techinpedia.com/services/cloud-services
- Digital Marketing: https://techinpedia.com/services/digital-marketing
- Company Blog: https://techinpedia.com/blog
- Contact & Quotes: https://techinpedia.com/contact

## Service Coverage
- Primary Metro Coverage: New Delhi, Noida, Greater Noida, Gurgaon (Gurugram), Faridabad, and Ghaziabad.
- Pan-India Corporate Deployments available for enterprise bulk rental orders (5 to 500+ systems).
`;

  return new NextResponse(mainContent, {
    status: 200,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  });
}
