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
} from 'lucide-react';
import { store } from '../../services/store';
import { isSupabaseConfigured } from '../../services/supabase';
import { DeliveryZone, SiteSettings } from '../../types';

export const AdminSettings: React.FC = () => {
  const [settings, setSettings] = useState<SiteSettings>(store.getSettings());
  const [zones, setZones] = useState<DeliveryZone[]>(store.getDeliveryZones());
  const [auditLogs, setAuditLogs] = useState(store.getAuditLogs());
  const [savedNotice, setSavedNotice] = useState<string | null>(null);

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

      {/* Delivery Zones & Required Advance Payment Fees */}
      <div className="bg-white rounded-2xl border border-neutral-200 shadow-xs p-6 space-y-6">
        <div>
          <h3 className="font-serif text-lg font-bold text-neutral-950 flex items-center gap-2">
            <Truck className="w-5 h-5 text-[#800000]" />
            <span>Delivery Zones & Required Advance Fees (Cash on Delivery Model)</span>
          </h3>
          <p className="text-xs text-neutral-500 mt-1">
            Specify the required advance delivery fee customer must pay prior to parcel dispatch for each geographical area.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {zones.map((zone) => (
            <div key={zone.id} className="p-5 rounded-2xl border border-neutral-200 bg-neutral-50/50 space-y-3 text-xs">
              <span className="font-bold text-neutral-900 block text-sm">{zone.name}</span>
              <div>
                <label className="block text-neutral-600 font-semibold mb-1">
                  Required Advance Fee (৳ BDT)
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
                value={settings.adminEmail || 'admin@hydee.com'}
                onChange={(e) => setSettings({ ...settings, adminEmail: e.target.value })}
                className="w-full p-3 border border-neutral-200 rounded-xl font-semibold"
              />
            </div>

            <div>
              <label className="block font-semibold mb-1">Admin Security Password</label>
              <input
                type="text"
                required
                value={settings.adminPassword || 'hydee2026'}
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

      {/* Supabase PostgreSQL Backend Status */}
      <div className="bg-white rounded-2xl border border-neutral-200 shadow-xs p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
          <div className="flex items-center space-x-2">
            <Database className="w-5 h-5 text-[#800000]" />
            <h3 className="font-serif text-lg font-bold text-neutral-950">
              Supabase Backend Architecture
            </h3>
          </div>
          <span
            className={`text-[11px] font-bold px-3 py-1 rounded-full ${
              isSupabaseConfigured
                ? 'bg-emerald-100 text-emerald-800'
                : 'bg-neutral-100 text-neutral-600'
            }`}
          >
            {isSupabaseConfigured ? 'Connected (Live Supabase API)' : 'Local Storage Engine (Active)'}
          </span>
        </div>

        <p className="text-xs text-neutral-600 leading-relaxed">
          HYDEE is equipped with automated Supabase Cloud synchronization. To make sure products, categories, and orders sync live across all browsers and devices without any RLS permission errors, run the setup script in your Supabase SQL Editor:
        </p>

        <div className="p-3 bg-neutral-50 border border-neutral-200 rounded-xl text-xs space-y-1">
          <p className="font-semibold text-neutral-900">
            📄 SQL Setup Script: <span className="font-mono text-[#800000]">/supabase/HYDEE_SUPABASE_SETUP.sql</span>
          </p>
          <p className="text-neutral-500 text-[11px]">
            Open this file, copy all lines, and paste into <strong>Supabase Dashboard &gt; SQL Editor &gt; Run</strong>. It creates all tables and grants full access to your Vercel deployment.
          </p>
        </div>

        <div className="p-4 bg-neutral-900 text-neutral-200 rounded-xl font-mono text-[11px] space-y-1">
          <p>VITE_SUPABASE_URL="https://your-project.supabase.co"</p>
          <p>VITE_SUPABASE_ANON_KEY="your-anon-public-key"</p>
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
