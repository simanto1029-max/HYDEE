import React, { useState } from 'react';
import {
  Truck,
  Settings,
  Database,
  Download,
  Upload,
  RotateCcw,
  Check,
  ShieldCheck,
  FileText,
  AlertCircle,
  Eye,
  EyeOff,
  ExternalLink,
  RefreshCw,
  KeyRound,
} from 'lucide-react';
import { store } from '../../services/store';
import {
  isSupabaseConfigured,
  getSupabaseConfig,
  saveSupabaseConfig,
  testSupabaseConnection,
} from '../../services/supabase';
import { DeliveryZone, SiteSettings } from '../../types';

export const AdminSettings: React.FC = () => {
  const [settings, setSettings] = useState<SiteSettings>(store.getSettings());
  const [zones, setZones] = useState<DeliveryZone[]>(store.getDeliveryZones());
  const [auditLogs, setAuditLogs] = useState(store.getAuditLogs());
  const [savedNotice, setSavedNotice] = useState<string | null>(null);

  const initialSb = getSupabaseConfig();
  const [sbUrl, setSbUrl] = useState(initialSb.url);
  const [sbAnonKey, setSbAnonKey] = useState(initialSb.anonKey);
  const [showSbKey, setShowSbKey] = useState(false);
  const [isTestingSb, setIsTestingSb] = useState(false);
  const [sbTestResult, setSbTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [sbConnected, setSbConnected] = useState(initialSb.isConfigured);

  const [importJsonText, setImportJsonText] = useState('');
  const [importStatus, setImportStatus] = useState<string | null>(null);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    store.updateSettings(settings);
    setSavedNotice('Store settings successfully updated.');
    setTimeout(() => setSavedNotice(null), 3000);
  };

  const handleSaveZone = (zone: DeliveryZone) => {
    store.saveDeliveryZone(zone);
    setZones(store.getDeliveryZones());
    setSavedNotice(`Updated advance fee for ${zone.name}`);
    setTimeout(() => setSavedNotice(null), 3000);
  };

  const handleExportDatabase = () => {
    const data = store.exportDatabaseJson();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `hydee_backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportDatabase = () => {
    if (!importJsonText.trim()) return;
    const success = store.importDatabaseJson(importJsonText);
    if (success) {
      setImportStatus('Database successfully restored from JSON backup.');
      setSettings(store.getSettings());
      setZones(store.getDeliveryZones());
      setAuditLogs(store.getAuditLogs());
      setImportJsonText('');
    } else {
      setImportStatus('Failed to import JSON: Invalid format.');
    }
  };

  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const handleResetPristine = () => {
    store.resetToDefault();
    setSettings(store.getSettings());
    setZones(store.getDeliveryZones());
    setAuditLogs(store.getAuditLogs());
    setShowResetConfirm(false);
    setSavedNotice('Reset to initial boutique catalog complete.');
    setTimeout(() => setSavedNotice(null), 3000);
  };

  const handleRestoreDemoCatalog = () => {
    store.restoreDemoProducts();
    setSavedNotice('15 luxury demo pieces restored to catalog.');
    setTimeout(() => setSavedNotice(null), 3000);
  };

  const handleRestoreDemoCategories = () => {
    store.restoreDemoCategories();
    setSavedNotice('5 luxury categories restored to catalog.');
    setTimeout(() => setSavedNotice(null), 3000);
  };

  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="pb-6 border-b border-neutral-200">
        <span className="text-[11px] font-bold tracking-[0.2em] text-[#800000] uppercase block">
          INFRASTRUCTURE & ATELIER CONFIG
        </span>
        <h2 className="font-serif text-2xl sm:text-3xl font-bold text-neutral-950 mt-0.5">
          Store Operations & Delivery Rules
        </h2>
      </div>

      {savedNotice && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
          <Check className="w-4 h-4" />
          <span>{savedNotice}</span>
        </div>
      )}

      {/* Delivery Zones & Standard Shipping Fees */}
      <div className="bg-white rounded-2xl border border-neutral-200 shadow-xs p-6 space-y-6">
        <div>
          <h3 className="font-serif text-lg font-bold text-neutral-950 flex items-center gap-2">
            <Truck className="w-5 h-5 text-[#800000]" />
            <span>Delivery Zones & Standard Shipping Fees</span>
          </h3>
          <p className="text-xs text-neutral-500 mt-1">
            Specify the standard delivery fee added to orders for each geographical region across Bangladesh.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {zones.map((zone) => (
            <div key={zone.id} className="p-5 rounded-2xl border border-neutral-200 bg-neutral-50/50 space-y-3 text-xs">
              <span className="font-bold text-neutral-900 block text-sm">{zone.name}</span>
              <div>
                <label className="block text-neutral-600 font-semibold mb-1">
                  Standard Delivery Fee (৳ BDT)
                </label>
                <input
                  type="number"
                  value={zone.advanceFee}
                  onChange={(e) => {
                    const updated = { ...zone, advanceFee: Number(e.target.value) };
                    handleSaveZone(updated);
                  }}
                  className="w-full p-2.5 bg-white border border-neutral-200 rounded-xl font-bold text-neutral-900"
                />
              </div>

              <div>
                <label className="block text-neutral-600 font-semibold mb-1">
                  Estimated Transit Time
                </label>
                <input
                  type="text"
                  value={zone.estimatedDays}
                  onChange={(e) => {
                    const updated = { ...zone, estimatedDays: e.target.value };
                    handleSaveZone(updated);
                  }}
                  className="w-full p-2.5 bg-white border border-neutral-200 rounded-xl"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Store Identity & Concierge Settings */}
      <div className="bg-white rounded-2xl border border-neutral-200 shadow-xs p-6 space-y-6">
        <h3 className="font-serif text-lg font-bold text-neutral-950 flex items-center gap-2">
          <Settings className="w-5 h-5 text-[#800000]" />
          <span>Brand Identity & Contact Details (Shown in Header & Footer)</span>
        </h3>

        <form onSubmit={handleSaveSettings} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold mb-1">Brand Name</label>
              <input
                type="text"
                value={settings.brandName}
                onChange={(e) => setSettings({ ...settings, brandName: e.target.value })}
                className="w-full p-3 border border-neutral-200 rounded-xl"
              />
            </div>

            <div>
              <label className="block font-semibold mb-1">WhatsApp Concierge Number</label>
              <input
                type="text"
                value={settings.whatsappNumber}
                onChange={(e) => setSettings({ ...settings, whatsappNumber: e.target.value })}
                placeholder="8801700000000"
                className="w-full p-3 border border-neutral-200 rounded-xl font-mono"
              />
              <span className="text-[10px] text-neutral-400 mt-0.5 block">Format: 88017XXXXXXXX</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold mb-1">Customer Helpline / Contact Phone</label>
              <input
                type="text"
                value={settings.hotlinePhone}
                onChange={(e) => setSettings({ ...settings, hotlinePhone: e.target.value })}
                placeholder="+880 1700-000000"
                className="w-full p-3 border border-neutral-200 rounded-xl"
              />
            </div>

            <div>
              <label className="block font-semibold mb-1">Official Support Email</label>
              <input
                type="email"
                value={settings.supportEmail}
                onChange={(e) => setSettings({ ...settings, supportEmail: e.target.value })}
                placeholder="support@hydee.com"
                className="w-full p-3 border border-neutral-200 rounded-xl"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold mb-1">Tangail Location / Atelier Address *</label>
              <input
                type="text"
                value={settings.tangailLocation || settings.address}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    tangailLocation: e.target.value,
                    address: e.target.value,
                  })
                }
                placeholder="Main Atelier, Tangail, Dhaka Division, Bangladesh"
                className="w-full p-3 border border-neutral-200 rounded-xl"
              />
              <span className="text-[10px] text-neutral-400 mt-0.5 block">Displayed prominently in header and footer</span>
            </div>

            <div>
              <label className="block font-semibold mb-1">Brand Tagline</label>
              <input
                type="text"
                value={settings.tagline}
                onChange={(e) => setSettings({ ...settings, tagline: e.target.value })}
                className="w-full p-3 border border-neutral-200 rounded-xl"
              />
            </div>
          </div>

          {/* Announcement Bar */}
          <div className="pt-2 border-t border-neutral-100">
            <div className="flex items-center space-x-2 mb-2">
              <input
                type="checkbox"
                id="announcementBar"
                checked={settings.announcementBarEnabled}
                onChange={(e) => setSettings({ ...settings, announcementBarEnabled: e.target.checked })}
                className="rounded-sm text-[#800000]"
              />
              <label htmlFor="announcementBar" className="font-semibold text-neutral-800">
                Display Top Announcement Bar
              </label>
            </div>
            {settings.announcementBarEnabled && (
              <input
                type="text"
                value={settings.announcementBarText || ''}
                onChange={(e) => setSettings({ ...settings, announcementBarText: e.target.value })}
                placeholder="Complimentary atelier box with all orders over ৳15,000"
                className="w-full p-3 border border-neutral-200 rounded-xl"
              />
            )}
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              className="bg-[#800000] hover:bg-[#5c0000] text-white px-6 py-3 rounded-xl font-semibold uppercase tracking-wider cursor-pointer"
            >
              Update Atelier Settings
            </button>
          </div>
        </form>
      </div>

      {/* Admin Login Credentials & Security Card */}
      <div className="bg-white rounded-2xl border border-neutral-200 shadow-xs p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-5 h-5 text-[#800000]" />
            <h3 className="font-serif text-lg font-bold text-neutral-950">
              Admin Portal Security & Login Credentials
            </h3>
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider bg-neutral-100 text-neutral-700 px-2.5 py-1 rounded-md">
            Private Access
          </span>
        </div>

        <p className="text-xs text-neutral-600">
          Update the staff email and security password used to log in at <code>/admin</code>. These credentials are completely private and never visible to customers.
        </p>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            store.updateAdminCredentials(settings.adminEmail, settings.adminPassword);
            setSavedNotice('Admin security credentials updated successfully.');
            setTimeout(() => setSavedNotice(null), 3000);
          }}
          className="space-y-4 text-xs"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold mb-1">Admin Login Email</label>
              <input
                type="email"
                required
                value={settings.adminEmail || 'simanto1029@gmail.com'}
                onChange={(e) => setSettings({ ...settings, adminEmail: e.target.value })}
                className="w-full p-3 border border-neutral-200 rounded-xl font-semibold"
              />
            </div>

            <div>
              <label className="block font-semibold mb-1">Admin Security Password</label>
              <input
                type="text"
                required
                value={settings.adminPassword || 'soumik1029'}
                onChange={(e) => setSettings({ ...settings, adminPassword: e.target.value })}
                className="w-full p-3 border border-neutral-200 rounded-xl font-mono font-semibold"
              />
              <span className="text-[10px] text-neutral-400 mt-0.5 block">
                Set any custom password of your choice
              </span>
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              className="bg-neutral-900 hover:bg-black text-white px-6 py-3 rounded-xl font-semibold uppercase tracking-wider cursor-pointer"
            >
              Save New Admin Password
            </button>
          </div>
        </form>
      </div>

      {/* Supabase PostgreSQL Cloud Integration & Live Sync */}
      <div className="bg-white rounded-2xl border border-neutral-200 shadow-xs p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-neutral-100">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#800000]/10 flex items-center justify-center text-[#800000]">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif text-lg font-bold text-neutral-950">
                Supabase Live Cloud Integration & Multi-Device Sync
              </h3>
              <p className="text-xs text-neutral-500">
                Real-time PostgreSQL sync for instant updates across mobile, desktop, and global visitors.
              </p>
            </div>
          </div>
          <span
            className={`self-start sm:self-auto text-xs font-bold px-3.5 py-1.5 rounded-full inline-flex items-center gap-1.5 ${
              sbConnected
                ? 'bg-emerald-100 text-emerald-800'
                : 'bg-amber-100 text-amber-800'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${sbConnected ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`} />
            {sbConnected ? 'Cloud Supabase Active' : 'Local Storage Mode'}
          </span>
        </div>

        {/* Credentials Form */}
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-neutral-800 uppercase tracking-wider mb-1.5">
              1. Project URL (<span className="font-mono text-[#800000]">VITE_SUPABASE_URL</span>)
            </label>
            <input
              type="text"
              placeholder="e.g. https://wlmbxcjxoxvfyyknnxus.supabase.co"
              value={sbUrl}
              onChange={(e) => {
                setSbUrl(e.target.value);
                setSbTestResult(null);
              }}
              className="w-full text-xs font-mono p-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:bg-white focus:border-[#800000] focus:ring-1 focus:ring-[#800000] transition-colors"
            />
            <p className="text-[11px] text-neutral-500 mt-1">
              Your Supabase project URL (format: <code className="text-neutral-700 font-mono">https://&lt;project-id&gt;.supabase.co</code>)
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-neutral-800 uppercase tracking-wider mb-1.5 flex items-center justify-between">
              <span>2. Anon Public Key (<span className="font-mono text-[#800000]">VITE_SUPABASE_ANON_KEY</span>)</span>
              <button
                type="button"
                onClick={() => setShowSbKey(!showSbKey)}
                className="text-[11px] font-normal text-neutral-500 hover:text-neutral-900 inline-flex items-center gap-1 cursor-pointer"
              >
                {showSbKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                <span>{showSbKey ? 'Hide Key' : 'Reveal Key'}</span>
              </button>
            </label>
            <input
              type={showSbKey ? 'text' : 'password'}
              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
              value={sbAnonKey}
              onChange={(e) => {
                setSbAnonKey(e.target.value);
                setSbTestResult(null);
              }}
              className="w-full text-xs font-mono p-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:bg-white focus:border-[#800000] focus:ring-1 focus:ring-[#800000] transition-colors"
            />
            <p className="text-[11px] text-neutral-500 mt-1">
              The public anonymous JWT token found under <strong>Project Settings &gt; API &gt; Project API keys &gt; anon public</strong>.
            </p>
          </div>

          {/* Test & Save Actions */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              type="button"
              disabled={isTestingSb || !sbUrl.trim() || !sbAnonKey.trim()}
              onClick={async () => {
                setIsTestingSb(true);
                setSbTestResult(null);
                try {
                  const saved = saveSupabaseConfig(sbUrl, sbAnonKey);
                  const result = await testSupabaseConnection();
                  setSbTestResult(result);
                  setSbConnected(result.success);
                  if (result.success) {
                    await store.syncFromSupabase();
                    setSavedNotice('Supabase connected! Catalog synced with PostgreSQL cloud database.');
                    setTimeout(() => setSavedNotice(null), 4000);
                  }
                } finally {
                  setIsTestingSb(false);
                }
              }}
              className="bg-[#800000] hover:bg-[#600000] text-white text-xs font-semibold px-5 py-3 rounded-xl uppercase tracking-wider inline-flex items-center gap-2 cursor-pointer transition-colors disabled:opacity-40"
            >
              {isTestingSb ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Connecting & Testing...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Save & Connect Cloud Database</span>
                </>
              )}
            </button>

            {sbConnected && (
              <button
                type="button"
                onClick={async () => {
                  setIsTestingSb(true);
                  try {
                    await store.syncFromSupabase();
                    setSavedNotice('Manually re-synced all categories, products, and orders from Supabase.');
                    setTimeout(() => setSavedNotice(null), 3000);
                  } finally {
                    setIsTestingSb(false);
                  }
                }}
                className="border border-neutral-200 hover:bg-neutral-50 text-neutral-800 text-xs font-semibold px-4 py-3 rounded-xl uppercase tracking-wider inline-flex items-center gap-2 cursor-pointer transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Pull Fresh Data Now</span>
              </button>
            )}
          </div>

          {/* Result notice */}
          {sbTestResult && (
            <div
              className={`p-3.5 rounded-xl border text-xs flex items-start gap-2.5 ${
                sbTestResult.success
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  : 'bg-red-50 border-red-200 text-red-900'
              }`}
            >
              {sbTestResult.success ? (
                <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              )}
              <div>
                <p className="font-semibold">{sbTestResult.success ? 'Connected Successfully!' : 'Connection Error'}</p>
                <p className="text-[11px] opacity-90 mt-0.5">{sbTestResult.message}</p>
              </div>
            </div>
          )}
        </div>

        {/* Step-by-Step Guide for Supabase & Vercel */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          {/* Guide 1: How to find in Supabase */}
          <div className="p-4 bg-neutral-50 border border-neutral-200 rounded-xl space-y-2 text-xs">
            <div className="flex items-center gap-2 text-neutral-900 font-bold">
              <KeyRound className="w-4 h-4 text-[#800000]" />
              <span>কোথা থেকে পাবেন (Supabase Dashboard):</span>
            </div>
            <ol className="list-decimal list-inside space-y-1.5 text-neutral-600 text-[11px] leading-relaxed">
              <li>
                <strong className="text-neutral-800">supabase.com/dashboard</strong> এ গিয়ে আপনার প্রজেক্ট ওপেন করুন।
              </li>
              <li>
                বাম পাশের মেনুর একদম নিচে থাকা <strong>Project Settings ⚙️ (Gear Icon)</strong> এ ক্লিক করুন।
              </li>
              <li>
                সেটিংস থেকে <strong>API</strong> (বা Data API) অপশনে যান।
              </li>
              <li>
                সেখানে <strong className="text-[#800000]">Project URL</strong> এবং <strong className="text-[#800000]">Project API keys</strong> এর অধীনে <code className="bg-neutral-200 px-1 py-0.5 rounded font-mono">anon public</code> কি-টি কপি করুন।
              </li>
            </ol>
          </div>

          {/* Guide 2: How to add to Vercel */}
          <div className="p-4 bg-neutral-50 border border-neutral-200 rounded-xl space-y-2 text-xs">
            <div className="flex items-center gap-2 text-neutral-900 font-bold">
              <ExternalLink className="w-4 h-4 text-[#800000]" />
              <span>কোথায় বসাবেন (Vercel Production):</span>
            </div>
            <ol className="list-decimal list-inside space-y-1.5 text-neutral-600 text-[11px] leading-relaxed">
              <li>
                <strong className="text-neutral-800">vercel.com</strong> এ আপনার HYDEE প্রজেক্টের ড্যাশবোর্ডে যান।
              </li>
              <li>
                উপরের মেনু থেকে <strong>Settings</strong> &gt; <strong>Environment Variables</strong> এ যান।
              </li>
              <li>
                Key: <code className="bg-neutral-200 px-1 py-0.5 rounded font-mono font-bold">VITE_SUPABASE_URL</code> এবং Value তে আপনার Supabase URL দিন।
              </li>
              <li>
                Key: <code className="bg-neutral-200 px-1 py-0.5 rounded font-mono font-bold">VITE_SUPABASE_ANON_KEY</code> এবং Value তে anon key দিন।
              </li>
              <li>
                <strong>Deployments</strong> ট্যাবে গিয়ে ৩ ডটে ক্লিক করে <strong>Redeploy</strong> চাপুন। ব্যাস!
              </li>
            </ol>
          </div>
        </div>
      </div>

      {/* Database Backup & Restore */}
      <div className="bg-white rounded-2xl border border-neutral-200 shadow-xs p-6 space-y-4">
        <h3 className="font-serif text-lg font-bold text-neutral-950 flex items-center gap-2">
          <FileText className="w-5 h-5 text-[#800000]" />
          <span>JSON Database Backup, Export & Factory Reset</span>
        </h3>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleExportDatabase}
            className="bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-semibold px-5 py-3 rounded-xl uppercase tracking-wider inline-flex items-center gap-2 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Export Backup JSON</span>
          </button>

          <button
            onClick={handleRestoreDemoCatalog}
            className="bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-xs font-semibold px-4 py-3 rounded-xl uppercase tracking-wider inline-flex items-center gap-2 cursor-pointer"
            title="Load the 15 editorial demo samples back into the catalog"
          >
            <Database className="w-4 h-4 text-[#800000]" />
            <span>Restore 15 Sample Demo Pieces</span>
          </button>

          <button
            onClick={handleRestoreDemoCategories}
            className="bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-xs font-semibold px-4 py-3 rounded-xl uppercase tracking-wider inline-flex items-center gap-2 cursor-pointer"
            title="Load the 5 luxury categories back into the catalog"
          >
            <Database className="w-4 h-4 text-neutral-700" />
            <span>Restore 5 Sample Categories</span>
          </button>

          <button
            onClick={() => setShowResetConfirm(true)}
            className="border border-red-300 text-red-700 hover:bg-red-50 text-xs font-semibold px-4 py-3 rounded-xl uppercase tracking-wider inline-flex items-center gap-2 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Factory Reset Catalog</span>
          </button>
        </div>

        {importStatus && (
          <div className="p-3 bg-neutral-100 text-xs text-neutral-800 rounded-xl">
            {importStatus}
          </div>
        )}

        <div className="pt-2">
          <label className="block text-xs font-semibold mb-1 text-neutral-700">
            Restore Database from JSON:
          </label>
          <textarea
            rows={2}
            placeholder="Paste exported JSON content here..."
            value={importJsonText}
            onChange={(e) => setImportJsonText(e.target.value)}
            className="w-full text-xs font-mono p-3 border border-neutral-200 rounded-xl"
          />
          <button
            onClick={handleImportDatabase}
            disabled={!importJsonText.trim()}
            className="mt-2 bg-neutral-800 text-white text-xs font-semibold px-4 py-2 rounded-lg disabled:opacity-30"
          >
            Import JSON Backup
          </button>
        </div>
      </div>

      {/* Staff Audit Logs Table */}
      <div className="bg-white rounded-2xl border border-neutral-200 shadow-xs p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
          <h3 className="font-serif text-base font-bold text-neutral-950 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-[#800000]" />
            <span>Staff Security Audit Trail</span>
          </h3>
          <span className="text-xs text-neutral-400">{auditLogs.length} events logged</span>
        </div>

        <div className="max-h-60 overflow-y-auto no-scrollbar divide-y divide-neutral-100 text-xs">
          {auditLogs.length === 0 ? (
            <p className="p-4 text-neutral-400 text-center">No audit records logged yet.</p>
          ) : (
            auditLogs.map((log) => (
              <div key={log.id} className="py-2.5 flex items-center justify-between">
                <div>
                  <span className="font-bold text-neutral-900 block">{log.action}</span>
                  <span className="text-neutral-500 text-[11px]">{log.details}</span>
                </div>
                <div className="text-right text-[10px] text-neutral-400">
                  <span className="block font-medium text-neutral-600">{log.user}</span>
                  <span>{new Date(log.timestamp).toLocaleString()}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Factory Reset Confirmation Modal */}
      {showResetConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowResetConfirm(false);
          }}
        >
          <div className="bg-white rounded-2xl sm:rounded-3xl max-w-md w-full shadow-2xl border border-neutral-200 overflow-hidden relative p-6 space-y-4">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-full bg-red-100 text-red-700 flex items-center justify-center shrink-0">
                <AlertCircle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="font-serif text-lg font-bold text-neutral-950">
                  Reset Atelier Catalog?
                </h3>
                <p className="text-xs text-neutral-500 mt-1">
                  This will reset products, orders, and configurations to the original baseline. Are you sure?
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowResetConfirm(false)}
                className="px-4 py-2.5 border border-neutral-200 hover:bg-neutral-50 rounded-xl text-xs font-semibold text-neutral-700 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleResetPristine}
                className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Yes, Reset Catalog</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
