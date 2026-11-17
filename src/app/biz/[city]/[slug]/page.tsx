import React from 'react';
import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import Vendor360ClientView from '@/components/urban/Vendor360ClientView';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ city: string; slug: string }>;
}) {
  const { city, slug } = await params;
  const vendor = await db.marketplaceVendor.findFirst({
    where: {
      OR: [{ slug }, { id: slug }],
      city: city.toLowerCase(),
      status: 'ACTIVE',
    },
    select: {
      businessName: true,
      tagline: true,
      locality: true,
      city: true,
      primaryCategory: true,
    },
  });

  if (!vendor) return {};

  const title = `${vendor.businessName} in ${vendor.locality ? `${vendor.locality}, ` : ''}${vendor.city.toUpperCase()} - Rate Card, Photos & Reviews`;
  const description = `${vendor.businessName} offers ${vendor.primaryCategory} in ${vendor.city}. Check price list, scanned rate-cards, photos, opening hours and customer reviews.`;

  const canonicalUrl = `https://urban.techinpedia.com/biz/${city.toLowerCase()}/${slug}`;

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      siteName: 'Urban Marketplace',
      type: 'profile',
    },
  };
}

export default async function Vendor360Page({
  params,
}: {
  params: Promise<{ city: string; slug: string }>;
}) {
  const { city, slug } = await params;

  const vendor = await db.marketplaceVendor.findFirst({
    where: {
      OR: [{ slug }, { id: slug }],
      city: city.toLowerCase(),
      status: 'ACTIVE',
    },
    include: {
      media: {
        orderBy: { displayOrder: 'asc' },
      },
      services: {
        where: { status: 'ACTIVE' },
        orderBy: { displayOrder: 'asc' },
      },
      reviews: {
        where: { status: 'APPROVED' },
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  if (!vendor) {
    notFound();
  }

  // Parse JSON fields safely
  let categories: string[] = [];
  try {
    categories = vendor.categories ? JSON.parse(vendor.categories) : [];
  } catch {
    categories = [vendor.primaryCategory];
  }

  let openingHours: any = null;
  try {
    openingHours = vendor.openingHours ? JSON.parse(vendor.openingHours) : null;
  } catch {
    openingHours = null;
  }

  let quickInfo: any = {};
  try {
    quickInfo = vendor.quickInfo ? JSON.parse(vendor.quickInfo) : {};
  } catch {
    quickInfo = {};
  }

  // Related vendors
  const relatedVendors = await db.marketplaceVendor.findMany({
    where: {
      city: vendor.city,
      id: { not: vendor.id },
      status: 'ACTIVE',
    },
    take: 4,
    select: {
      id: true,
      businessName: true,
      slug: true,
      city: true,
      locality: true,
      phone: true,
      averageRating: true,
      ratingCount: true,
      primaryCategory: true,
    },
  });

  const serializedVendor = {
    ...vendor,
    averageRating: Number(vendor.averageRating),
    categories,
    openingHours,
    quickInfo,
    media: vendor.media.map((m) => ({
      ...m,
      createdAt: m.createdAt.toISOString(),
    })),
    services: vendor.services.map((s) => ({
      ...s,
      price: Number(s.price),
      createdAt: s.createdAt.toISOString(),
      updatedAt: s.updatedAt.toISOString(),
    })),
    reviews: vendor.reviews.map((r) => {
      let tags: string[] = [];
      try {
        tags = r.reviewTags ? JSON.parse(r.reviewTags) : [];
      } catch {
        tags = [];
      }
      return {
        ...r,
        tags,
        createdAt: r.createdAt.toISOString(),
      };
    }),
    createdAt: vendor.createdAt.toISOString(),
    updatedAt: vendor.updatedAt.toISOString(),
  };

  const serializedRelated = relatedVendors.map((rv) => ({
    ...rv,
    averageRating: Number(rv.averageRating),
  }));

  return (
    <Vendor360ClientView
      initialVendor={serializedVendor}
      initialRelatedVendors={serializedRelated}
    />
  );
}
