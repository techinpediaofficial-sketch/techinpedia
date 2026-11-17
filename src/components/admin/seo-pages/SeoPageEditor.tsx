'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Save, ArrowLeft, Plus, Trash2, GripVertical, Check, Eye, Globe, Sparkles, Image as ImageIcon, Search, Share2, Layers } from 'lucide-react';
import MediaUploader from '@/components/admin/MediaUploader';

interface SeoPageEditorProps {
  pageId?: string; // If undefined, it's create mode
}

export default function SeoPageEditor({ pageId }: SeoPageEditorProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(pageId ? true : false);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState<any>({
    internalName: '',
    title: '',
    slug: '',
    status: 'DRAFT',
    
    metaTitle: '',
    metaDescription: '',
    focusKeyword: '',
    canonicalUrl: '',
    robotsIndex: true,
    robotsFollow: true,
    ogTitle: '',
    ogDescription: '',
    ogImage: '',

    heroHeading: '',
    heroSubheading: '',
    heroImage: '',
    heroImageAlt: '',
    primaryCtaText: '',
    primaryCtaLink: '',
    secondaryCtaText: '',
    secondaryCtaLink: '',
    
    blocks: '[]'
  });

  const [blocks, setBlocks] = useState<any[]>([]);

  useEffect(() => {
    if (pageId) {
      const fetchPage = async () => {
        try {
          const res = await fetch(`/api/admin/seo-pages/${pageId}`);
          if (res.ok) {
            const data = await res.json();
            setFormData({
              ...data,
              blocks: data.blocks || '[]'
            });
            try {
              setBlocks(JSON.parse(data.blocks || '[]'));
            } catch (e) {
              setBlocks([]);
            }
          }
        } catch (err) {
          console.error(err);
        } finally {
          setLoading(false);
        }
      };
      fetchPage();
    }
  }, [pageId]);

  const handleSave = async (publish: boolean = false) => {
    if (!formData.title?.trim() || !formData.slug?.trim()) {
      alert('Title and Slug are required before saving.');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...formData,
        blocks: JSON.stringify(blocks),
        status: publish ? 'PUBLISHED' : formData.status
      };

      const url = pageId ? `/api/admin/seo-pages/${pageId}` : `/api/admin/seo-pages`;
      const method = pageId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const data = await res.json();
        if (!pageId) {
          router.push(`/admin/seo-pages/${data.id}`);
        } else {
          setFormData({
            ...data,
            blocks: data.blocks || '[]'
          });
          alert(publish ? 'Page successfully published live!' : 'Page draft saved successfully!');
        }
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to save');
      }
    } catch (error) {
      console.error(error);
      alert('Error saving page.');
    } finally {
      setSaving(false);
    }
  };

  const addBlock = (type: string) => {
    const newBlock = {
      id: crypto.randomUUID(),
      type,
      data: {}
    };
    setBlocks([...blocks, newBlock]);
  };

  const removeBlock = (id: string) => {
    setBlocks(blocks.filter((b) => b.id !== id));
  };

  const updateBlockData = (id: string, data: any) => {
    setBlocks(blocks.map((b) => b.id === id ? { ...b, data: { ...b.data, ...data } } : b));
  };

  const moveBlock = (index: number, direction: 'UP' | 'DOWN') => {
    if (direction === 'UP' && index > 0) {
      const newBlocks = [...blocks];
      const temp = newBlocks[index - 1];
      newBlocks[index - 1] = newBlocks[index];
      newBlocks[index] = temp;
      setBlocks(newBlocks);
    }
    if (direction === 'DOWN' && index < blocks.length - 1) {
      const newBlocks = [...blocks];
      const temp = newBlocks[index + 1];
      newBlocks[index + 1] = newBlocks[index];
      newBlocks[index] = temp;
      setBlocks(newBlocks);
    }
  };

  if (loading) {
    return <div className="p-12 text-center text-slate-500">Loading page details...</div>;
  }

  const livePublicUrl = `https://techinpedia.com/${formData.slug || 'slug'}`;

  return (
    <div className="space-y-8 pb-32 max-w-5xl mx-auto">
      {/* Top Header / Sticky Action Bar */}
      <div className="sticky top-0 z-30 bg-slate-50/95 dark:bg-slate-950/95 backdrop-blur py-4 border-b border-slate-200 dark:border-slate-800 -mx-4 px-4 sm:-mx-6 sm:px-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push('/admin/seo-pages')}
            className="p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shadow-sm"
            title="Back to SEO Pages"
          >
            <ArrowLeft className="w-5 h-5 text-slate-600 dark:text-slate-300" />
          </button>
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              {pageId ? 'Edit SEO Landing Page' : 'Create SEO Landing Page'}
            </h1>
            <p className="text-xs text-slate-500 font-mono">
              Live Domain: <span className="text-blue-600 dark:text-blue-400 font-bold">techinpedia.com</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {pageId && formData.status === 'PUBLISHED' && (
            <a
              href={livePublicUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 font-bold text-xs rounded-xl hover:bg-emerald-100 inline-flex items-center gap-2 shadow-sm transition-all"
              title="View on techinpedia.com"
            >
              <Eye className="w-4 h-4 text-emerald-600" /> View Live
            </a>
          )}
          <button
            onClick={() => handleSave(false)}
            disabled={saving}
            className="px-5 py-2.5 bg-slate-800 dark:bg-slate-700 text-white font-bold text-xs rounded-xl hover:bg-slate-700 shadow-md flex items-center gap-2 disabled:opacity-50 transition-all"
          >
            <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save Draft'}
          </button>
          <button
            onClick={() => handleSave(true)}
            disabled={saving}
            className="px-6 py-2.5 bg-blue-600 text-white font-bold text-xs rounded-xl hover:bg-blue-500 shadow-lg shadow-blue-500/30 flex items-center gap-2 disabled:opacity-50 transition-all"
          >
            <Check className="w-4 h-4" /> Publish Live
          </button>
        </div>
      </div>

      {/* Target URL Alert Banner */}
      <div className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/50 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5 text-blue-950 dark:text-blue-200">
          <Globe className="w-4 h-4 text-blue-600 flex-shrink-0" />
          <span>This SEO page will be published on the main public website:</span>
          <span className="font-mono font-bold text-blue-700 dark:text-blue-300 bg-white dark:bg-slate-900 px-2.5 py-1 rounded-lg border border-blue-200 dark:border-blue-800">
            {livePublicUrl}
          </span>
        </div>
        <span className="text-slate-500">All fields below are saved together in one click.</span>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 1: Page Identity & URLs */}
      {/* ========================================================================= */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-sm">
            1
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Page Identity & Public URL</h2>
            <p className="text-xs text-slate-500">Core titles, URL slug on techinpedia.com, and publication status</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-2">
                Internal Name (Admin Reference) *
              </label>
              <input
                type="text"
                value={formData.internalName}
                onChange={(e) => setFormData({ ...formData, internalName: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-sm"
                placeholder="e.g. Laptop Rental - Noida Sector 62"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-2">
                Public Page Title (H1 Heading) *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-sm font-semibold"
                placeholder="e.g. Laptop on Rent in Noida | High Performance Hardware"
              />
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-2">
                Public URL Slug *
              </label>
              <div className="flex items-center">
                <span className="px-3.5 py-2.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 border-r-0 rounded-l-xl text-slate-600 dark:text-slate-400 font-mono text-xs font-bold">
                  https://techinpedia.com/
                </span>
                <input
                  type="text"
                  value={formData.slug}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'),
                    })
                  }
                  className="w-full px-4 py-2.5 rounded-r-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white font-mono text-sm"
                  placeholder="laptop-on-rent-noida"
                />
              </div>
              <p className="text-[11px] text-slate-500 mt-1.5 flex items-center gap-1.5 font-mono">
                <span>🔗 Live URL:</span>
                <span className="text-blue-600 dark:text-blue-400 font-bold">{livePublicUrl}</span>
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-2">
                Publication Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-sm font-semibold"
              >
                <option value="DRAFT">DRAFT (Hidden from public)</option>
                <option value="PUBLISHED">PUBLISHED (Live on techinpedia.com)</option>
                <option value="ARCHIVED">ARCHIVED (Archived)</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 2: Hero Section (Header & Main Banner) */}
      {/* ========================================================================= */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="w-8 h-8 rounded-xl bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-sm">
            2
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Hero Section & Featured Media</h2>
            <p className="text-xs text-slate-500">The main prominent hero banner displayed at the very top of the page</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                Hero Heading Override
              </label>
              <input
                type="text"
                value={formData.heroHeading}
                onChange={(e) => setFormData({ ...formData, heroHeading: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm dark:text-white"
                placeholder="Leave blank to use Public Page Title"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                Hero Subheading / Summary
              </label>
              <textarea
                value={formData.heroSubheading}
                onChange={(e) => setFormData({ ...formData, heroSubheading: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm dark:text-white h-24"
                placeholder="Brief intro text highlighting key features, delivery speed, or benefits..."
              />
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                Hero Featured Image
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={formData.heroImage}
                  onChange={(e) => setFormData({ ...formData, heroImage: e.target.value })}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm dark:text-white"
                  placeholder="/uploads/my-laptop-image.png"
                />
                <MediaUploader onUploadSuccess={(url) => setFormData({ ...formData, heroImage: url })} />
              </div>

              {formData.heroImage && (
                <div className="mt-3 flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl">
                  <div className="relative h-16 w-24 bg-slate-900 rounded-lg overflow-hidden border border-slate-700 flex items-center justify-center">
                    <img
                      src={formData.heroImage}
                      alt="Hero Preview"
                      className="max-h-full max-w-full object-contain"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{formData.heroImage}</p>
                    <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">✓ Image uploaded & active</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, heroImage: '' })}
                    className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors"
                    title="Remove Image"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                Hero Image Alt Text (For SEO & Accessibility)
              </label>
              <input
                type="text"
                value={formData.heroImageAlt}
                onChange={(e) => setFormData({ ...formData, heroImageAlt: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm dark:text-white"
                placeholder="e.g. Dell XPS and Lenovo ThinkPad Laptop Rentals in Noida"
              />
            </div>
          </div>
        </div>

        {/* Action Call-to-Action Buttons */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">Primary Call to Action (Button)</h4>
            <div className="grid grid-cols-2 gap-3">
              <input
                type="text"
                placeholder="Button Text (e.g. Request Instant Quote)"
                value={formData.primaryCtaText}
                onChange={(e) => setFormData({ ...formData, primaryCtaText: e.target.value })}
                className="px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs dark:text-white"
              />
              <input
                type="text"
                placeholder="Button Link (e.g. #enquiry or /contact)"
                value={formData.primaryCtaLink}
                onChange={(e) => setFormData({ ...formData, primaryCtaLink: e.target.value })}
                className="px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs dark:text-white"
              />
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">Secondary Call to Action (Button)</h4>
            <div className="grid grid-cols-2 gap-3">
              <input
                type="text"
                placeholder="Button Text (e.g. 💬 WhatsApp Us)"
                value={formData.secondaryCtaText}
                onChange={(e) => setFormData({ ...formData, secondaryCtaText: e.target.value })}
                className="px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs dark:text-white"
              />
              <input
                type="text"
                placeholder="Button Link (e.g. https://wa.me/...)"
                value={formData.secondaryCtaLink}
                onChange={(e) => setFormData({ ...formData, secondaryCtaLink: e.target.value })}
                className="px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs dark:text-white"
              />
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 3: Content Blocks & Sections */}
      {/* ========================================================================= */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-violet-100 dark:bg-violet-900/40 text-violet-600 dark:text-violet-400 flex items-center justify-center font-bold text-sm">
              3
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Page Content Blocks</h2>
              <p className="text-xs text-slate-500">Add rich text, features, images, FAQs, and custom sections</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <select
              id="blockTypeSelect"
              className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs dark:text-white font-bold"
            >
              <option value="RICH_TEXT">📝 Rich Text</option>
              <option value="IMAGE_TEXT">🖼️ Image + Text</option>
              <option value="FEATURES">✨ Features / Benefits</option>
              <option value="SERVICE_CARDS">💼 Service Cards</option>
              <option value="PROCESS">🔄 How It Works / Process</option>
              <option value="WHY_CHOOSE_US">🛡️ Why Choose Us</option>
              <option value="GALLERY">📸 Photo Gallery</option>
              <option value="FAQ">❓ FAQ Section</option>
              <option value="CTA">🎯 Call to Action (CTA)</option>
              <option value="ENQUIRY">📋 Enquiry Form</option>
            </select>
            <button
              type="button"
              onClick={() => {
                const el = document.getElementById('blockTypeSelect') as HTMLSelectElement;
                if (el) addBlock(el.value);
              }}
              className="px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all"
            >
              <Plus className="w-4 h-4" /> Add Block
            </button>
          </div>
        </div>

        {/* Blocks List */}
        <div className="space-y-4">
          {blocks.map((block, index) => (
            <div key={block.id} className="border border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-950 overflow-hidden shadow-sm">
              <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-900 px-4 py-3 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <GripVertical className="w-4 h-4 text-slate-400" />
                  <span className="font-bold text-xs uppercase text-slate-800 dark:text-slate-200 tracking-wider">
                    {index + 1}. {block.type}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => moveBlock(index, 'UP')}
                    disabled={index === 0}
                    className="p-1.5 text-slate-400 hover:text-blue-500 disabled:opacity-20"
                    title="Move Up"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    onClick={() => moveBlock(index, 'DOWN')}
                    disabled={index === blocks.length - 1}
                    className="p-1.5 text-slate-400 hover:text-blue-500 disabled:opacity-20"
                    title="Move Down"
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    onClick={() => removeBlock(block.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-500 ml-2"
                    title="Remove Block"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="p-5">
                {block.type === 'RICH_TEXT' && (
                  <div className="space-y-3">
                    <input
                      type="text"
                      placeholder="Optional Heading"
                      value={block.data.heading || ''}
                      onChange={(e) => updateBlockData(block.id, { heading: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-sm dark:text-white"
                    />
                    <textarea
                      rows={6}
                      placeholder="HTML or markdown content..."
                      value={block.data.content || ''}
                      onChange={(e) => updateBlockData(block.id, { content: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-sm font-mono dark:text-white"
                    />
                  </div>
                )}

                {block.type === 'ENQUIRY' && (
                  <div className="text-sm p-4 bg-blue-50 dark:bg-blue-950/40 rounded-xl border border-blue-100 dark:border-blue-900/30 space-y-3">
                    <p className="font-bold text-blue-900 dark:text-blue-300">📋 Enquiry Form Block</p>
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      The official contact and quote request form will render here automatically.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                      <input
                        type="text"
                        placeholder="Form Heading Override (Optional)"
                        value={block.data.heading || ''}
                        onChange={(e) => updateBlockData(block.id, { heading: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs dark:text-white"
                      />
                      <input
                        type="text"
                        placeholder="Form Subheading Override (Optional)"
                        value={block.data.subheading || ''}
                        onChange={(e) => updateBlockData(block.id, { subheading: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs dark:text-white"
                      />
                    </div>
                  </div>
                )}

                {block.type === 'FAQ' && (
                  <div className="space-y-4">
                    <input
                      type="text"
                      placeholder="FAQ Section Heading (e.g. Frequently Asked Questions)"
                      value={block.data.heading || ''}
                      onChange={(e) => updateBlockData(block.id, { heading: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-sm dark:text-white"
                    />
                    <textarea
                      rows={6}
                      placeholder={`JSON format array of Q&A objects:\n[{"q":"Do you offer same day laptop delivery in Noida?", "a":"Yes, we provide instant doorstep delivery."}]`}
                      value={block.data.items || ''}
                      onChange={(e) => updateBlockData(block.id, { items: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-sm font-mono dark:text-white"
                    />
                  </div>
                )}

                {block.type === 'FEATURES' && (
                  <div className="space-y-4">
                    <input
                      type="text"
                      placeholder="Features Section Heading"
                      value={block.data.heading || ''}
                      onChange={(e) => updateBlockData(block.id, { heading: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-sm dark:text-white"
                    />
                    <textarea
                      rows={6}
                      placeholder={`JSON format array of objects:\n[{"title":"Latest Generation Intel & M-Series Laptops", "description":"Top notch performance for developers and designers.", "icon":"Laptop"}]`}
                      value={block.data.items || ''}
                      onChange={(e) => updateBlockData(block.id, { items: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-sm font-mono dark:text-white"
                    />
                  </div>
                )}

                {block.type === 'IMAGE_TEXT' && (
                  <div className="space-y-4">
                    <input
                      type="text"
                      placeholder="Heading"
                      value={block.data.heading || ''}
                      onChange={(e) => updateBlockData(block.id, { heading: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-sm dark:text-white"
                    />
                    <textarea
                      rows={4}
                      placeholder="Text Content"
                      value={block.data.content || ''}
                      onChange={(e) => updateBlockData(block.id, { content: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-sm font-mono dark:text-white"
                    />
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Image URL"
                        value={block.data.image || ''}
                        onChange={(e) => updateBlockData(block.id, { image: e.target.value })}
                        className="flex-1 px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-sm dark:text-white"
                      />
                      <MediaUploader onUploadSuccess={(url) => updateBlockData(block.id, { image: url })} />
                    </div>
                    {block.data.image && (
                      <div className="h-16 w-24 bg-slate-900 rounded-lg overflow-hidden border border-slate-700 flex items-center justify-center">
                        <img src={block.data.image} alt="Block preview" className="max-h-full max-w-full object-contain" />
                      </div>
                    )}
                    <select
                      value={block.data.imagePosition || 'right'}
                      onChange={(e) => updateBlockData(block.id, { imagePosition: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-sm dark:text-white"
                    >
                      <option value="right">Image on Right</option>
                      <option value="left">Image on Left</option>
                    </select>
                  </div>
                )}

                {block.type === 'SERVICE_CARDS' && (
                  <div className="space-y-4">
                    <input
                      type="text"
                      placeholder="Services Section Heading"
                      value={block.data.heading || ''}
                      onChange={(e) => updateBlockData(block.id, { heading: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-sm dark:text-white"
                    />
                    <textarea
                      rows={6}
                      placeholder={`JSON format array of objects:\n[{"title":"Corporate Laptop Rentals", "description":"Flexible monthly and yearly contracts.", "image":"/uploads/...", "link":"/contact"}]`}
                      value={block.data.items || ''}
                      onChange={(e) => updateBlockData(block.id, { items: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-sm font-mono dark:text-white"
                    />
                  </div>
                )}

                {block.type === 'PROCESS' && (
                  <div className="space-y-4">
                    <input
                      type="text"
                      placeholder="Process Section Heading (e.g. How To Rent In 3 Easy Steps)"
                      value={block.data.heading || ''}
                      onChange={(e) => updateBlockData(block.id, { heading: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-sm dark:text-white"
                    />
                    <textarea
                      rows={6}
                      placeholder={`JSON format array of steps:\n[{"step":"1", "title":"Choose Configuration", "description":"Select Mac or Windows specs"}]`}
                      value={block.data.items || ''}
                      onChange={(e) => updateBlockData(block.id, { items: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-sm font-mono dark:text-white"
                    />
                  </div>
                )}

                {block.type === 'WHY_CHOOSE_US' && (
                  <div className="space-y-4">
                    <input
                      type="text"
                      placeholder="Why Choose Us Heading"
                      value={block.data.heading || ''}
                      onChange={(e) => updateBlockData(block.id, { heading: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-sm dark:text-white"
                    />
                    <textarea
                      rows={6}
                      placeholder={`JSON format array of reasons:\n[{"title":"Zero Security Deposit for Verified Businesses", "description":"Simple KYC and instant approval."}]`}
                      value={block.data.items || ''}
                      onChange={(e) => updateBlockData(block.id, { items: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-sm font-mono dark:text-white"
                    />
                  </div>
                )}

                {block.type === 'GALLERY' && (
                  <div className="space-y-4">
                    <input
                      type="text"
                      placeholder="Gallery Heading"
                      value={block.data.heading || ''}
                      onChange={(e) => updateBlockData(block.id, { heading: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-sm dark:text-white"
                    />
                    <textarea
                      rows={4}
                      placeholder={`JSON format array of image URLs:\n["/uploads/img1.png", "/uploads/img2.png"]`}
                      value={block.data.items || ''}
                      onChange={(e) => updateBlockData(block.id, { items: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-sm font-mono dark:text-white"
                    />
                  </div>
                )}

                {block.type === 'CTA' && (
                  <div className="space-y-4">
                    <input
                      type="text"
                      placeholder="CTA Heading"
                      value={block.data.heading || ''}
                      onChange={(e) => updateBlockData(block.id, { heading: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-sm dark:text-white"
                    />
                    <input
                      type="text"
                      placeholder="Subheading"
                      value={block.data.subheading || ''}
                      onChange={(e) => updateBlockData(block.id, { subheading: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-sm dark:text-white"
                    />
                    <div className="grid grid-cols-2 gap-4">
                      <input
                        type="text"
                        placeholder="Button Text"
                        value={block.data.buttonText || ''}
                        onChange={(e) => updateBlockData(block.id, { buttonText: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-sm dark:text-white"
                      />
                      <input
                        type="text"
                        placeholder="Button Link URL"
                        value={block.data.buttonLink || ''}
                        onChange={(e) => updateBlockData(block.id, { buttonLink: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-sm dark:text-white"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}

          {blocks.length === 0 && (
            <div className="text-center p-8 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl text-slate-500">
              <Layers className="w-8 h-8 text-slate-400 mx-auto mb-2 opacity-50" />
              <p className="font-semibold text-sm">No content blocks added yet.</p>
              <p className="text-xs mt-1">Use the dropdown and &quot;Add Block&quot; button above to add rich text, FAQs, features, or enquiry blocks.</p>
            </div>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 4: Search Engine Optimization (SEO & Meta Tags) */}
      {/* ========================================================================= */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold text-sm">
            4
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Search Engine Optimization (SEO Meta)</h2>
            <p className="text-xs text-slate-500">Search engine rankings, keywords, and robot crawling instructions</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase">Meta Title</label>
                <span className={`text-[10px] font-mono ${formData.metaTitle?.length > 60 ? 'text-amber-500 font-bold' : 'text-slate-400'}`}>
                  {formData.metaTitle?.length || 0}/60 chars
                </span>
              </div>
              <input
                type="text"
                value={formData.metaTitle}
                onChange={(e) => setFormData({ ...formData, metaTitle: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm dark:text-white"
                placeholder="Laptop on Rent in Noida | Affordable Daily & Monthly Rentals"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase">Meta Description</label>
                <span className={`text-[10px] font-mono ${formData.metaDescription?.length > 160 ? 'text-amber-500 font-bold' : 'text-slate-400'}`}>
                  {formData.metaDescription?.length || 0}/160 chars
                </span>
              </div>
              <textarea
                rows={3}
                value={formData.metaDescription}
                onChange={(e) => setFormData({ ...formData, metaDescription: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm dark:text-white"
                placeholder="Looking for laptop on rent in Noida? TechInPedia provides MacBooks, ThinkPads, and gaming laptops on flexible rental terms with same day delivery."
              />
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">Focus Keyword</label>
              <input
                type="text"
                value={formData.focusKeyword}
                onChange={(e) => setFormData({ ...formData, focusKeyword: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm dark:text-white"
                placeholder="laptop on rent noida"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">Canonical URL Override</label>
              <input
                type="text"
                value={formData.canonicalUrl}
                onChange={(e) => setFormData({ ...formData, canonicalUrl: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm dark:text-white"
                placeholder="Leave blank to default to https://techinpedia.com/slug"
              />
            </div>

            <div className="pt-2 flex gap-6">
              <label className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.robotsIndex}
                  onChange={(e) => setFormData({ ...formData, robotsIndex: e.target.checked })}
                  className="rounded text-blue-600 w-4 h-4"
                />
                Index (Allow Google to index page)
              </label>
              <label className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.robotsFollow}
                  onChange={(e) => setFormData({ ...formData, robotsFollow: e.target.checked })}
                  className="rounded text-blue-600 w-4 h-4"
                />
                Follow (Allow crawlers to follow links)
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 5: Social Sharing (Open Graph / WhatsApp / Facebook / Twitter) */}
      {/* ========================================================================= */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="w-8 h-8 rounded-xl bg-pink-100 dark:bg-pink-900/40 text-pink-600 dark:text-pink-400 flex items-center justify-center font-bold text-sm">
            5
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Social Media Sharing (Open Graph)</h2>
            <p className="text-xs text-slate-500">How the page appears when shared on WhatsApp, LinkedIn, Twitter & Facebook</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">Social Title (OG Title)</label>
              <input
                type="text"
                value={formData.ogTitle}
                onChange={(e) => setFormData({ ...formData, ogTitle: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm dark:text-white"
                placeholder="Leave blank to use Meta Title"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">Social Description (OG Description)</label>
              <textarea
                rows={3}
                value={formData.ogDescription}
                onChange={(e) => setFormData({ ...formData, ogDescription: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm dark:text-white"
                placeholder="Leave blank to use Meta Description"
              />
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">Social Share Image (OG Image)</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={formData.ogImage}
                  onChange={(e) => setFormData({ ...formData, ogImage: e.target.value })}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm dark:text-white"
                  placeholder="/uploads/og-share-banner.png"
                />
                <MediaUploader onUploadSuccess={(url) => setFormData({ ...formData, ogImage: url })} />
              </div>

              {formData.ogImage && (
                <div className="mt-3 flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl">
                  <div className="relative h-16 w-24 bg-slate-900 rounded-lg overflow-hidden border border-slate-700 flex items-center justify-center">
                    <img
                      src={formData.ogImage}
                      alt="OG Preview"
                      className="max-h-full max-w-full object-contain"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{formData.ogImage}</p>
                    <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">✓ Social preview image active</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, ogImage: '' })}
                    className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors"
                    title="Remove Image"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 6: Google Search Snippet Preview */}
      {/* ========================================================================= */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-sm space-y-4">
        <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-sm">
            6
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Google Search Result Preview</h2>
            <p className="text-xs text-slate-500">Live visual simulation of Google Desktop/Mobile search ranking snippet</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm max-w-2xl">
          <div className="text-[12px] text-[#202124] flex items-center gap-1.5 mb-1">
            <span className="w-4 h-4 rounded-full bg-blue-600 text-white flex items-center justify-center text-[9px] font-bold">T</span>
            <span className="font-medium">TechInPedia</span>
            <span className="text-[#5f6368]">› {formData.slug || 'slug'}</span>
          </div>
          <div className="text-[18px] text-[#1a0dab] hover:underline cursor-pointer font-medium leading-tight mb-1 truncate">
            {formData.metaTitle || formData.title || 'Page Title will appear here'}
          </div>
          <div className="text-[13px] text-[#4d5156] line-clamp-2 leading-relaxed">
            {formData.metaDescription || 'Meta description snippet will appear here to attract visitors from Google search.'}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* BOTTOM STICKY SAVE BAR */}
      {/* ========================================================================= */}
      <div className="sticky bottom-4 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-2xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="text-xs">
            <span className="text-slate-500">Public Live URL: </span>
            <span className="font-mono text-blue-600 dark:text-blue-400 font-bold">{livePublicUrl}</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {pageId && formData.status === 'PUBLISHED' && (
            <a
              href={livePublicUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 font-bold text-xs rounded-xl hover:bg-emerald-100 inline-flex items-center gap-2 shadow-sm transition-all"
            >
              <Eye className="w-4 h-4 text-emerald-600" /> View Live
            </a>
          )}
          <button
            onClick={() => handleSave(false)}
            disabled={saving}
            className="px-6 py-2.5 bg-slate-800 dark:bg-slate-700 text-white font-bold text-xs rounded-xl hover:bg-slate-700 shadow-md flex items-center gap-2 disabled:opacity-50 transition-all"
          >
            <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save Draft'}
          </button>
          <button
            onClick={() => handleSave(true)}
            disabled={saving}
            className="px-8 py-2.5 bg-blue-600 text-white font-bold text-xs rounded-xl hover:bg-blue-500 shadow-lg shadow-blue-500/30 flex items-center gap-2 disabled:opacity-50 transition-all"
          >
            <Check className="w-4 h-4" /> Publish Live
          </button>
        </div>
      </div>
    </div>
  );
}
