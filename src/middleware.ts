import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const host = (
    request.headers.get('x-forwarded-host') ||
    request.headers.get('host') ||
    ''
  ).toLowerCase();

  const isUrbanDomain =
    host.includes('urban.techinpedia.com') ||
    process.env.NEXT_PUBLIC_SITE_CODE === 'MARKETPLACE_PUBLIC';
  const isAdminDomain =
    host.includes('admin.techinpedia.com') ||
    process.env.NEXT_PUBLIC_SITE_CODE === 'ADMIN_CENTRAL';

  // Next.js dynamic metadata endpoints (sitemap.xml, robots.txt, llms.txt) pass through to route handlers
  if (pathname === '/robots.txt' || pathname === '/sitemap.xml' || pathname === '/llms.txt') {
    return NextResponse.next();
  }

  // ========================================================
  // 1. ADMIN PORTAL DOMAIN (admin.techinpedia.com)
  // ========================================================
  if (isAdminDomain) {
    // Root '/' on admin domain redirects to /admin dashboard
    if (pathname === '/') {
      return NextResponse.redirect(new URL('/admin', request.url));
    }

    // When visiting /admin/login, clear any stale auth cookie to prevent redirect loops
    if (pathname === '/admin/login') {
      const response = NextResponse.next();
      if (request.cookies.has('tip_admin_token')) {
        response.cookies.delete('tip_admin_token');
      }
      return response;
    }

    // Protect all /admin routes except /admin/login
    if (pathname.startsWith('/admin')) {
      const token = request.cookies.get('tip_admin_token')?.value;
      if (!token) {
        const loginUrl = new URL('/admin/login', request.url);
        loginUrl.searchParams.set('redirect', pathname);
        return NextResponse.redirect(loginUrl);
      }
    }

    return NextResponse.next();
  }

  // ========================================================
  // 2. URBAN MARKETPLACE DOMAIN (urban.techinpedia.com)
  // ========================================================
  if (isUrbanDomain) {
    // If admin is accessed on Urban domain, forward to dedicated admin portal
    if (pathname.startsWith('/admin')) {
      return NextResponse.redirect(`https://admin.techinpedia.com${pathname}${search}`);
    }

    // Explicit list of valid routes belonging to Urban Marketplace
    const isMarketplaceRoute =
      pathname === '/' ||
      pathname.startsWith('/category') ||
      pathname.startsWith('/biz') ||
      pathname.startsWith('/vendor') ||
      pathname.startsWith('/list-business') ||
      pathname.startsWith('/marketplace') ||
      pathname === '/privacy-policy' ||
      pathname === '/terms' ||
      pathname === '/refund-policy';

    if (!isMarketplaceRoute) {
      // TechInPedia Company Blog, Services, Hardware Rental, and Software SEO pages
      // DO NOT belong on urban.techinpedia.com.
      // Send HTTP 301 Permanent Redirect to techinpedia.com so Googlebot immediately
      // consolidates equity and removes the Urban URL from Google's search index.
      return NextResponse.redirect(`https://techinpedia.com${pathname}${search}`, 301);
    }

    return NextResponse.next();
  }

  // ========================================================
  // 3. TECHINPEDIA MAIN DOMAIN (techinpedia.com)
  // ========================================================
  // Forward /admin hits to dedicated admin domain
  if (pathname.startsWith('/admin')) {
    return NextResponse.redirect(`https://admin.techinpedia.com${pathname}${search}`);
  }

  // Forward Urban marketplace-specific routes to urban.techinpedia.com (HTTP 301)
  if (
    pathname.startsWith('/category') ||
    pathname.startsWith('/biz') ||
    pathname.startsWith('/list-business') ||
    pathname.startsWith('/vendor')
  ) {
    return NextResponse.redirect(`https://urban.techinpedia.com${pathname}${search}`, 301);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - static file extensions (svg, png, jpg, jpeg, gif, webp, ico, css, js)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|icon.png|apple-icon.png|logo.png|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js)$).*)',
  ],
};
