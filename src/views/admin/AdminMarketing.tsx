import React, { useState, useEffect } from 'react';
import {
  Tag,
  Activity,
  Check,
  Plus,
  Trash2,
  Power,
  Info,
  HelpCircle,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react';
import { store } from '../../services/store';
import { metaPixel, PixelEventPayload } from '../../services/metaPixel';
import { Coupon, PromotionalPopup, SiteSettings } from '../../types';

export const AdminMarketing: React.FC = () => {
  const [promoConfig, setPromoConfig] = useState<PromotionalPopup>(store.getPromoPopup());
  const [settings, setSettings] = useState<SiteSettings>(store.getSettings());
  const [pixelEvents, setPixelEvents] = useState<PixelEventPayload[]>(metaPixel.getRecentEvents());
  const [coupons, setCoupons] = useState<Coupon[]>(store.getCoupons());
  const [savedNotice, setSavedNotice] = useState<string | null>(null);

  // New coupon form state
  const [showAddCoupon, setShowAddCoupon] = useState(false);
  const [newCode, setNewCode] = useState('');
  const [newDiscountType, setNewDiscountType] = useState<'percentage' | 'flat'>('flat');
  const [newDiscountValue, setNewDiscountValue] = useState<number>(500);
  const [newMinOrder, setNewMinOrder] = useState<number>(0);
  const [newDescription, setNewDescription] = useState('');
  const [couponError, setCouponError] = useState<string | null>(null);

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
    setSavedNotice('Meta Pixel integration updated successfully.');
    setTimeout(() => setSavedNotice(null), 3000);
  };

  const handleTestTriggerPixel = () => {
    metaPixel.track('PageView', { path: '/admin-test', source: 'admin_panel' });
  };

  const handleClearLogs = () => {
    metaPixel.clearLogs();
    setPixelEvents([]);
  };

  // Coupon handlers
  const handleCreateCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    setCouponError(null);

    const cleanCode = newCode.trim().toUpperCase();
    if (!cleanCode) {
      setCouponError('Please provide a coupon code.');
      return;
    }

    try {
      store.saveCoupon({
        code: cleanCode,
        discountType: newDiscountType,
        discountValue: Number(newDiscountValue),
        minOrderAmount: Number(newMinOrder) || 0,
        description: newDescription.trim() || undefined,
        isActive: true,
      });

      setCoupons(store.getCoupons());
      setNewCode('');
      setNewDiscountValue(500);
      setNewMinOrder(0);
      setNewDescription('');
      setShowAddCoupon(false);
      setSavedNotice(`Coupon "${cleanCode}" created successfully and ready for checkout!`);
      setTimeout(() => setSavedNotice(null), 3500);
    } catch (err: any) {
      setCouponError(err.message || 'Failed to create coupon.');
    }
  };

  const handleToggleCoupon = (id: string) => {
    store.toggleCouponStatus(id);
    setCoupons(store.getCoupons());
  };

  const handleDeleteCoupon = (id: string, code: string) => {
    if (window.confirm(`Delete coupon code "${code}"?`)) {
      store.deleteCoupon(id);
      setCoupons(store.getCoupons());
      setSavedNotice(`Coupon "${code}" deleted.`);
      setTimeout(() => setSavedNotice(null), 3000);
    }
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
          Create & manage dynamic discount coupons, audience modals, and audit live Meta Pixel conversions in real-time.
        </p>
      </div>

      {savedNotice && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2 font-semibold animate-in fade-in">
          <Check className="w-4 h-4 text-emerald-600" />
          <span>{savedNotice}</span>
        </div>
      )}

      {/* SECTION 1: DYNAMIC COUPON CODES & VOUCHERS MANAGEMENT */}
      <div className="bg-white rounded-2xl border border-neutral-200 shadow-xs p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-neutral-100 gap-4">
          <div>
            <h3 className="font-serif text-lg font-bold text-neutral-950 flex items-center gap-2">
              <Tag className="w-5 h-5 text-[#800000]" />
              <span>Coupon Codes & Discounts</span>
            </h3>
            <p className="text-xs text-neutral-500 mt-0.5">
              Coupons created here can be applied immediately at checkout by customers with instant validation.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowAddCoupon(!showAddCoupon)}
            className="inline-flex items-center gap-2 bg-[#800000] hover:bg-[#600000] text-white text-xs font-bold px-4 py-2.5 rounded-xl cursor-pointer transition-colors shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>{showAddCoupon ? 'Close Form' : 'Create New Coupon'}</span>
          </button>
        </div>

        {/* Add New Coupon Form Drawer */}
        {showAddCoupon && (
          <form onSubmit={handleCreateCoupon} className="p-5 bg-neutral-50 rounded-2xl border border-neutral-300 space-y-4 text-xs animate-in fade-in">
            <div className="flex justify-between items-center">
              <h4 className="font-bold text-sm text-neutral-900">Add New Promo Voucher</h4>
              <span className="text-[11px] text-neutral-500">Auto-validates minimum order & calculations</span>
            </div>

            {couponError && (
              <div className="p-2.5 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg font-semibold">
                {couponError}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div>
                <label className="block font-bold mb-1 uppercase text-[10px] text-neutral-700">
                  Coupon Code *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. EID15"
                  value={newCode}
                  onChange={(e) => setNewCode(e.target.value)}
                  className="w-full p-2.5 bg-white border border-neutral-300 rounded-xl font-mono font-bold text-sm uppercase focus:border-black focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-bold mb-1 uppercase text-[10px] text-neutral-700">
                  Discount Type *
                </label>
                <select
                  value={newDiscountType}
                  onChange={(e) => setNewDiscountType(e.target.value as 'percentage' | 'flat')}
                  className="w-full p-2.5 bg-white border border-neutral-300 rounded-xl font-semibold text-xs focus:border-black focus:outline-hidden"
                >
                  <option value="flat">Flat Amount (৳ Cash Off)</option>
                  <option value="percentage">Percentage (% Off)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold mb-1 uppercase text-[10px] text-neutral-700">
                  Discount Value * ({newDiscountType === 'flat' ? '৳ BDT' : '% Percent'})
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  value={newDiscountValue}
                  onChange={(e) => setNewDiscountValue(Number(e.target.value))}
                  className="w-full p-2.5 bg-white border border-neutral-300 rounded-xl font-bold text-sm focus:border-black focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-bold mb-1 uppercase text-[10px] text-neutral-700">
                  Minimum Order (৳ BDT)
                </label>
                <input
                  type="number"
                  min="0"
                  placeholder="0 (No minimum)"
                  value={newMinOrder}
                  onChange={(e) => setNewMinOrder(Number(e.target.value))}
                  className="w-full p-2.5 bg-white border border-neutral-300 rounded-xl font-bold text-sm focus:border-black focus:outline-hidden"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold mb-1 uppercase text-[10px] text-neutral-700">
                Description / Campaign Note
              </label>
              <input
                type="text"
                placeholder="e.g. Special Eid festive reward for returning VIP customers"
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                className="w-full p-2.5 bg-white border border-neutral-300 rounded-xl text-xs focus:border-black focus:outline-hidden"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAddCoupon(false)}
                className="px-4 py-2 border border-neutral-300 text-neutral-700 hover:bg-neutral-100 rounded-xl font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-[#800000] hover:bg-[#600000] text-white rounded-xl font-bold cursor-pointer"
              >
                Save & Enable Coupon
              </button>
            </div>
          </form>
        )}

        {/* Existing Coupons Table */}
        <div className="border border-neutral-200 rounded-xl overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-neutral-50 border-b border-neutral-200 text-neutral-600 font-bold uppercase text-[10px]">
              <tr>
                <th className="p-3">Coupon Code</th>
                <th className="p-3">Discount</th>
                <th className="p-3">Min Order</th>
                <th className="p-3">Usage</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {coupons.map((c) => (
                <tr key={c.id} className="hover:bg-neutral-50/80 transition-colors">
                  <td className="p-3">
                    <span className="font-mono font-bold text-sm text-neutral-950 bg-neutral-100 px-2.5 py-1 rounded-md border border-neutral-200">
                      {c.code}
                    </span>
                    {c.description && (
                      <p className="text-[11px] text-neutral-500 mt-1 line-clamp-1">{c.description}</p>
                    )}
                  </td>
                  <td className="p-3">
                    <span className="font-bold text-neutral-900">
                      {c.discountType === 'flat' ? `৳${c.discountValue.toLocaleString()} Flat` : `${c.discountValue}% Off`}
                    </span>
                  </td>
                  <td className="p-3 text-neutral-700 font-medium font-sans">
                    {c.minOrderAmount > 0 ? `৳${c.minOrderAmount.toLocaleString()}` : 'None (Any Order)'}
                  </td>
                  <td className="p-3 font-mono font-bold text-neutral-700">
                    {c.usageCount || 0} orders
                  </td>
                  <td className="p-3">
                    <button
                      type="button"
                      onClick={() => handleToggleCoupon(c.id)}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold cursor-pointer transition-all ${
                        c.isActive
                          ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                          : 'bg-neutral-200 text-neutral-600 hover:bg-neutral-300'
                      }`}
                      title="Click to toggle status"
                    >
                      <Power className="w-3 h-3" />
                      <span>{c.isActive ? 'Active' : 'Disabled'}</span>
                    </button>
                  </td>
                  <td className="p-3 text-right">
                    <button
                      type="button"
                      onClick={() => handleDeleteCoupon(c.id, c.code)}
                      className="p-1.5 text-neutral-400 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                      title="Delete coupon"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* SECTION 2: META PIXEL INTEGRATION & EXPLANATION */}
      <div className="bg-white rounded-2xl border border-neutral-200 shadow-xs p-6 space-y-6">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-neutral-100 gap-4">
          <div>
            <h3 className="font-serif text-lg font-bold text-neutral-950 flex items-center gap-2">
              <Activity className="w-5 h-5 text-[#800000]" />
              <span>Meta Pixel & Conversions API Inspector</span>
            </h3>
            <p className="text-xs text-neutral-500 mt-0.5">
              Tracks real visitors, conversions, and ad attribution seamlessly across your entire storefront.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleTestTriggerPixel}
              className="bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-semibold px-4 py-2 rounded-xl cursor-pointer"
            >
              Simulate Test Event
            </button>
            <button
              onClick={handleClearLogs}
              className="border border-neutral-200 text-neutral-600 hover:bg-neutral-50 text-xs font-semibold px-3 py-2 rounded-xl cursor-pointer"
            >
              Clear Log
            </button>
          </div>
        </div>

        {/* Detailed Explanation for Store Owner (How It Works) */}
        <div className="p-4 bg-sky-50/70 border border-sky-200 rounded-2xl text-xs space-y-2 text-sky-950">
          <div className="flex items-center gap-2 font-bold text-sky-900">
            <HelpCircle className="w-4 h-4 text-sky-700 shrink-0" />
            <span>Meta Pixel কীভাবে কাজ করে এবং আপনি এটি কীভাবে ব্যবহার করবেন?</span>
          </div>
          <p className="text-[11px] leading-relaxed text-sky-900/90 font-medium">
            ১. <strong>Pixel তৈরি:</strong> Meta Pixel মূলত আপনার <strong>Facebook / Meta Events Manager</strong> (বা Ads Manager) থেকে ১ বার তৈরি করতে হয়। সেখান থেকে আপনি যে <strong>১৫-১৬ ডিজিটের Pixel ID</strong> (যেমন: <code>984120394812391</code>) পান, সেটি নিচের বক্সে পেস্ট করে সেভ করে দিলেই হবে।<br />
            ২. <strong>অটোমেটিক ইভেন্ট ট্র্যাকিং:</strong> আপনাকে কোনো জটিল কোড বা স্ক্রিপ্ট পেস্ট করতে হবে না। আপনার ওয়েবসাইটের ভেতরে আমরা স্বয়ংক্রিয়ভাবে সব স্ট্যান্ডার্ড ই-কমার্স ইভেন্ট ইন্টিগ্রেট করে দিয়েছি:
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-[10px] font-mono font-bold">
            <div className="p-2 bg-white rounded-lg border border-sky-200 text-sky-900">
              👁️ PageView
              <span className="block text-[9px] font-sans font-normal text-sky-700">পেইজ ভিজিট করলে</span>
            </div>
            <div className="p-2 bg-white rounded-lg border border-sky-200 text-sky-900">
              🛍️ ViewContent
              <span className="block text-[9px] font-sans font-normal text-sky-700">প্রডাক্ট ডিটেইলস দেখলে</span>
            </div>
            <div className="p-2 bg-white rounded-lg border border-sky-200 text-sky-900">
              🛒 AddToCart
              <span className="block text-[9px] font-sans font-normal text-sky-700">ব্যাগে প্রডাক্ট যোগ করলে</span>
            </div>
            <div className="p-2 bg-white rounded-lg border border-sky-200 text-sky-900">
              💰 Purchase
              <span className="block text-[9px] font-sans font-normal text-sky-700">অর্ডার সফল হলে</span>
            </div>
          </div>
          <p className="text-[10px] text-sky-800 pt-1">
            ৩. <strong>Live Audit Log:</strong> নিচে রিয়েল-টাইম লগ দেখতে পাবেন—গ্রাহক ভিজিট বা অর্ডার করলে সাথে সাথে এখানে ইভেন্ট ধরা পড়ে।
          </p>
        </div>

        {/* Pixel Config Form */}
        <form onSubmit={handleSavePixel} className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-end text-xs">
          <div className="sm:col-span-5">
            <label className="block font-bold mb-1 text-neutral-800">
              Meta Pixel ID (From Meta Events Manager)
            </label>
            <input
              type="text"
              placeholder="e.g. 984120394812391"
              value={settings.metaPixelId || ''}
              onChange={(e) => setSettings({ ...settings, metaPixelId: e.target.value })}
              className="w-full p-3 border border-neutral-300 rounded-xl font-mono font-bold text-neutral-900 bg-white focus:border-black focus:outline-hidden"
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
              className="w-full bg-[#800000] hover:bg-[#600000] text-white py-3 rounded-xl font-bold uppercase tracking-wider cursor-pointer transition-colors shadow-xs"
            >
              Save Pixel Settings
            </button>
          </div>
        </form>

        {/* Live Event Stream Table */}
        <div className="border border-neutral-200 rounded-xl overflow-hidden">
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

      {/* SECTION 3: GLOBAL PROMOTIONAL POPUP MODAL */}
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
                className="w-full p-3 border border-neutral-200 rounded-xl font-mono uppercase font-bold"
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
              className="bg-[#800000] hover:bg-[#600000] text-white px-6 py-3 rounded-xl font-semibold uppercase tracking-wider cursor-pointer"
            >
              Save Promotional Modal
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
