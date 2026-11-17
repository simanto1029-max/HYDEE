import React, { useState } from 'react';
import { Plus, Trash2, ArrowUp, ArrowDown, Check, Gift, BadgeCheck } from 'lucide-react';
import { store } from '../../services/store';
import { TRUST_BADGE_ICONS } from '../../components/TrustBadgeStrip';
import { CartOfferRule, TrustBadge, TrustBadgeIcon } from '../../types';

const ICON_OPTIONS: { id: TrustBadgeIcon; label: string }[] = [
  { id: 'banknote', label: 'Cash' },
  { id: 'truck', label: 'Delivery truck' },
  { id: 'badge-check', label: 'Verified tick' },
  { id: 'shield-check', label: 'Shield' },
  { id: 'gift', label: 'Gift' },
  { id: 'clock', label: 'Clock' },
  { id: 'heart', label: 'Heart' },
  { id: 'star', label: 'Star' },
  { id: 'package', label: 'Package' },
  { id: 'lock', label: 'Lock' },
  { id: 'rotate-ccw', label: 'Return' },
  { id: 'phone', label: 'Phone' },
];

const newId = (prefix: string) => `${prefix}-${Date.now().toString(36)}${Math.floor(Math.random() * 100)}`;

export const AdminOffers: React.FC = () => {
  const initial = store.getSettings();
  const [badgesEnabled, setBadgesEnabled] = useState<boolean>(initial.trustBadgesEnabled !== false);
  const [badges, setBadges] = useState<TrustBadge[]>(initial.trustBadges || []);
  const [offersEnabled, setOffersEnabled] = useState<boolean>(initial.cartOffersEnabled !== false);
  const [offers, setOffers] = useState<CartOfferRule[]>(initial.cartOffers || []);
  const [saved, setSaved] = useState(false);

  const updateBadge = (id: string, patch: Partial<TrustBadge>) =>
    setBadges((list) => list.map((b) => (b.id === id ? { ...b, ...patch } : b)));

  const moveBadge = (index: number, dir: -1 | 1) =>
    setBadges((list) => {
      const next = [...list];
      const target = index + dir;
      if (target < 0 || target >= next.length) return list;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });

  const updateOffer = (id: string, patch: Partial<CartOfferRule>) =>
    setOffers((list) => list.map((o) => (o.id === id ? { ...o, ...patch } : o)));

  const handleSave = () => {
    store.updateSettings({
      trustBadgesEnabled: badgesEnabled,
      trustBadges: badges,
      cartOffersEnabled: offersEnabled,
      cartOffers: offers.map((o) => ({
        ...o,
        minProducts: Math.max(2, Math.round(Number(o.minProducts) || 2)),
        extraDiscountPercent: Math.max(0, Math.min(90, Number(o.extraDiscountPercent) || 0)),
      })),
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="space-y-10">
      <div className="pb-6 border-b border-neutral-200 flex flex-wrap items-end justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold tracking-[0.2em] text-[#800000] uppercase block">
            STOREFRONT OFFERS
          </span>
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-neutral-950 mt-0.5">Offers & Badges</h2>
          <p className="text-xs text-neutral-500 mt-1 max-w-xl">
            Everything here shows on the website straight after you press Save. The Buy 1 / Buy 2 / Buy 3 prices of a single product are
            edited inside Products → Edit product.
          </p>
        </div>
        <button
          type="button"
          onClick={handleSave}
          className="bg-[#800000] hover:bg-[#600000] text-white text-xs font-bold px-6 py-3 rounded-xl cursor-pointer flex items-center gap-2"
        >
          {saved ? <Check className="w-4 h-4" /> : null}
          <span>{saved ? 'Saved' : 'Save Changes'}</span>
        </button>
      </div>

      {/* ---------------- Trust badges ---------------- */}
      <section className="bg-white rounded-3xl border border-neutral-200 p-5 sm:p-7 space-y-5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <BadgeCheck className="w-5 h-5 text-[#800000]" />
            <h3 className="font-serif text-lg font-bold text-neutral-950">Badges under the Order Now button</h3>
          </div>
          <label className="flex items-center gap-2 text-xs font-semibold text-neutral-800 cursor-pointer">
            <input type="checkbox" checked={badgesEnabled} onChange={(e) => setBadgesEnabled(e.target.checked)} />
            <span>Show on website</span>
          </label>
        </div>
        <p className="text-[11px] text-neutral-500">
          Small icon + short text, e.g. "Cash on Delivery", "Free Delivery on 2+ items", "Trusted Store". Add, remove, re-order, change the
          icon or the text.
        </p>

        <div className="space-y-3">
          {badges.map((b, idx) => {
            const Icon = TRUST_BADGE_ICONS[b.icon] || BadgeCheck;
            return (
              <div
                key={b.id}
                className={`flex flex-wrap items-center gap-3 p-3 rounded-2xl border ${
                  b.enabled ? 'border-neutral-200 bg-neutral-50/60' : 'border-dashed border-neutral-300 bg-white opacity-70'
                }`}
              >
                <div className="w-10 h-10 rounded-xl bg-white border border-neutral-200 flex items-center justify-center shrink-0">
                  <Icon className="w-5 h-5 text-[#800000]" />
                </div>

                <select
                  value={b.icon}
                  onChange={(e) => updateBadge(b.id, { icon: e.target.value as TrustBadgeIcon })}
                  className="text-xs p-2 border border-neutral-200 rounded-lg bg-white"
                >
                  {ICON_OPTIONS.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.label}
                    </option>
                  ))}
                </select>

                <input
                  type="text"
                  value={b.text}
                  maxLength={40}
                  onChange={(e) => updateBadge(b.id, { text: e.target.value })}
                  placeholder="Badge text"
                  className="flex-1 min-w-[160px] text-xs font-semibold p-2.5 border border-neutral-200 rounded-lg bg-white focus:border-[#800000] focus:outline-hidden"
                />

                <label className="flex items-center gap-1.5 text-[11px] font-semibold text-neutral-700 cursor-pointer">
                  <input type="checkbox" checked={b.enabled} onChange={(e) => updateBadge(b.id, { enabled: e.target.checked })} />
                  <span>Show</span>
                </label>

                <div className="flex items-center gap-1">
                  <button type="button" onClick={() => moveBadge(idx, -1)} disabled={idx === 0} className="p-1.5 rounded-md hover:bg-neutral-200 disabled:opacity-30 cursor-pointer" title="Move up">
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                  <button type="button" onClick={() => moveBadge(idx, 1)} disabled={idx === badges.length - 1} className="p-1.5 rounded-md hover:bg-neutral-200 disabled:opacity-30 cursor-pointer" title="Move down">
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>
                  <button type="button" onClick={() => setBadges((l) => l.filter((x) => x.id !== b.id))} className="p-1.5 rounded-md hover:bg-red-100 text-red-600 cursor-pointer" title="Delete badge">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}

          {badges.length < 4 && (
            <button
              type="button"
              onClick={() => setBadges((l) => [...l, { id: newId('tb'), icon: 'badge-check', text: 'New badge', enabled: true }])}
              className="text-xs font-bold text-[#800000] flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add badge (max 4)</span>
            </button>
          )}
        </div>
      </section>

      {/* ---------------- Cart offers ---------------- */}
      <section className="bg-white rounded-3xl border border-neutral-200 p-5 sm:p-7 space-y-5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Gift className="w-5 h-5 text-[#800000]" />
            <h3 className="font-serif text-lg font-bold text-neutral-950">Cart offers (different products together)</h3>
          </div>
          <label className="flex items-center gap-2 text-xs font-semibold text-neutral-800 cursor-pointer">
            <input type="checkbox" checked={offersEnabled} onChange={(e) => setOffersEnabled(e.target.checked)} />
            <span>Offers ON</span>
          </label>
        </div>
        <p className="text-[11px] text-neutral-500">
          Counts <strong>different products</strong> in the cart (the same product bought 2 or 3 times uses its own Buy 2 / Buy 3 offer from the
          product page). The extra % comes off the cart subtotal, on top of any Buy 2 / Buy 3 price. The cart page tells customers how many more
          products unlock the next offer.
        </p>

        <div className="space-y-3">
          {offers
            .slice()
            .sort((a, b) => a.minProducts - b.minProducts)
            .map((o) => (
              <div
                key={o.id}
                className={`grid grid-cols-2 sm:grid-cols-[1fr_1fr_auto_auto_auto] items-end gap-3 p-3 rounded-2xl border ${
                  o.enabled ? 'border-neutral-200 bg-neutral-50/60' : 'border-dashed border-neutral-300 opacity-70'
                }`}
              >
                <label className="text-[10px] font-semibold text-neutral-600">
                  When cart has at least (products)
                  <input
                    type="number"
                    min={2}
                    value={o.minProducts}
                    onChange={(e) => updateOffer(o.id, { minProducts: Number(e.target.value) })}
                    className="mt-1 w-full p-2.5 text-xs font-bold border border-neutral-200 rounded-lg bg-white"
                  />
                </label>
                <label className="text-[10px] font-semibold text-neutral-600">
                  Extra discount (%) — 0 for none
                  <input
                    type="number"
                    min={0}
                    max={90}
                    value={o.extraDiscountPercent}
                    onChange={(e) => updateOffer(o.id, { extraDiscountPercent: Number(e.target.value) })}
                    className="mt-1 w-full p-2.5 text-xs font-bold border border-neutral-200 rounded-lg bg-white"
                  />
                </label>
                <label className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700 cursor-pointer pb-2.5">
                  <input type="checkbox" checked={o.freeDelivery} onChange={(e) => updateOffer(o.id, { freeDelivery: e.target.checked })} />
                  <span>Free Delivery</span>
                </label>
                <label className="flex items-center gap-1.5 text-[11px] font-semibold text-neutral-700 cursor-pointer pb-2.5">
                  <input type="checkbox" checked={o.enabled} onChange={(e) => updateOffer(o.id, { enabled: e.target.checked })} />
                  <span>Active</span>
                </label>
                <button
                  type="button"
                  onClick={() => setOffers((l) => l.filter((x) => x.id !== o.id))}
                  className="p-2 rounded-md hover:bg-red-100 text-red-600 cursor-pointer justify-self-end mb-1"
                  title="Delete offer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}

          <button
            type="button"
            onClick={() =>
              setOffers((l) => [
                ...l,
                { id: newId('co'), minProducts: Math.max(2, ...l.map((x) => x.minProducts + 1)), extraDiscountPercent: 10, freeDelivery: true, enabled: true },
              ])
            }
            className="text-xs font-bold text-[#800000] flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add offer level</span>
          </button>
        </div>
      </section>

      <div>
        <button
          type="button"
          onClick={handleSave}
          className="bg-[#800000] hover:bg-[#600000] text-white text-xs font-bold px-7 py-3.5 rounded-xl cursor-pointer"
        >
          {saved ? 'Saved ✓' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
};
