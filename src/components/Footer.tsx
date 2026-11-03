import React, { useState, useEffect } from 'react';
import { MessageCircle, Mail, Phone, MapPin, ShieldCheck, FileText, Truck } from 'lucide-react';
import { store } from '../services/store';

interface FooterProps {
  onNavigate: (path: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  const [settings, setSettings] = useState(store.getSettings());

  useEffect(() => {
    const unsub = store.subscribe(() => {
      setSettings(store.getSettings());
    });
    return () => {
      unsub();
    };
  }, []);

  const cleanWhatsapp = (settings.whatsappNumber || '8801700000000').replace(/[^0-9]/g, '');
  const locationText = settings.tangailLocation || settings.address || 'Main Atelier, Tangail, Dhaka Division, Bangladesh';

  const handleWhatsAppChat = () => {
    const text = encodeURIComponent('Hello HYDEE Concierge, I would like personal styling and bespoke assistance.');
    window.open(`https://wa.me/${cleanWhatsapp}?text=${text}`, '_blank');
  };

  return (
    <footer className="w-full bg-[#FAF9F7] pt-8 pb-14 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-6xl mx-auto bg-white rounded-2xl border border-neutral-200/80 shadow-xs p-6 sm:p-10">
        
        {/* Main 2-Column Split: Left Side (Policies) & Right Side (Location, Contact & Numbers) */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 pb-8 border-b border-neutral-100 items-start">
          
          {/* LEFT SIDE (বামপাশে): Brand Identity, Legal & Policies */}
          <div className="md:col-span-6 space-y-4">
            <div>
              <span className="font-serif tracking-[0.25em] text-2xl font-bold text-[#800000] block">
                HYDEE
              </span>
              <p className="text-xs text-neutral-500 font-medium mt-1 max-w-sm">
                Bespoke luxury for every occasion, crafted in Bangladesh.
              </p>
            </div>

            {/* Privacy Policy & Terms Links */}
            <div className="space-y-2.5 pt-2">
              <span className="text-[10px] font-bold tracking-[0.2em] text-neutral-400 uppercase block">
                Legal & Atelier Charters
              </span>
              <div className="flex flex-col space-y-2 text-xs">
                <button
                  type="button"
                  onClick={() => onNavigate('/privacy-policy')}
                  className="hover:text-[#800000] font-semibold text-neutral-700 transition-colors cursor-pointer inline-flex items-center gap-2 self-start"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-[#800000]" />
                  <span>Privacy Policy</span>
                </button>

                <button
                  type="button"
                  onClick={() => onNavigate('/terms')}
                  className="hover:text-[#800000] font-semibold text-neutral-700 transition-colors cursor-pointer inline-flex items-center gap-2 self-start"
                >
                  <FileText className="w-3.5 h-3.5 text-[#800000]" />
                  <span>Terms & Conditions</span>
                </button>

                <button
                  type="button"
                  onClick={() => onNavigate('/legal/deposit')}
                  className="hover:text-neutral-900 font-medium text-neutral-600 transition-colors cursor-pointer inline-flex items-center gap-2 self-start"
                >
                  <Truck className="w-3.5 h-3.5 text-neutral-400" />
                  <span>Advance Courier Deposit Terms</span>
                </button>
              </div>
            </div>
          </div>

          {/* RIGHT SIDE (ডানপাশে): Tangail Location, Helpline Number, WhatsApp & Email */}
          <div className="md:col-span-6 space-y-4 md:border-l md:border-neutral-100 md:pl-8">
            <span className="text-[10px] font-bold tracking-[0.2em] text-neutral-400 uppercase block">
              Atelier Location & Direct Helpline
            </span>

            <div className="space-y-3 text-xs">
              {/* Location */}
              <div className="flex items-start gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-800 flex items-center justify-center shrink-0 mt-0.5 border border-amber-200/60">
                  <MapPin className="w-4 h-4 text-[#800000]" />
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider block">
                    Tangail Atelier:
                  </span>
                  <p className="font-bold text-neutral-900 text-xs mt-0.5 leading-snug">
                    {locationText}
                  </p>
                </div>
              </div>

              {/* Phone Helpline */}
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-neutral-100 text-neutral-800 flex items-center justify-center shrink-0">
                  <Phone className="w-3.5 h-3.5 text-[#800000]" />
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider block">
                    Customer Hotline:
                  </span>
                  <a
                    href={`tel:${settings.hotlinePhone}`}
                    className="font-bold text-neutral-900 hover:text-[#800000] transition-colors"
                  >
                    {settings.hotlinePhone || '+880 1700-000000'}
                  </a>
                </div>
              </div>

              {/* WhatsApp */}
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-800 flex items-center justify-center shrink-0 border border-emerald-200">
                  <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider block">
                    WhatsApp Concierge:
                  </span>
                  <button
                    type="button"
                    onClick={handleWhatsAppChat}
                    className="font-bold text-emerald-800 hover:underline transition-colors cursor-pointer"
                  >
                    {settings.whatsappNumber || '01700-000000'} (Click to Chat)
                  </button>
                </div>
              </div>

              {/* Support Email */}
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-neutral-100 text-neutral-800 flex items-center justify-center shrink-0">
                  <Mail className="w-3.5 h-3.5 text-neutral-600" />
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider block">
                    Official Support Email:
                  </span>
                  <a
                    href={`mailto:${settings.supportEmail}`}
                    className="font-medium text-neutral-800 hover:text-[#800000] transition-colors"
                  >
                    {settings.supportEmail || 'support@hydee.com'}
                  </a>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Bottom Minimal Copyright Bar */}
        <div className="pt-4 flex flex-col sm:flex-row items-center justify-between text-[11px] text-neutral-400 gap-2">
          <p>© 2026 HYDEE Atelier. All Rights Reserved. Handcrafted in Tangail, Bangladesh.</p>
          <button
            type="button"
            onClick={() => onNavigate('/admin')}
            className="text-[10px] text-neutral-400 hover:text-neutral-700 transition-colors cursor-pointer"
          >
            Atelier Portal
          </button>
        </div>

      </div>
    </footer>
  );
};
