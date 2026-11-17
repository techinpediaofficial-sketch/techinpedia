import SeoPageEditor from '@/components/admin/seo-pages/SeoPageEditor';

export const metadata = {
  title: 'Edit SEO Page | Admin',
};

export default async function EditSeoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <SeoPageEditor pageId={id} />;
}
