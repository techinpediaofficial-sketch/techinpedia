'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Layers,
  Plus,
  Search,
  Filter,
  RefreshCw,
  Edit2,
  Trash2,
  ExternalLink,
  ChevronRight,
  FolderTree,
  CheckCircle2,
  AlertCircle,
  X,
  Check,
  Building2,
  Eye,
  Wrench,
  Sparkles,
  Zap,
  ArrowRight
} from 'lucide-react';

interface CategoryItem {
  id: string;
  name: string;
  slug: string;
  mode: string;
  parentId: string | null;
  parentName: string | null;
  parentSlug: string | null;
  subcategoriesCount: number;
  tagline: string | null;
  iconName: string;
  popularItems: string[];
  displayOrder: number;
  status: string;
  vendorCount: number;
  createdAt: string;
}

interface ParentOption {
  id: string;
  name: string;
  slug: string;
}

export default function AdminMarketplaceCategoriesPage() {
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [parentOptions, setParentOptions] = useState<ParentOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState<string>('ALL');
  const [filterType, setFilterType] = useState<'ALL' | 'ROOT' | 'SUBCAT'>('ALL');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryItem | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    mode: 'B2C',
    parentId: '',
    tagline: '',
    iconName: 'Wrench',
    popularItems: '',
    displayOrder: 0,
    status: 'ACTIVE',
  });
  const [saving, setSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/marketplace/categories');
      const data = await res.json();
      if (data.success && Array.isArray(data.categories)) {
        setCategories(data.categories);
        setParentOptions(data.parentOptions || []);
      }
    } catch (err) {
      console.error(err);
      setStatusMsg({ type: 'error', text: 'Failed to load categories' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const openCreateModal = () => {
    setEditingCategory(null);
    setFormData({
      name: '',
      slug: '',
      mode: 'B2C',
      parentId: '',
      tagline: '',
      iconName: 'Wrench',
      popularItems: '',
      displayOrder: categories.length + 1,
      status: 'ACTIVE',
    });
    setIsModalOpen(true);
  };

  const openEditModal = (cat: CategoryItem) => {
    setEditingCategory(cat);
    setFormData({
      name: cat.name,
      slug: cat.slug,
      mode: cat.mode,
      parentId: cat.parentId || '',
      tagline: cat.tagline || '',
      iconName: cat.iconName || 'Wrench',
      popularItems: cat.popularItems ? cat.popularItems.join(', ') : '',
      displayOrder: cat.displayOrder,
      status: cat.status,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return alert('Name is required');

    setSaving(true);
    setStatusMsg(null);

    const popularItemsArray = formData.popularItems
      ? formData.popularItems.split(',').map((s) => s.trim()).filter(Boolean)
      : [];

    try {
      const url = '/api/admin/marketplace/categories';
      const method = editingCategory ? 'PUT' : 'POST';
      const body = {
        ...(editingCategory ? { id: editingCategory.id } : {}),
        name: formData.name,
        slug: formData.slug || undefined,
        mode: formData.mode,
        parentId: formData.parentId || null,
        tagline: formData.tagline || null,
        iconName: formData.iconName,
        popularItems: popularItemsArray,
        displayOrder: Number(formData.displayOrder),
        status: formData.status,
      };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setStatusMsg({
          type: 'success',
          text: `Category ${editingCategory ? 'updated' : 'created'} successfully!`,
        });
        setIsModalOpen(false);
        fetchCategories();
      } else {
        alert(data.error || 'Failed to save category');
      }
    } catch (err: any) {
      alert(err.message || 'Error saving category');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete category "${name}"?`)) return;

    try {
      const res = await fetch(`/api/admin/marketplace/categories?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setStatusMsg({ type: 'success', text: `Category "${name}" deleted.` });
        fetchCategories();
      } else {
        alert(data.error || 'Could not delete category');
      }
    } catch (err: any) {
      alert(err.message || 'Error deleting category');
    }
  };

  // Filter Categories
  const filteredCategories = categories.filter((c) => {
    if (filterMode !== 'ALL' && c.mode !== filterMode) return false;
    if (filterType === 'ROOT' && c.parentId) return false;
    if (filterType === 'SUBCAT' && !c.parentId) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        c.name.toLowerCase().includes(q) ||
        c.slug.toLowerCase().includes(q) ||
        (c.parentName && c.parentName.toLowerCase().includes(q)) ||
        (c.tagline && c.tagline.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const rootCount = categories.filter((c) => !c.parentId).length;
  const subCount = categories.filter((c) => Boolean(c.parentId)).length;

  return (
    <div className="space-y-6">
      {/* Page Title & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center font-bold">
              <FolderTree className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                Categories &amp; Subcategories Tree
              </h1>
              <p className="text-xs text-slate-500">
                Manage parent categories, specialized subcategories, and search tags.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchCategories}
            className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
            title="Refresh List"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-blue-600' : ''}`} />
          </button>

          <button
            onClick={openCreateModal}
            className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-blue-600/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Category</span>
          </button>
        </div>
      </div>

      {statusMsg && (
        <div
          className={`p-4 rounded-2xl flex items-center justify-between text-xs font-semibold ${
            statusMsg.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
              : 'bg-red-50 dark:bg-red-950/40 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-800'
          }`}
        >
          <span>{statusMsg.text}</span>
          <button onClick={() => setStatusMsg(null)} className="text-slate-400 hover:text-slate-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Categories</span>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">{categories.length}</div>
          <p className="text-[10px] text-slate-500 mt-0.5">Database entities</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800">
          <span className="text-[11px] font-bold uppercase tracking-wider text-blue-500">Root Categories</span>
          <div className="text-2xl font-black text-blue-600 mt-1">{rootCount}</div>
          <p className="text-[10px] text-slate-500 mt-0.5">Justdial top-level hubs</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800">
          <span className="text-[11px] font-bold uppercase tracking-wider text-purple-500">Subcategories</span>
          <div className="text-2xl font-black text-purple-600 mt-1">{subCount}</div>
          <p className="text-[10px] text-slate-500 mt-0.5">Specialized branches</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800">
          <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-500">Active Listings</span>
          <div className="text-2xl font-black text-emerald-600 mt-1">
            {categories.reduce((acc, c) => acc + c.vendorCount, 0)}
          </div>
          <p className="text-[10px] text-slate-500 mt-0.5">Connected vendor profiles</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search category name, slug, parent..."
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
          <div className="flex rounded-xl bg-slate-100 dark:bg-slate-800 p-1">
            <button
              onClick={() => setFilterType('ALL')}
              className={`px-3 py-1 rounded-lg transition-colors ${
                filterType === 'ALL'
                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 font-bold shadow-xs'
                  : 'text-slate-500'
              }`}
            >
              All Types
            </button>
            <button
              onClick={() => setFilterType('ROOT')}
              className={`px-3 py-1 rounded-lg transition-colors ${
                filterType === 'ROOT'
                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 font-bold shadow-xs'
                  : 'text-slate-500'
              }`}
            >
              Root Hubs ({rootCount})
            </button>
            <button
              onClick={() => setFilterType('SUBCAT')}
              className={`px-3 py-1 rounded-lg transition-colors ${
                filterType === 'SUBCAT'
                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 font-bold shadow-xs'
                  : 'text-slate-500'
              }`}
            >
              Subcategories ({subCount})
            </button>
          </div>

          <div className="flex rounded-xl bg-slate-100 dark:bg-slate-800 p-1">
            <button
              onClick={() => setFilterMode('ALL')}
              className={`px-2.5 py-1 rounded-lg transition-colors ${
                filterMode === 'ALL' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white font-bold' : 'text-slate-500'
              }`}
            >
              All Modes
            </button>
            <button
              onClick={() => setFilterMode('B2C')}
              className={`px-2.5 py-1 rounded-lg transition-colors ${
                filterMode === 'B2C' ? 'bg-white dark:bg-slate-700 text-blue-600 font-bold' : 'text-slate-500'
              }`}
            >
              B2C
            </button>
            <button
              onClick={() => setFilterMode('B2B')}
              className={`px-2.5 py-1 rounded-lg transition-colors ${
                filterMode === 'B2B' ? 'bg-white dark:bg-slate-700 text-cyan-600 font-bold' : 'text-slate-500'
              }`}
            >
              B2B
            </button>
          </div>
        </div>
      </div>

      {/* Categories Table */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                <th className="py-3.5 px-4">Category Name</th>
                <th className="py-3.5 px-4">Slug &amp; Route</th>
                <th className="py-3.5 px-4">Tree Structure</th>
                <th className="py-3.5 px-4">Mode</th>
                <th className="py-3.5 px-4">Vendors</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-600" />
                    Loading categories from MySQL...
                  </td>
                </tr>
              ) : filteredCategories.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No categories found matching your query.
                  </td>
                </tr>
              ) : (
                filteredCategories.map((cat) => {
                  const isRoot = !cat.parentId;
                  const liveUrl = isRoot && cat.subcategoriesCount > 0
                    ? `https://urban.techinpedia.com/category/${cat.slug}`
                    : `https://urban.techinpedia.com/services/${cat.slug}`;

                  return (
                    <tr
                      key={cat.id}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      {/* Name & Tagline */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 text-blue-600 flex items-center justify-center font-bold flex-shrink-0">
                            {cat.name.charAt(0)}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                              <span>{cat.name}</span>
                              {isRoot && (
                                <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                                  Parent Hub
                                </span>
                              )}
                            </div>
                            {cat.tagline && (
                              <p className="text-[11px] text-slate-400 truncate max-w-xs">{cat.tagline}</p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Slug & Links */}
                      <td className="py-3.5 px-4">
                        <a
                          href={liveUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 font-mono text-[11px] text-blue-600 hover:underline"
                        >
                          <span>/{isRoot && cat.subcategoriesCount > 0 ? 'category' : 'services'}/{cat.slug}</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </td>

                      {/* Parent or Subcategories Count */}
                      <td className="py-3.5 px-4">
                        {isRoot ? (
                          <div className="text-slate-600 dark:text-slate-400 font-semibold">
                            {cat.subcategoriesCount > 0 ? (
                              <span className="text-purple-600 dark:text-purple-400 font-bold">
                                {cat.subcategoriesCount} Subcategories
                              </span>
                            ) : (
                              <span className="text-slate-400">Direct Category</span>
                            )}
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 text-slate-600 dark:text-slate-300">
                            <span className="text-slate-400">Under:</span>
                            <span className="font-bold text-blue-600 dark:text-blue-400">{cat.parentName}</span>
                          </div>
                        )}
                      </td>

                      {/* Mode */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            cat.mode === 'B2B'
                              ? 'bg-cyan-50 dark:bg-cyan-950/60 text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800'
                              : 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                          }`}
                        >
                          {cat.mode}
                        </span>
                      </td>

                      {/* Vendor Count */}
                      <td className="py-3.5 px-4 font-bold text-slate-700 dark:text-slate-300">
                        {cat.vendorCount > 0 ? (
                          <span className="text-emerald-600 font-black">{cat.vendorCount} Vendors</span>
                        ) : (
                          <span className="text-slate-400 font-normal">0</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            cat.status === 'ACTIVE'
                              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                              : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                          <span>{cat.status}</span>
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openEditModal(cat)}
                            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 text-slate-600 dark:text-slate-300"
                            title="Edit Category"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(cat.id, cat.name)}
                            className="p-1.5 rounded-lg border border-red-200 dark:border-red-900/60 hover:bg-red-50 text-red-600 dark:text-red-400"
                            title="Delete Category"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE / EDIT CATEGORY MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 w-full max-w-lg shadow-2xl p-6 sm:p-8 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                {editingCategory ? 'Edit Category' : 'Create New Category'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Category Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Eye Hospitals, Dentists, AC Repair"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Slug (URL Key)
                  </label>
                  <input
                    type="text"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    placeholder="e.g. eye-hospitals"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Mode
                  </label>
                  <select
                    value={formData.mode}
                    onChange={(e) => setFormData({ ...formData, mode: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white outline-none"
                  >
                    <option value="B2C">B2C Local Services</option>
                    <option value="B2B">B2B Wholesale / Mfr</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Parent Category (Leave empty if Root Hub)
                </label>
                <select
                  value={formData.parentId}
                  onChange={(e) => setFormData({ ...formData, parentId: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white outline-none"
                >
                  <option value="">None (Top-Level Parent Hub)</option>
                  {parentOptions
                    .filter((p) => !editingCategory || p.id !== editingCategory.id)
                    .map((p) => (
                      <option key={p.id} value={p.id}>
                        Under: {p.name}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Tagline / Short Description
                </label>
                <input
                  type="text"
                  value={formData.tagline}
                  onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                  placeholder="e.g. Specialised eye care, LASIK & cataract surgery"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Popular Items / Search Chips (Comma separated)
                </label>
                <input
                  type="text"
                  value={formData.popularItems}
                  onChange={(e) => setFormData({ ...formData, popularItems: e.target.value })}
                  placeholder="e.g. Cataract Surgery, LASIK, Glaucoma Test"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Display Order
                  </label>
                  <input
                    type="number"
                    value={formData.displayOrder}
                    onChange={(e) => setFormData({ ...formData, displayOrder: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white outline-none"
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md shadow-blue-600/20 disabled:opacity-50"
                >
                  {saving ? 'Saving...' : editingCategory ? 'Update Category' : 'Create Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
