import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { requirePermission } from '@/lib/permissions';
import { handleApiAuthError } from '@/lib/auth-errors';
import { recordLeadTimelineEvent } from '@/lib/crm';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth();
    requirePermission(session, 'crm.companies.manage');

    const { id } = await params;

    // Check if it's a first-class MarketplaceVendor
    let vendor = await db.marketplaceVendor.findUnique({
      where: { id },
      include: {
        media: {
          orderBy: { displayOrder: 'asc' },
        },
        services: {
          orderBy: { displayOrder: 'asc' },
        },
        reviews: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!vendor) {
      // Check if it's an Enquiry ID (pending onboarding)
      const enquiry = await db.enquiry.findUnique({
        where: { id },
        include: { notes: { orderBy: { createdAt: 'desc' } } },
      });

      if (!enquiry) {
        return NextResponse.json({ error: 'Vendor not found' }, { status: 404 });
      }

      return NextResponse.json({
        success: true,
        isFullProfile: false,
        enquiry,
      });
    }

    return NextResponse.json({
      success: true,
      isFullProfile: true,
      vendor: {
        ...vendor,
        averageRating: Number(vendor.averageRating),
        categories: vendor.categories ? JSON.parse(vendor.categories) : [],
        openingHours: vendor.openingHours ? JSON.parse(vendor.openingHours) : null,
        quickInfo: vendor.quickInfo ? JSON.parse(vendor.quickInfo) : null,
      },
    });
  } catch (error: any) {
    const authResponse = handleApiAuthError(error);
    if (authResponse) return authResponse;
    console.error('Marketplace vendor GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch vendor.' }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth();
    requirePermission(session, 'crm.companies.manage');

    const { id } = await params;
    const body = await request.json();

    const {
      businessName,
      slug,
      tagline,
      description,
      logoUrl,
      coverImageUrl,
      ownerName,
      phone,
      whatsappNumber,
      email,
      website,
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
      status,
    } = body;

    const updated = await db.marketplaceVendor.update({
      where: { id },
      data: {
        businessName,
        slug,
        tagline: tagline || null,
        description: description || null,
        logoUrl: logoUrl || null,
        coverImageUrl: coverImageUrl || null,
        ownerName: ownerName || null,
        phone,
        whatsappNumber: whatsappNumber || null,
        email: email || null,
        website: website || null,
        address: address || null,
        locality: locality || null,
        city: city ? city.toLowerCase() : undefined,
        state: state || null,
        pincode: pincode || null,
        establishmentYear: establishmentYear ? parseInt(establishmentYear, 10) : undefined,
        businessType: businessType || undefined,
        primaryCategory: primaryCategory || undefined,
        categories: categories ? (typeof categories === 'string' ? categories : JSON.stringify(categories)) : undefined,
        openingHours: openingHours ? (typeof openingHours === 'string' ? openingHours : JSON.stringify(openingHours)) : undefined,
        quickInfo: quickInfo ? (typeof quickInfo === 'string' ? quickInfo : JSON.stringify(quickInfo)) : undefined,
        gstin: gstin || null,
        kycStatus: kycStatus || undefined,
        membershipTier: membershipTier || undefined,
        leadCredits: leadCredits !== undefined ? parseInt(leadCredits, 10) : undefined,
        isClaimed: isClaimed !== undefined ? isClaimed : undefined,
        isVerified: isVerified !== undefined ? isVerified : undefined,
        isFeatured: isFeatured !== undefined ? isFeatured : undefined,
        status: status || undefined,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Vendor 360 profile updated successfully',
      vendor: updated,
    });
  } catch (error: any) {
    const authResponse = handleApiAuthError(error);
    if (authResponse) return authResponse;
    console.error('Marketplace vendor PUT error:', error);
    return NextResponse.json({ error: error.message || 'Failed to update vendor.' }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth();
    requirePermission(session, 'crm.companies.manage');

    const { id } = await params;
    const body = await request.json();
    const { kycStatus, tier, addedCredits, isVerified, isFeatured, note } = body;

    // Check if it's a MarketplaceVendor or Enquiry
    const mv = await db.marketplaceVendor.findUnique({ where: { id } });

    if (mv) {
      const updateData: any = {};
      if (kycStatus) {
        updateData.kycStatus = kycStatus;
        if (kycStatus === 'VERIFIED') updateData.isVerified = true;
      }
      if (tier) updateData.membershipTier = tier;
      if (addedCredits) updateData.leadCredits = { increment: parseInt(addedCredits, 10) };
      if (isVerified !== undefined) updateData.isVerified = isVerified;
      if (isFeatured !== undefined) updateData.isFeatured = isFeatured;

      const updated = await db.marketplaceVendor.update({
        where: { id },
        data: updateData,
      });

      return NextResponse.json({
        success: true,
        message: 'Vendor updated successfully',
        vendor: updated,
      });
    }

    // Fallback: Enquiry table
    const enquiry = await db.enquiry.findUnique({ where: { id } });
    if (enquiry) {
      const updateData: any = {};
      if (kycStatus === 'VERIFIED') updateData.status = 'QUALIFIED';
      else if (kycStatus === 'REJECTED') updateData.status = 'LOST';
      else if (kycStatus === 'PENDING') updateData.status = 'NEW';
      if (tier) updateData.budget = tier;

      const updated = await db.enquiry.update({
        where: { id },
        data: updateData,
      });

      const actionDetails = [
        kycStatus ? `KYC Status set to ${kycStatus}` : null,
        tier ? `Plan Tier updated to ${tier}` : null,
        addedCredits ? `Added +${addedCredits} lead credits` : null,
        note ? `Note: ${note}` : null,
      ].filter(Boolean).join(' • ');

      if (actionDetails) {
        await db.enquiryNote.create({
          data: {
            enquiryId: id,
            userId: session.userId,
            note: `[URBAN VENDOR KYC] ${actionDetails}`,
          },
        });
      }

      return NextResponse.json({
        success: true,
        message: 'Enquiry updated successfully',
        vendor: updated,
      });
    }

    return NextResponse.json({ error: 'Vendor not found' }, { status: 404 });
  } catch (error: any) {
    const authResponse = handleApiAuthError(error);
    if (authResponse) return authResponse;
    console.error('Marketplace vendor PATCH error:', error);
    return NextResponse.json({ error: 'Failed to patch vendor.' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth();
    requirePermission(session, 'crm.companies.manage');

    const { id } = await params;
    await db.marketplaceVendor.delete({ where: { id } });

    return NextResponse.json({
      success: true,
      message: 'Vendor deleted successfully',
    });
  } catch (error: any) {
    const authResponse = handleApiAuthError(error);
    if (authResponse) return authResponse;
    console.error('Marketplace vendor DELETE error:', error);
    return NextResponse.json({ error: 'Failed to delete vendor.' }, { status: 500 });
  }
}
