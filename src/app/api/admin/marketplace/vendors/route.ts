import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { requirePermission } from '@/lib/permissions';
import { handleApiAuthError } from '@/lib/auth-errors';

export async function GET(request: Request) {
  try {
    const session = await requireAuth();
    requirePermission(session, 'crm.companies.manage');

    const url = new URL(request.url);
    const search = url.searchParams.get('search') || '';
    const kycStatus = url.searchParams.get('kycStatus') || '';
    const city = url.searchParams.get('city') || '';

    // 1. Fetch full 360 marketplace vendors
    const vendorWhere: any = {};
    if (kycStatus) {
      vendorWhere.kycStatus = kycStatus;
    }
    if (city) {
      vendorWhere.city = { contains: city };
    }
    if (search.trim()) {
      vendorWhere.OR = [
        { businessName: { contains: search } },
        { ownerName: { contains: search } },
        { phone: { contains: search } },
        { city: { contains: search } },
        { primaryCategory: { contains: search } },
        { locality: { contains: search } },
      ];
    }

    const fullVendors = await db.marketplaceVendor.findMany({
      where: vendorWhere,
      orderBy: [{ isFeatured: 'desc' }, { averageRating: 'desc' }, { createdAt: 'desc' }],
      include: {
        _count: {
          select: {
            media: true,
            services: true,
            reviews: true,
          },
        },
      },
    });

    const parsedFullVendors = fullVendors.map((v) => {
      let categories: string[] = [];
      try {
        categories = v.categories ? JSON.parse(v.categories) : [];
      } catch {
        categories = v.primaryCategory ? [v.primaryCategory] : [];
      }

      return {
        id: v.id,
        isFullProfile: true,
        slug: v.slug,
        businessName: v.businessName,
        tagline: v.tagline,
        ownerName: v.ownerName || 'Business Owner',
        phone: v.phone,
        whatsappNumber: v.whatsappNumber,
        email: v.email || '',
        city: v.city,
        locality: v.locality,
        address: v.address,
        businessType: v.businessType,
        primaryCategory: v.primaryCategory,
        categories,
        tier: v.membershipTier,
        leadCredits: v.leadCredits,
        gstin: v.gstin,
        status: v.status,
        kycStatus: v.kycStatus,
        isClaimed: v.isClaimed,
        isVerified: v.isVerified,
        isFeatured: v.isFeatured,
        averageRating: Number(v.averageRating),
        ratingCount: v.ratingCount,
        reviewCount: v.reviewCount,
        mediaCount: v._count.media,
        servicesCount: v._count.services,
        reviewsCount: v._count.reviews,
        createdAt: v.createdAt,
      };
    });

    // 2. Fetch pending onboarding inquiries from Enquiry table (if no full profile exists for them)
    const existingPhones = new Set(fullVendors.map((fv) => fv.phone.replace(/[^0-9]/g, '')));
    const onboardingInquiries = await db.enquiry.findMany({
      where: {
        OR: [
          { projectType: 'VENDOR_ONBOARDING' },
          { source: 'Urban Vendor Onboarding' },
        ],
      },
      orderBy: { createdAt: 'desc' },
      include: {
        notes: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    const parsedInquiries = onboardingInquiries
      .filter((inq) => {
        const cleanPhone = (inq.phone || '').replace(/[^0-9]/g, '');
        return !existingPhones.has(cleanPhone);
      })
      .map((inq) => {
        const lines = inq.message ? inq.message.split('\n') : [];
        let gstin = '';
        let businessType = 'SERVICE_PROVIDER';
        let categories: string[] = inq.service ? [inq.service] : ['General Utility'];
        let tier = inq.budget || 'STARTER';

        lines.forEach((line) => {
          if (line.startsWith('GSTIN:')) gstin = line.replace('GSTIN:', '').trim();
          if (line.startsWith('Type:')) businessType = line.replace('Type:', '').trim();
          if (line.startsWith('Categories:')) {
            categories = line.replace('Categories:', '').split(',').map((c) => c.trim()).filter(Boolean);
          }
          if (line.startsWith('Selected Plan:')) tier = line.replace('Selected Plan:', '').trim();
        });

        const isVerified = inq.status === 'WON' || inq.status === 'QUALIFIED';
        const isRejected = inq.status === 'LOST';

        return {
          id: inq.id,
          isFullProfile: false,
          slug: '',
          businessName: inq.company || inq.name,
          tagline: inq.service || 'Service Partner',
          ownerName: inq.name,
          phone: inq.phone,
          whatsappNumber: inq.phone,
          email: inq.email,
          city: inq.city || 'Delhi NCR',
          locality: '',
          address: inq.address,
          businessType,
          primaryCategory: categories[0] || 'Services',
          categories,
          tier,
          leadCredits: 10,
          gstin,
          status: inq.status,
          kycStatus: isVerified ? 'VERIFIED' : isRejected ? 'REJECTED' : 'PENDING',
          isClaimed: false,
          isVerified,
          isFeatured: false,
          averageRating: 4.5,
          ratingCount: 0,
          reviewCount: 0,
          mediaCount: 0,
          servicesCount: 0,
          reviewsCount: 0,
          notesCount: inq.notes.length,
          createdAt: inq.createdAt,
        };
      });

    // Merge full 360 profiles first, then pending inquiries
    const allVendors = [...parsedFullVendors, ...parsedInquiries];

    return NextResponse.json({
      success: true,
      total: allVendors.length,
      fullProfileCount: parsedFullVendors.length,
      vendors: allVendors,
    });
  } catch (error: any) {
    const authResponse = handleApiAuthError(error);
    if (authResponse) return authResponse;
    console.error('Marketplace vendors GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch marketplace vendors.' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireAuth();
    requirePermission(session, 'crm.companies.manage');

    const body = await request.json();
    const {
      businessName,
      slug: customSlug,
      ownerName,
      phone,
      whatsappNumber,
      email,
      website,
      tagline,
      description,
      address,
      locality,
      city,
      state,
      pincode,
      establishmentYear,
      businessType,
      primaryCategory,
      categories,
      openingHours,
      quickInfo,
      gstin,
      kycStatus,
      membershipTier,
      leadCredits,
      isClaimed,
      isVerified,
      isFeatured,
      enquiryId,
    } = body;

    if (!businessName || !phone) {
      return NextResponse.json(
        { error: 'Business Name and Phone number are required.' },
        { status: 400 }
      );
    }

    // Generate unique slug
    let baseSlug = (customSlug || businessName)
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    if (!baseSlug) baseSlug = `vendor-${Date.now()}`;

    // Ensure uniqueness
    let finalSlug = baseSlug;
    let counter = 1;
    while (await db.marketplaceVendor.findUnique({ where: { slug: finalSlug } })) {
      finalSlug = `${baseSlug}-${counter++}`;
    }

    const newVendor = await db.marketplaceVendor.create({
      data: {
        businessName,
        slug: finalSlug,
        tagline: tagline || null,
        description: description || null,
        ownerName: ownerName || null,
        phone,
        whatsappNumber: whatsappNumber || phone,
        email: email || null,
        website: website || null,
        address: address || null,
        locality: locality || null,
        city: (city || 'delhi ncr').toLowerCase(),
        state: state || 'Delhi',
        pincode: pincode || null,
        establishmentYear: establishmentYear ? parseInt(establishmentYear, 10) : 2020,
        businessType: businessType || 'SERVICE_PROVIDER',
        primaryCategory: primaryCategory || 'AC Repair & Services',
        categories: categories ? (typeof categories === 'string' ? categories : JSON.stringify(categories)) : JSON.stringify([primaryCategory || 'AC Repair & Services']),
        openingHours: openingHours ? (typeof openingHours === 'string' ? openingHours : JSON.stringify(openingHours)) : null,
        quickInfo: quickInfo ? (typeof quickInfo === 'string' ? quickInfo : JSON.stringify(quickInfo)) : null,
        gstin: gstin || null,
        kycStatus: kycStatus || 'PENDING',
        membershipTier: membershipTier || 'STARTER',
        leadCredits: leadCredits !== undefined ? parseInt(leadCredits, 10) : 10,
        isClaimed: isClaimed !== undefined ? isClaimed : true,
        isVerified: isVerified !== undefined ? isVerified : false,
        isFeatured: isFeatured !== undefined ? isFeatured : false,
        enquiryId: enquiryId || null,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Vendor created successfully',
      vendor: newVendor,
    });
  } catch (error: any) {
    const authResponse = handleApiAuthError(error);
    if (authResponse) return authResponse;
    console.error('Marketplace vendor POST error:', error);
    return NextResponse.json({ error: error.message || 'Failed to create vendor.' }, { status: 500 });
  }
}
