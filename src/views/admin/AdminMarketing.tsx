import React, { useState, useEffect } from 'react';
import {
  Tag,
  Activity,
  Check,
  RotateCcw,
  Sliders,
  Sparkles,
  MessageCircle,
  Eye,
  ShieldAlert,
} from 'lucide-react';
import { store } from '../../services/store';
import { metaPixel, PixelEventPayload } from '../../services/metaPixel';
import { PromotionalPopup, SiteSettings } from '../../types';

export const AdminMarketing: React.FC = () => {
  const [promoConfig, setPromoConfig] = useState<PromotionalPopup>(store.getPromoPopup());
  const [settings, setSettings] = useState<SiteSettings>(store.getSettings());
  const [pixelEvents, setPixelEvents] = useState<PixelEventPayload[]>(metaPixel.getRecentEvents());
  const [savedNotice, setSavedNotice] = useState<string | null>(null);

  useEffect(() => {
    const handlePixelEvent = () => {
      setPixelEvents(metaPixel.getRecentEvents());
    };
    window.addEventListener('hydee_pixel_event', handlePixelEvent);
    return () => window.removeEventListener('hydee_pixel_event', handlePixelEvent);
  }, []);

  const handleSavePromo = (e: React.FormEvent) => {
    e.preventDefault();
    store.updatePromoPopup(promoConfig);
    setSavedNotice('Promotional popup settings updated.');
    setTimeout(() => setSavedNotice(null), 3000);
  };

  const handleSavePixel = (e: React.FormEvent) => {
    e.preventDefault();
    store.updateSettings({
      metaPixelId: settings.metaPixelId,
      isPixelTestMode: settings.isPixelTestMode,
    });
    localStorage.setItem('hydee_pixel_test_mode', settings.isPixelTestMode ? 'true' : 'false');
    metaPixel.init(settings.metaPixelId);
    setSavedNotice('Meta Pixel integration updated.');
    setTimeout(() => setSavedNotice(null), 3000);
  };

  const handleTestTriggerPixel = () => {
    metaPixel.track('PageView', { path: '/admin-test', source: 'admin_panel' });
  };

  const handleClearLogs = () => {
    metaPixel.clearLogs();
    setPixelEvents([]);
  };

  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="pb-6 border-b border-neutral-200">
        <span className="text-[11px] font-bold tracking-[0.2em] text-[#800000] uppercase block">
          GROWTH & TRACKING ENGINE
        </span>
        <h2 className="font-serif text-2xl sm:text-3xl font-bold text-neutral-950 mt-0.5">
          Promotions & Meta Pixel Audit
        </h2>
        <p className="text-xs text-neutral-500 mt-1">
          Configure audience modals, manage campaign vouchers, and inspect official Meta Pixel events in real-time.
        </p>
      </div>

      {savedNotice && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
          <Check className="w-4 h-4" />
          <span>{savedNotice}</span>
        </div>
      )}

      {/* Meta Pixel & Conversion Inspector */}
      <div className="bg-white rounded-2xl border border-neutral-200 shadow-xs p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-neutral-100 gap-4">
          <div>
            <h3 className="font-serif text-lg font-bold text-neutral-950 flex items-center gap-2">
              <Activity className="w-5 h-5 text-[#800000]" />
              <span>Meta Pixel & Conversions API Inspector</span>
            </h3>
            <p className="text-xs text-neutral-500 mt-0.5">
              Strict order-based deduplication ensures Purchase events fire ONLY once upon verified payment.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleTestTriggerPixel}
              className="bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-semibold px-4 py-2 rounded-xl"
            >
              Simulate Test Event
            </button>
            <button
              onClick={handleClearLogs}
              className="border border-neutral-200 text-neutral-600 hover:bg-neutral-50 text-xs font-semibold px-3 py-2 rounded-xl"
            >
              Clear Log
            </button>
          </div>
        </div>

        <form onSubmit={handleSavePixel} className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-end text-xs">
          <div className="sm:col-span-5">
            <label className="block font-semibold mb-1 text-neutral-800">Meta Pixel ID</label>
            <input
              type="text"
              placeholder="e.g. 984120394812391"
              value={settings.metaPixelId || ''}
              onChange={(e) => setSettings({ ...settings, metaPixelId: e.target.value })}
              className="w-full p-3 border border-neutral-200 rounded-xl font-mono"
            />
          </div>

          <div className="sm:col-span-4 flex items-center space-x-2 p-3 bg-neutral-50 rounded-xl border border-neutral-200">
            <input
              type="checkbox"
              id="pixelTestMode"
              checked={settings.isPixelTestMode}
              onChange={(e) => setSettings({ ...settings, isPixelTestMode: e.target.checked })}
              className="rounded-sm text-[#800000]"
            />
            <label htmlFor="pixelTestMode" className="cursor-pointer">
              <span className="font-bold text-neutral-900 block">Test & Sandbox Mode</span>
              <span className="text-[10px] text-neutral-500 block">Separates test runs from production ads</span>
            </label>
          </div>

          <div className="sm:col-span-3">
            <button
              type="submit"
              className="w-full bg-[#800000] hover:bg-[#5c0000] text-white py-3 rounded-xl font-semibold uppercase tracking-wider"
            >
              Save Pixel Settings
            </button>
          </div>
        </form>

        {/* Live Event Stream Table */}
        <div className="mt-4 border border-neutral-200 rounded-xl overflow-hidden">
          <div className="bg-neutral-50 p-3 text-[11px] font-bold text-neutral-600 border-b border-neutral-200 flex justify-between items-center">
            <span>REAL-TIME META PIXEL EVENT LOG ({pixelEvents.length} Captured)</span>
            <span className="text-[10px] text-neutral-400">Official Standard Events</span>
          </div>

          <div className="max-h-56 overflow-y-auto no-scrollbar divide-y divide-neutral-100 text-xs">
            {pixelEvents.length === 0 ? (
              <div className="p-6 text-center text-neutral-400">
                No events recorded yet in this session. Browse products or checkout to observe events.
              </div>
            ) : (
              pixelEvents.map((ev, i) => (
                <div key={i} className="p-3 hover:bg-neutral-50 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span
                      className={`font-mono font-bold px-2 py-0.5 rounded-md text-[10px] ${
                        ev.eventName === 'Purchase'
                          ? 'bg-[#800000] text-white'
                          : ev.eventName === 'AddToCart'
                          ? 'bg-amber-100 text-amber-900'
                          : ev.eventName === 'InitiateCheckout'
                          ? 'bg-blue-100 text-blue-900'
                          : 'bg-neutral-100 text-neutral-700'
                      }`}
                    >
                      {ev.eventName}
                    </span>
                    <span className="font-mono text-neutral-500 text-[10px]">{ev.eventId}</span>
                  </div>

                  <div className="flex items-center space-x-4 text-[11px]">
                    {ev.data && (
                      <span className="text-neutral-500 font-mono">
                        {JSON.stringify(ev.data).slice(0, 45)}...
                      </span>
                    )}
                    <span className="text-neutral-400 text-[10px]">{ev.timestamp}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Global Promotional Popup Configuration */}
      <div className="bg-white rounded-2xl border border-neutral-200 shadow-xs p-6 space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-neutral-100">
          <div>
            <h3 className="font-serif text-lg font-bold text-neutral-950 flex items-center gap-2">
              <Tag className="w-5 h-5 text-[#800000]" />
              <span>Global Promotional Popup</span>
            </h3>
            <p className="text-xs text-neutral-500 mt-0.5">
              Displays once per visitor within configurable period with localStorage dismissal memory.
            </p>
          </div>

          <label className="flex items-center space-x-2 cursor-pointer bg-neutral-50 px-3 py-1.5 rounded-xl border border-neutral-200">
            <input
              type="checkbox"
              checked={promoConfig.isEnabled}
              onChange={(e) => setPromoConfig({ ...promoConfig, isEnabled: e.target.checked })}
              className="rounded-sm text-[#800000]"
            />
            <span className="text-xs font-bold text-neutral-800">
              {promoConfig.isEnabled ? 'Active' : 'Disabled'}
            </span>
          </label>
        </div>

        <form onSubmit={handleSavePromo} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold mb-1">Popup Headline *</label>
              <input
                type="text"
                required
                value={promoConfig.title}
                onChange={(e) => setPromoConfig({ ...promoConfig, title: e.target.value })}
                className="w-full p-3 border border-neutral-200 rounded-xl"
              />
            </div>

            <div>
              <label className="block font-semibold mb-1">Voucher Code (Optional)</label>
              <input
                type="text"
                value={promoConfig.discountCode}
                onChange={(e) => setPromoConfig({ ...promoConfig, discountCode: e.target.value })}
                className="w-full p-3 border border-neutral-200 rounded-xl font-mono uppercase"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold mb-1">Subtext / Invitation Description</label>
            <textarea
              rows={2}
              value={promoConfig.subtitle}
              onChange={(e) => setPromoConfig({ ...promoConfig, subtitle: e.target.value })}
              className="w-full p-3 border border-neutral-200 rounded-xl"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block font-semibold mb-1">Delay Before Appearing (Seconds)</label>
              <input
                type="number"
                value={promoConfig.delaySeconds}
                onChange={(e) => setPromoConfig({ ...promoConfig, delaySeconds: Number(e.target.value) })}
                className="w-full p-3 border border-neutral-200 rounded-xl"
              />
            </div>

            <div>
              <label className="block font-semibold mb-1">Dismissal Memory (Days)</label>
              <input
                type="number"
                value={promoConfig.showOncePerDays}
                onChange={(e) => setPromoConfig({ ...promoConfig, showOncePerDays: Number(e.target.value) })}
                className="w-full p-3 border border-neutral-200 rounded-xl"
              />
            </div>

            <div>
              <label className="block font-semibold mb-1">Discount % Highlight</label>
              <input
                type="number"
                value={promoConfig.discountPercent}
                onChange={(e) => setPromoConfig({ ...promoConfig, discountPercent: Number(e.target.value) })}
                className="w-full p-3 border border-neutral-200 rounded-xl"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold mb-1">Banner Image URL</label>
            <input
              type="text"
              value={promoConfig.imageUrl}
              onChange={(e) => setPromoConfig({ ...promoConfig, imageUrl: e.target.value })}
              className="w-full p-3 border border-neutral-200 rounded-xl font-mono text-[11px]"
            />
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              className="bg-[#800000] hover:bg-[#5c0000] text-white px-6 py-3 rounded-xl font-semibold uppercase tracking-wider"
            >
              Save Promotional Modal
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
