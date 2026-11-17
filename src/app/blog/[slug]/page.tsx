import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { db } from '@/lib/db';
import { sanitizeHtml } from '@/lib/sanitizer';
import JsonLd from '@/components/JsonLd';
import { ChevronLeft, Calendar, User, Tag } from 'lucide-react';
import { ContentStatus } from '@prisma/client';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  let post = await db.blogPost.findUnique({ where: { slug } }).catch(() => null);
  if (!post) {
    const { getCatalogBlog } = await import('@/lib/blogsCatalog');
    const cat = getCatalogBlog(slug);
    if (cat) {
      post = {
        ...cat,
        publishedAt: new Date(cat.publishedAt),
      } as any;
    }
  }

  if (!post) return {};

  const siteUrl = 'https://techinpedia.com';
  const pageUrl = `https://techinpedia.com/blog/${post.slug}`;
  const baseTitle = post.seoTitle || post.title;
  const title = baseTitle.includes('TechInPedia') ? { absolute: baseTitle } : baseTitle;
  const description = post.seoDescription || post.excerpt;

  return {
    title,
    description,
    keywords: [post.category, 'TechInPedia', 'Software Blog', 'Tech Insights'],
    alternates: {
      canonical: pageUrl,
    },
    openGraph: {
      title,
      description,
      url: pageUrl,
      siteName: 'TechInPedia',
      type: 'article',
      publishedTime: post.publishedAt ? new Date(post.publishedAt).toISOString() : undefined,
      authors: [post.author],
      ...(post.featuredImage
        ? {
            images: [
              {
                url: post.featuredImage,
                width: 1200,
                height: 630,
                alt: post.title,
              },
            ],
          }
        : {}),
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      ...(post.featuredImage ? { images: [post.featuredImage] } : {}),
    },
  };
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  let post = await db.blogPost.findUnique({ where: { slug } }).catch(() => null);
  if (!post) {
    const { getCatalogBlog } = await import('@/lib/blogsCatalog');
    const cat = getCatalogBlog(slug);
    if (cat) {
      post = {
        ...cat,
        publishedAt: new Date(cat.publishedAt),
      } as any;
    }
  }

  if (!post || post.status !== ContentStatus.PUBLISHED) {
    notFound();
  }

  const cleanContent = sanitizeHtml(post.content);
  const siteUrl = 'https://techinpedia.com';

  const blogSchema = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.excerpt,
    url: `${siteUrl}/blog/${post.slug}`,
    ...(post.featuredImage ? { image: post.featuredImage } : {}),
    author: {
      '@type': 'Person',
      name: post.author || 'TechInPedia Team',
    },
    publisher: {
      '@type': 'Organization',
      name: 'TechInPedia',
      url: siteUrl,
      logo: `${siteUrl}/logo.png`,
    },
    datePublished: post.publishedAt ? new Date(post.publishedAt).toISOString() : new Date().toISOString(),
    dateModified: post.updatedAt ? new Date(post.updatedAt).toISOString() : new Date().toISOString(),
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `${siteUrl}/blog/${post.slug}`,
    },
  };

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: siteUrl },
      { '@type': 'ListItem', position: 2, name: 'Blog', item: `${siteUrl}/blog` },
      { '@type': 'ListItem', position: 3, name: post.title, item: `${siteUrl}/blog/${post.slug}` },
    ],
  };

  return (
    <>
      <JsonLd data={blogSchema} />
      <JsonLd data={breadcrumbSchema} />

      <div className="bg-slate-950 py-16">
        <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <Link href="/blog" className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white mb-8">
            <ChevronLeft className="w-4 h-4" />
            <span>Back to All Articles</span>
          </Link>

          {/* Post Header */}
          <div className="space-y-4 mb-10">
            <span className="px-3 py-1 rounded-full bg-blue-600/20 text-blue-400 border border-blue-500/30 text-xs font-semibold">
              {post.category}
            </span>
            <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight">
              {post.title}
            </h1>
            <div className="flex flex-wrap items-center gap-6 text-xs text-slate-400 border-b border-slate-800 pb-6">
              <span className="flex items-center gap-1.5">
                <User className="w-4 h-4 text-blue-400" />
                {post.author}
              </span>
              <span className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-emerald-400" />
                {post.publishedAt ? new Date(post.publishedAt).toLocaleDateString() : 'Recent'}
              </span>
            </div>
          </div>

          {/* Featured Image */}
          {post.featuredImage && (
            <div className="relative h-96 w-full rounded-2xl overflow-hidden mb-12 border border-slate-800">
              <Image src={post.featuredImage} alt={post.title} fill className="object-cover" />
            </div>
          )}

          {/* Excerpt Banner */}
          <div className="p-6 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 text-base italic leading-relaxed mb-10">
            {post.excerpt}
          </div>

          {/* Article Body Content */}
          <div
            className="prose prose-invert max-w-none text-slate-300 leading-relaxed space-y-6 prose-headings:text-white prose-a:text-blue-400"
            dangerouslySetInnerHTML={{ __html: cleanContent }}
          />

          {/* Tags */}
          {post.tags && (
            <div className="mt-12 pt-8 border-t border-slate-800 flex items-center gap-3 flex-wrap">
              <Tag className="w-4 h-4 text-slate-400" />
              {post.tags.split(',').map((tag: string, idx: number) => (
                <span key={idx} className="px-3 py-1 rounded-md bg-slate-900 border border-slate-800 text-slate-300 text-xs font-medium">
                  {tag.trim()}
                </span>
              ))}
            </div>
          )}

        </article>
      </div>
    </>
  );
}
