'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Upload, Copy, Trash2, Check, AlertCircle, FileImage } from 'lucide-react';

interface MediaItem {
  id: string;
  filename: string;
  url: string;
  mimeType: string;
  size: number;
  createdAt: string;
}

export default function AdminMediaPage() {
  const [mediaList, setMediaList] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchMedia = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/media');
      const data = await res.json();
      if (res.ok) setMediaList(data.media || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMedia();
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setErrorMsg('');

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/media', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed.');

      fetchMedia();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'File upload failed.');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleCopyUrl = (url: string, id: string) => {
    const fullUrl = `${window.location.origin}${url}`;
    navigator.clipboard.writeText(fullUrl);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this media file?')) return;
    try {
      const res = await fetch(`/api/media/${id}`, { method: 'DELETE' });
      if (res.ok) fetchMedia();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">Media Library</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">Upload images for services, projects, blog posts, and site assets.</p>
        </div>

        <label className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs inline-flex items-center gap-2 cursor-pointer shadow-lg">
          <Upload className="w-4 h-4" />
          <span>{uploading ? 'Uploading...' : 'Upload Image'}</span>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml"
            onChange={handleFileUpload}
            disabled={uploading}
            className="hidden"
          />
        </label>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {loading ? (
          <div className="col-span-full py-12 text-center text-slate-500 dark:text-slate-400 text-xs">Loading media library...</div>
        ) : mediaList.length === 0 ? (
          <div className="col-span-full py-12 text-center text-slate-500 dark:text-slate-400 text-xs">No media uploaded yet.</div>
        ) : mediaList.map((m) => (
          <div key={m.id} className="rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col justify-between group">
            <div className="relative h-32 w-full bg-slate-50 dark:bg-slate-950 flex items-center justify-center overflow-hidden">
              <Image src={m.url} alt={m.filename} fill className="object-cover group-hover:scale-105 transition-transform" />
            </div>

            <div className="p-2.5 space-y-1">
              <div className="text-[11px] font-semibold text-slate-900 dark:text-white truncate" title={m.filename}>{m.filename}</div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400">{(m.size / 1024).toFixed(1)} KB</div>
            </div>

            <div className="p-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <button
                onClick={() => handleCopyUrl(m.url, m.id)}
                className="p-1 text-slate-500 dark:text-slate-400 hover:text-blue-400 text-[10px] font-semibold flex items-center gap-1"
                title="Copy Full Image URL"
              >
                {copiedId === m.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedId === m.id ? 'Copied' : 'Copy URL'}</span>
              </button>
              <button
                onClick={() => handleDelete(m.id)}
                className="p-1 text-slate-500 dark:text-slate-400 hover:text-rose-400"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
