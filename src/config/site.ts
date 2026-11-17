export interface SiteBrandConfig {
  siteCode: string;
  businessUnitCode: string;
  domain: string;
  baseUrl: string;
  brandName: string;
  companyName: string;
  logo: string;
  description: string;
  email: string;
  phone?: string;
  country: string;
  serviceAreas: string[];
  socialProfiles: {
    linkedin?: string;
    instagram?: string;
    facebook?: string;
    youtube?: string;
  };
}

export const SITES_CONFIG: Record<'MAIN' | 'URBAN' | 'ADMIN', SiteBrandConfig> = {
  MAIN: {
    siteCode: 'COMPANY_PUBLIC',
    businessUnitCode: 'COMPANY_SERVICES',
    domain: 'techinpedia.com',
    baseUrl: 'https://techinpedia.com',
    brandName: 'TechInPedia',
    companyName: 'TechInPedia',
    logo: 'https://techinpedia.com/logo.png',
    description: 'TechInPedia provides enterprise hardware rentals, custom software engineering, and digital marketing services.',
    email: 'contact@techinpedia.com',
    phone: '',
    country: 'India',
    serviceAreas: ['Delhi', 'Noida', 'Gurgaon', 'Faridabad', 'Ghaziabad', 'Delhi NCR', 'India'],
    socialProfiles: {
      linkedin: 'https://www.linkedin.com/in/himanshu-arora-824133409/',
      instagram: 'https://www.instagram.com/techinpedia/',
      facebook: 'https://www.facebook.com/people/Techinpedia/61585484607333/',
      youtube: 'https://www.youtube.com/@Techinpediaofficial',
    },
  },
  URBAN: {
    siteCode: 'MARKETPLACE_PUBLIC',
    businessUnitCode: 'MARKETPLACE',
    domain: 'urban.techinpedia.com',
    baseUrl: 'https://urban.techinpedia.com',
    brandName: 'Urban by TechInPedia',
    companyName: 'Urban Marketplace',
    logo: 'https://urban.techinpedia.com/logo.png',
    description: 'Discover verified local businesses, compare service rate-cards, and connect directly with trusted local service professionals.',
    email: 'contact@techinpedia.com',
    phone: '',
    country: 'India',
    serviceAreas: ['Lucknow', 'Uttar Pradesh', 'India'],
    socialProfiles: {
      instagram: 'https://www.instagram.com/techinpedia/',
    },
  },
  ADMIN: {
    siteCode: 'INTERNAL_PORTAL',
    businessUnitCode: 'CENTRAL',
    domain: 'admin.techinpedia.com',
    baseUrl: 'https://admin.techinpedia.com',
    brandName: 'TechInPedia Central Admin',
    companyName: 'TechInPedia Operations Hub',
    logo: 'https://techinpedia.com/logo.png',
    description: 'Central operations, CRM, HRM, AI, and workflow management for TechInPedia.',
    email: 'admin@techinpedia.com',
    country: 'India',
    serviceAreas: ['Internal Operations'],
    socialProfiles: {},
  },
};

/**
 * Reusable resolver that maps a hostname or site code to the authoritative site configuration.
 * Defaults deterministically to TechInPedia Main if unspecified.
 */
export function resolveSiteConfig(identifier?: string | null): SiteBrandConfig {
  if (!identifier) {
    const envCode = process.env.NEXT_PUBLIC_SITE_CODE;
    const envUrl = process.env.NEXT_PUBLIC_SITE_URL;
    if (envCode === 'MARKETPLACE_PUBLIC' || envUrl?.includes('urban')) {
      return SITES_CONFIG.URBAN;
    }
    return SITES_CONFIG.MAIN;
  }

  const idLower = identifier.toLowerCase().trim();
  if (idLower.includes('urban') || idLower === 'marketplace_public') {
    return SITES_CONFIG.URBAN;
  }
  if (idLower.includes('admin') || idLower === 'internal_portal') {
    return SITES_CONFIG.ADMIN;
  }
  return SITES_CONFIG.MAIN;
}

/**
 * Backward-compatible siteConfig object for TechInPedia Main
 */
export const siteConfig = {
  brandName: SITES_CONFIG.MAIN.brandName,
  companyName: SITES_CONFIG.MAIN.companyName,
  website: SITES_CONFIG.MAIN.baseUrl,
  logo: SITES_CONFIG.MAIN.logo,
  description: SITES_CONFIG.MAIN.description,
  email: SITES_CONFIG.MAIN.email,
  phone: SITES_CONFIG.MAIN.phone || '',
  address: {
    country: SITES_CONFIG.MAIN.country,
  },
  serviceAreas: SITES_CONFIG.MAIN.serviceAreas,
  socialProfiles: SITES_CONFIG.MAIN.socialProfiles,
  services: {
    hardwareRental: ['Laptop Rental', 'Desktop Rental', 'MacBook Rental', 'Workstation Rental', 'Bulk IT Deployment'],
    softwareDevelopment: ['Custom Software Development', 'Mobile App Development', 'Website Development', 'CRM Development', 'ERP Development'],
    digitalMarketing: ['SEO', 'Social Media Marketing', 'Performance Marketing'],
    itServices: ['AMC Maintenance', 'IT Support', 'Cloud Infrastructure'],
  },
};
