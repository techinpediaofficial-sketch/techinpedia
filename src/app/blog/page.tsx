import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { db } from '@/lib/db';
import JsonLd from '@/components/JsonLd';
import { ArrowRight, Calendar, User } from 'lucide-react';
import { ContentStatus } from '@prisma/client';

export const revalidate = 60;

export const metadata: Metadata = {
  title: { absolute: 'Blog & Software Engineering Insights | TechInPedia' },
  description: 'Articles and guides on Next.js, React, Node.js, SaaS architecture, UI/UX design, and software engineering best practices by TechInPedia.',
  alternates: {
    canonical: 'https://techinpedia.com/blog',
  },
  openGraph: {
    title: 'Software Development & Technology Blog | TechInPedia',
    description: 'Articles on web engineering, SaaS growth, full-stack architecture, and mobile apps.',
    url: 'https://techinpedia.com/blog',
    siteName: 'TechInPedia',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'TechInPedia Engineering Blog',
    description: 'Technical tutorials and software architecture insights.',
  },
};

export default async function BlogListingPage() {
  let posts: any[] = [];
  try {
    posts = await db.blogPost.findMany({
      where: { status: ContentStatus.PUBLISHED },
      orderBy: { publishedAt: 'desc' },
    });
  } catch (err) {
    posts = [];
  }

  if (!posts || posts.length === 0) {
    const { getAllCatalogBlogs } = await import('@/lib/blogsCatalog');
    posts = getAllCatalogBlogs();
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://techinpedia.com';

  const schemaData = {
    '@context': 'https://schema.org',
    '@type': 'Blog',
    name: 'TechInPedia Engineering Blog',
    url: `${siteUrl}/blog`,
    description: 'Articles and guides on Next.js, React, SaaS architecture, and software development.',
    publisher: {
      '@type': 'Organization',
      name: 'TechInPedia',
      url: siteUrl,
    },
    blogPost: posts.map((p: { title: string; slug: string; excerpt: string; publishedAt?: Date | null; author: string }) => ({
      '@type': 'BlogPosting',
      headline: p.title,
      url: `${siteUrl}/blog/${p.slug}`,
      description: p.excerpt,
      datePublished: p.publishedAt ? new Date(p.publishedAt).toISOString() : new Date().toISOString(),
      author: {
        '@type': 'Person',
        name: p.author,
      },
    })),
  };

  return (
    <>
      <JsonLd data={schemaData} />
      <div className="bg-slate-950 py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <span className="text-xs font-semibold uppercase tracking-wider text-blue-400">Engineering Insights</span>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight">
            Software Development & Technology Blog
          </h1>
          <p className="text-base text-slate-300">
            Articles and guides on web architecture, SaaS engineering, and modern tech stacks.
          </p>
        </div>

        {/* Blog Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {posts.map((post: { id: string; title: string; slug: string; excerpt: string; featuredImage?: string | null; category: string; author: string; publishedAt?: Date | null }) => (
            <article
              key={post.id}
              className="group rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden hover:border-blue-500/40 transition-all flex flex-col justify-between"
            >
              <div>
                {post.featuredImage && (
                  <div className="relative h-48 w-full bg-slate-800 overflow-hidden">
                    <Image src={post.featuredImage} alt={post.title} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
                  </div>
                )}
                <div className="p-6 space-y-3">
                  <div className="flex items-center gap-4 text-xs text-slate-400">
                    <span className="px-2.5 py-0.5 rounded bg-blue-500/10 text-blue-400 font-semibold border border-blue-500/20">
                      {post.category}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {post.publishedAt ? new Date(post.publishedAt).toLocaleDateString() : 'Recent'}
                    </span>
                  </div>

                  <h2 className="text-xl font-bold text-white group-hover:text-blue-400 transition-colors leading-snug">
                    {post.title}
                  </h2>

                  <p className="text-xs text-slate-300 line-clamp-3 leading-relaxed">
                    {post.excerpt}
                  </p>
                </div>
              </div>

              <div className="p-6 pt-0 flex items-center justify-between">
                <span className="text-xs text-slate-500 flex items-center gap-1">
                  <User className="w-3.5 h-3.5" />
                  {post.author}
                </span>

                <Link
                  href={`/blog/${post.slug}`}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-400 hover:text-blue-300"
                >
                  <span>Read Article</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
    </>
  );
}
