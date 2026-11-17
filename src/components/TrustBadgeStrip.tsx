import React, { useEffect, useState } from 'react';
import {
  Banknote,
  Truck,
  ShieldCheck,
  BadgeCheck,
  Gift,
  Clock,
  Heart,
  Star,
  Package,
  Lock,
  RotateCcw,
  Phone,
} from 'lucide-react';
import { store } from '../services/store';
import { TrustBadgeIcon } from '../types';

export const TRUST_BADGE_ICONS: Record<TrustBadgeIcon, React.ComponentType<{ className?: string }>> = {
  banknote: Banknote,
  truck: Truck,
  'shield-check': ShieldCheck,
  'badge-check': BadgeCheck,
  gift: Gift,
  clock: Clock,
  heart: Heart,
  star: Star,
  package: Package,
  lock: Lock,
  'rotate-ccw': RotateCcw,
  phone: Phone,
};

// The small row under the Order Now button: icon + short text. Everything comes from Admin > Offers & Badges.
export const TrustBadgeStrip: React.FC = () => {
  const [settings, setSettings] = useState(store.getSettings());

  useEffect(() => store.subscribe(() => setSettings(store.getSettings())), []);

  if (settings.trustBadgesEnabled === false) return null;
  const badges = (settings.trustBadges || []).filter((b) => b.enabled && b.text.trim());
  if (badges.length === 0) return null;

  return (
    <div
      className="grid gap-2 pt-1"
      style={{ gridTemplateColumns: `repeat(${Math.min(badges.length, 4)}, minmax(0, 1fr))` }}
    >
      {badges.map((b) => {
        const Icon = TRUST_BADGE_ICONS[b.icon] || BadgeCheck;
        return (
          <div
            key={b.id}
            className="flex flex-col items-center text-center gap-1.5 rounded-xl border border-neutral-200 bg-neutral-50/70 px-1.5 py-2.5"
          >
            <Icon className="w-5 h-5 text-[#800000]" />
            <span className="text-[10.5px] sm:text-[11px] font-semibold leading-tight text-neutral-800">{b.text}</span>
          </div>
        );
      })}
    </div>
  );
};
