import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthSession, requireAuth } from '@/lib/auth';
import { logActivity } from '@/lib/activity';
import { ContentStatus } from '@prisma/client';

const DEFAULT_TESTIMONIALS = [
  {
    id: 'test-1',
    clientName: 'B. M. Naveen',
    company: 'IPL Bus Services',
    designation: 'Managing Director',
    testimonial: 'TechInPedia engineered our high-load bus ticketing mobile application and published it seamlessly on Google Play Store. The live GPS tracking and Razorpay integration run with sub-second speeds.',
    rating: 5,
    status: 'PUBLISHED',
    displayOrder: 1,
    image: null,
  },
  {
    id: 'test-2',
    clientName: 'Rajesh Verma',
    company: 'Vijaya Bharna Jewellers',
    designation: 'Founder & Managing Partner',
    testimonial: 'Top web & app development agency in Lucknow. Delivered our luxury jewellery catalog mobile app and web platform on time with high security and exceptional UI design.',
    rating: 5,
    status: 'PUBLISHED',
    displayOrder: 2,
    image: null,
  },
  {
    id: 'test-3',
    clientName: 'Er. Jagmohan Sharma',
    company: 'Jagmohan Institute',
    designation: 'Director of Education',
    testimonial: 'Superb educational mobile application with mock tests, automated scoring, and video streaming. Our students find it very fast and easy to use.',
    rating: 5,
    status: 'PUBLISHED',
    displayOrder: 3,
    image: null,
  },
  {
    id: 'test-4',
    clientName: 'Suresh Chandra',
    company: 'Admiles New Mart',
    designation: 'Chief Executive Officer',
    testimonial: 'Our 3-in-1 multi-vendor delivery super app handled thousands of orders smoothly right from launch week. TechInPedia delivered end-to-end perfection.',
    rating: 5,
    status: 'PUBLISHED',
    displayOrder: 4,
    image: null,
  },
];

export async function GET() {
  try {
    const session = await getAuthSession().catch(() => null);
    const where = session ? {} : { status: ContentStatus.PUBLISHED };

    const dbItems = await db.testimonial.findMany({
      where,
      orderBy: { displayOrder: 'asc' },
    }).catch(() => []);

    if (dbItems && dbItems.length > 0) {
      return NextResponse.json({ testimonials: dbItems });
    }

    return NextResponse.json({ testimonials: DEFAULT_TESTIMONIALS });
  } catch (error) {
    console.error('Fetch testimonials error:', error);
    return NextResponse.json({ testimonials: DEFAULT_TESTIMONIALS });
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireAuth();
    const body = await request.json();
    const { clientName, company, designation, testimonial, image, rating, displayOrder, status } = body;

    if (!clientName || !company || !designation || !testimonial) {
      return NextResponse.json({ error: 'Client name, company, designation, and testimonial text are required.' }, { status: 400 });
    }

    const item = await db.testimonial.create({
      data: {
        clientName,
        company,
        designation,
        testimonial,
        image: image || null,
        rating: rating ? parseInt(rating) : 5,
        displayOrder: displayOrder ? parseInt(displayOrder) : 0,
        status: status || ContentStatus.PUBLISHED,
      },
    });

    await logActivity({
      userId: session.userId,
      userEmail: session.email,
      action: 'CREATE_TESTIMONIAL',
      entityType: 'Testimonial',
      entityId: item.id,
    });

    return NextResponse.json({ success: true, testimonial: item });
  } catch (error) {
    console.error('Create testimonial error:', error);
    return NextResponse.json({ error: 'Failed to create testimonial.' }, { status: 500 });
  }
}
