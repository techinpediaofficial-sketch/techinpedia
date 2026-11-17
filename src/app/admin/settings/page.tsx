'use client';

import { useState, useEffect } from 'react';
import { Save, CheckCircle2, AlertCircle, Plus, Trash2, Phone, MapPin, Building2 } from 'lucide-react';

interface PhoneItem {
  id: string;
  label: string;
  number: string;
  isWhatsApp: boolean;
  isPrimary: boolean;
}

interface AddressItem {
  id: string;
  title: string;
  address: string;
  isPrimary: boolean;
}

export default function AdminSettingsPage() {
  const [activeTab, setActiveTab] = useState<'company' | 'social' | 'seo' | 'website'>('company');
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [phonesList, setPhonesList] = useState<PhoneItem[]>([]);
  const [addressesList, setAddressesList] = useState<AddressItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/settings');
      const data = await res.json();
      if (res.ok) {
        const s = data.settings || {};
        setSettings(s);

        // Parse Multiple Phone Numbers
        if (s.company_phones) {
          try {
            const parsed = JSON.parse(s.company_phones);
            if (Array.isArray(parsed) && parsed.length > 0) {
              setPhonesList(parsed);
            } else {
              throw new Error();
            }
          } catch {
            setPhonesList([
              { id: 'phone-1', label: 'Primary Support', number: s.company_phone || '+91 98765 43210', isWhatsApp: true, isPrimary: true },
            ]);
          }
        } else {
          setPhonesList([
            { id: 'phone-1', label: 'Primary Support', number: s.company_phone || '+91 98765 43210', isWhatsApp: true, isPrimary: true },
          ]);
        }

        // Parse Multiple Addresses
        if (s.company_addresses) {
          try {
            const parsed = JSON.parse(s.company_addresses);
            if (Array.isArray(parsed) && parsed.length > 0) {
              setAddressesList(parsed);
            } else {
              throw new Error();
            }
          } catch {
            setAddressesList([
              { id: 'addr-1', title: 'Corporate Headquarters', address: s.company_address || 'Cyber Hub & Worldwide Services, India', isPrimary: true },
            ]);
          }
        } else {
          setAddressesList([
            { id: 'addr-1', title: 'Corporate Headquarters', address: s.company_address || 'Cyber Hub & Worldwide Services, India', isPrimary: true },
          ]);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleChange = (key: string, value: string) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  // Phone helper methods
  const addPhone = () => {
    const newId = `phone-${Date.now()}`;
    setPhonesList((prev) => [
      ...prev,
      { id: newId, label: 'Sales / Inquiries', number: '', isWhatsApp: false, isPrimary: prev.length === 0 },
    ]);
  };

  const updatePhone = (id: string, field: keyof PhoneItem, val: any) => {
    setPhonesList((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          return { ...item, [field]: val };
        }
        if (field === 'isPrimary' && val === true) {
          return { ...item, isPrimary: false };
        }
        return item;
      })
    );
  };

  const removePhone = (id: string) => {
    setPhonesList((prev) => {
      const filtered = prev.filter((p) => p.id !== id);
      if (filtered.length > 0 && !filtered.some((p) => p.isPrimary)) {
        filtered[0].isPrimary = true;
      }
      return filtered;
    });
  };

  // Address helper methods
  const addAddress = () => {
    const newId = `addr-${Date.now()}`;
    setAddressesList((prev) => [
      ...prev,
      { id: newId, title: 'Branch Office', address: '', isPrimary: prev.length === 0 },
    ]);
  };

  const updateAddress = (id: string, field: keyof AddressItem, val: any) => {
    setAddressesList((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          return { ...item, [field]: val };
        }
        if (field === 'isPrimary' && val === true) {
          return { ...item, isPrimary: false };
        }
        return item;
      })
    );
  };

  const removeAddress = (id: string) => {
    setAddressesList((prev) => {
      const filtered = prev.filter((a) => a.id !== id);
      if (filtered.length > 0 && !filtered.some((a) => a.isPrimary)) {
        filtered[0].isPrimary = true;
      }
      return filtered;
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg('');
    setErrorMsg('');

    try {
      const primaryPhone = phonesList.find((p) => p.isPrimary) || phonesList[0];
      const primaryAddress = addressesList.find((a) => a.isPrimary) || addressesList[0];

      const payload = {
        ...settings,
        company_phones: JSON.stringify(phonesList),
        company_addresses: JSON.stringify(addressesList),
        company_phone: primaryPhone?.number || settings.company_phone || '',
        company_address: primaryAddress?.address || settings.company_address || '',
      };

      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save settings.');

      setSuccessMsg('Settings saved successfully and website cache updated!');
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Error saving settings.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">System Settings</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">Configure company info, WhatsApp contact number, social handles, and SEO.</p>
        </div>
      </div>

      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
        {(['company', 'social', 'seo', 'website'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
              activeTab === tab ? 'bg-blue-600 text-white' : 'bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <form onSubmit={handleSave} className="p-8 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-6 text-xs">
        
        {/* COMPANY TAB */}
        {activeTab === 'company' && (
          <div className="space-y-4">
            <h2 className="text-base font-bold text-slate-900 dark:text-white mb-2">Company Information</h2>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-200 uppercase mb-1">Company Name</label>
                <input
                  type="text"
                  value={settings.company_name || ''}
                  onChange={(e) => handleChange('company_name', e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-sm focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-200 uppercase mb-1">Tagline</label>
                <input
                  type="text"
                  value={settings.company_tagline || ''}
                  onChange={(e) => handleChange('company_tagline', e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-sm focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-200 uppercase mb-1">Company Email</label>
                <input
                  type="email"
                  value={settings.company_email || ''}
                  onChange={(e) => handleChange('company_email', e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-xs focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-emerald-400 uppercase mb-1">Primary WhatsApp Floating Number *</label>
                <input
                  type="text"
                  placeholder="919876543210 (with country code)"
                  value={settings.whatsapp_number || ''}
                  onChange={(e) => handleChange('whatsapp_number', e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-emerald-500/50 text-emerald-300 font-mono text-xs focus:border-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            {/* MULTIPLE PHONE NUMBERS */}
            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Phone className="w-4 h-4 text-violet-400" />
                    <span>Company Phone Numbers & Support Lines</span>
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">Add multiple phone numbers with departments (e.g. Sales, Rental Inquiries, Support).</p>
                </div>
                <button
                  type="button"
                  onClick={addPhone}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-600/20 hover:bg-violet-600/30 border border-violet-500/30 text-violet-300 font-semibold text-xs transition-all"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Phone</span>
                </button>
              </div>

              <div className="space-y-2.5">
                {phonesList.map((phoneItem, idx) => (
                  <div
                    key={phoneItem.id}
                    className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center gap-3"
                  >
                    <div className="w-full sm:w-1/3">
                      <label className="block text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 mb-1">Department / Label</label>
                      <input
                        type="text"
                        placeholder="e.g. Sales / Rental Inquiries"
                        value={phoneItem.label}
                        onChange={(e) => updatePhone(phoneItem.id, 'label', e.target.value)}
                        className="w-full px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs focus:border-violet-500 focus:outline-none"
                      />
                    </div>

                    <div className="w-full sm:w-1/3">
                      <label className="block text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 mb-1">Phone Number</label>
                      <input
                        type="text"
                        placeholder="+91 98765 43210"
                        value={phoneItem.number}
                        onChange={(e) => updatePhone(phoneItem.id, 'number', e.target.value)}
                        className="w-full px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-mono focus:border-violet-500 focus:outline-none"
                      />
                    </div>

                    <div className="flex items-center gap-4 sm:pt-4">
                      <label className="inline-flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-200 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={phoneItem.isWhatsApp}
                          onChange={(e) => updatePhone(phoneItem.id, 'isWhatsApp', e.target.checked)}
                          className="rounded border-slate-200 dark:border-slate-700 text-emerald-500 focus:ring-0"
                        />
                        <span className="text-[11px] text-emerald-400">WhatsApp</span>
                      </label>

                      <label className="inline-flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-200 cursor-pointer">
                        <input
                          type="radio"
                          name="primaryPhoneRadio"
                          checked={phoneItem.isPrimary}
                          onChange={() => updatePhone(phoneItem.id, 'isPrimary', true)}
                          className="border-slate-200 dark:border-slate-700 text-violet-600 focus:ring-0"
                        />
                        <span className="text-[11px] text-violet-400 font-semibold">Primary</span>
                      </label>
                    </div>

                    {phonesList.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removePhone(phoneItem.id)}
                        className="p-1.5 rounded-lg hover:bg-rose-500/20 text-slate-500 dark:text-slate-400 hover:text-rose-400 transition-colors sm:ml-auto sm:pt-4"
                        title="Delete Phone Number"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* MULTIPLE PHYSICAL ADDRESSES */}
            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-blue-400" />
                    <span>Offices & Physical Addresses</span>
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">Add multiple office locations (Headquarters, Regional branches, Warehouse/Rental depot).</p>
                </div>
                <button
                  type="button"
                  onClick={addAddress}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 text-blue-300 font-semibold text-xs transition-all"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Address</span>
                </button>
              </div>

              <div className="space-y-3">
                {addressesList.map((addrItem, idx) => (
                  <div
                    key={addrItem.id}
                    className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 space-y-2.5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="w-1/2">
                        <label className="block text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 mb-1">Office Name / Branch Title</label>
                        <input
                          type="text"
                          placeholder="e.g. Corporate Headquarters or Lucknow Tech Hub"
                          value={addrItem.title}
                          onChange={(e) => updateAddress(addrItem.id, 'title', e.target.value)}
                          className="w-full px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs focus:border-blue-500 focus:outline-none"
                        />
                      </div>

                      <div className="flex items-center gap-3">
                        <label className="inline-flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-200 cursor-pointer">
                          <input
                            type="radio"
                            name="primaryAddressRadio"
                            checked={addrItem.isPrimary}
                            onChange={() => updateAddress(addrItem.id, 'isPrimary', true)}
                            className="border-slate-200 dark:border-slate-700 text-blue-600 focus:ring-0"
                          />
                          <span className="text-[11px] text-blue-400 font-semibold">Primary HQ</span>
                        </label>

                        {addressesList.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeAddress(addrItem.id)}
                            className="p-1.5 rounded-lg hover:bg-rose-500/20 text-slate-500 dark:text-slate-400 hover:text-rose-400 transition-colors"
                            title="Delete Address"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 mb-1">Complete Address Details</label>
                      <textarea
                        rows={2}
                        placeholder="Street address, building, landmark, city, state, postal code"
                        value={addrItem.address}
                        onChange={(e) => updateAddress(addrItem.id, 'address', e.target.value)}
                        className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs focus:border-blue-500 focus:outline-none resize-none"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* SOCIAL TAB */}
        {activeTab === 'social' && (
          <div className="space-y-4">
            <h2 className="text-base font-bold text-slate-900 dark:text-white mb-2">Social Handles & Links</h2>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-200 uppercase mb-1">LinkedIn URL</label>
                <input
                  type="text"
                  value={settings.social_linkedin || ''}
                  onChange={(e) => handleChange('social_linkedin', e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-xs focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-200 uppercase mb-1">GitHub URL</label>
                <input
                  type="text"
                  value={settings.social_github || ''}
                  onChange={(e) => handleChange('social_github', e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-xs focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-200 uppercase mb-1">X / Twitter URL</label>
                <input
                  type="text"
                  value={settings.social_twitter || ''}
                  onChange={(e) => handleChange('social_twitter', e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-xs focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-200 uppercase mb-1">Instagram URL</label>
                <input
                  type="text"
                  value={settings.social_instagram || ''}
                  onChange={(e) => handleChange('social_instagram', e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-xs focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>
          </div>
        )}

        {/* SEO TAB */}
        {activeTab === 'seo' && (
          <div className="space-y-4">
            <h2 className="text-base font-bold text-slate-900 dark:text-white mb-2">Default SEO Configuration</h2>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-200 uppercase mb-1">Default Meta Title</label>
              <input
                type="text"
                value={settings.seo_default_title || ''}
                onChange={(e) => handleChange('seo_default_title', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-xs focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-200 uppercase mb-1">Default Meta Description</label>
              <textarea
                rows={3}
                value={settings.seo_default_description || ''}
                onChange={(e) => handleChange('seo_default_description', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-xs focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-200 uppercase mb-1">Default Open Graph Image</label>
                <input
                  type="text"
                  value={settings.seo_og_image || ''}
                  onChange={(e) => handleChange('seo_og_image', e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-xs focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-200 uppercase mb-1">Google Analytics ID</label>
                <input
                  type="text"
                  placeholder="G-XXXXXXXXXX"
                  value={settings.google_analytics_id || ''}
                  onChange={(e) => handleChange('google_analytics_id', e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-xs focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>
          </div>
        )}

        {/* WEBSITE ASSETS TAB */}
        {activeTab === 'website' && (
          <div className="space-y-4">
            <h2 className="text-base font-bold text-slate-900 dark:text-white mb-2">Website Branding & Footer</h2>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-200 uppercase mb-1">Logo Brand Text</label>
              <input
                type="text"
                value={settings.website_logo_text || ''}
                onChange={(e) => handleChange('website_logo_text', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-xs focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-200 uppercase mb-1">Footer Copyright Text</label>
              <input
                type="text"
                value={settings.website_footer_text || ''}
                onChange={(e) => handleChange('website_footer_text', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-xs focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>
        )}

        <div className="pt-4 flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs inline-flex items-center gap-2 shadow-lg disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving...' : 'Save Settings'}</span>
          </button>
        </div>

      </form>
    </div>
  );
}
