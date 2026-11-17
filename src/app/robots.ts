import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const isUrban =
    process.env.NEXT_PUBLIC_SITE_CODE === 'MARKETPLACE_PUBLIC' ||
    process.env.NEXT_PUBLIC_SITE_URL?.includes('urban');

  const baseUrl = isUrban ? 'https://urban.techinpedia.com' : 'https://techinpedia.com';

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin/', '/api/'],
      },
      {
        userAgent: ['Googlebot', 'Bingbot', 'OAI-SearchBot', 'PerplexityBot', 'ChatGPT-User'],
        allow: '/',
        disallow: ['/admin/', '/api/'],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
