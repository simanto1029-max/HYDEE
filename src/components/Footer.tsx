import React, { useState, useEffect } from 'react';
import { MessageCircle, Mail, Phone, MapPin, ShieldCheck, FileText, ExternalLink } from 'lucide-react';
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
  const locationText = settings.tangailLocation || settings.address || 'Tangail, Dhaka Division, Bangladesh';

  const handleWhatsAppChat = () => {
    const text = encodeURIComponent('Hello HYDEE Concierge, I would like personal assistance with my order.');
    window.open(`https://wa.me/${cleanWhatsapp}?text=${text}`, '_blank');
  };

  return (
    <footer className="w-full bg-[#FAF9F7] pt-4 pb-4 px-3 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-6xl mx-auto bg-white rounded-2xl border border-neutral-200/80 shadow-xs p-5 sm:p-7">
        
        {/* Main 3-Column Split:
            Col 1 (Left): Brand Identity & Legal Charters (Privacy Policy, Terms & Conditions)
            Col 2 (Middle): Atelier Location & Direct Helpline (Address, Hotline, WhatsApp, Support Email)
            Col 3 (Right): Interactive Google Map Embed of Tangail Atelier
        */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-6 sm:gap-8 items-start">
          
          {/* LEFT COLUMN: Brand Identity & Legal Charters (lg:col-span-4) */}
          <div className="lg:col-span-4 space-y-4">
            <div>
              <img
                src="/assets/aistudio/hydee_wordmark_transparent.png"
                alt="HYDEE Women Collection"
                className="h-10 w-auto object-contain mb-1"
              />
              <p className="text-xs text-neutral-500 font-medium max-w-sm leading-relaxed">
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
              </div>
            </div>
          </div>

          {/* MIDDLE COLUMN: Tangail Location, Helpline Number, WhatsApp & Email (lg:col-span-4) */}
          <div className="lg:col-span-4 space-y-4 lg:border-l lg:border-neutral-100 lg:pl-6">
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
                    href={`tel:${settings.hotlinePhone || '+880 1711-002233'}`}
                    className="font-bold text-neutral-900 hover:text-[#800000] transition-colors"
                  >
                    {settings.hotlinePhone || '+880 1711-002233'}
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
                    {settings.whatsappNumber || '01711002233'} (Click to Chat)
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
                    href={`mailto:${settings.supportEmail && !settings.supportEmail.includes('@hydee.com') ? settings.supportEmail : 'support@hydee.shop'}`}
                    className="font-medium text-neutral-800 hover:text-[#800000] transition-colors"
                  >
                    {settings.supportEmail && !settings.supportEmail.includes('@hydee.com') ? settings.supportEmail : 'support@hydee.shop'}
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Google Map Embed of Tangail Atelier (lg:col-span-4) */}
          <div className="lg:col-span-4 space-y-2.5 md:col-span-2 lg:border-l lg:border-neutral-100 lg:pl-6">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold tracking-[0.2em] text-neutral-400 uppercase block">
                Atelier Google Map
              </span>
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(locationText)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[10px] font-bold text-[#800000] hover:underline inline-flex items-center gap-1 cursor-pointer"
              >
                <span>Open Map</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <div className="w-full h-44 sm:h-48 rounded-xl overflow-hidden border border-neutral-200 bg-neutral-100 shadow-xs relative">
              <iframe
                title="HYDEE Tangail Atelier Location Map"
                src={`https://maps.google.com/maps?q=${encodeURIComponent(locationText)}&t=&z=13&ie=UTF8&iwloc=&output=embed`}
                width="100%"
                height="100%"
                style={{ border: 0 }}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="w-full h-full"
              />
            </div>
            <p className="text-[11px] text-neutral-500 flex items-center gap-1.5 font-medium">
              <MapPin className="w-3.5 h-3.5 text-[#800000] shrink-0" />
              <span className="truncate">{locationText}</span>
            </p>
          </div>

        </div>

      </div>
    </footer>
  );
};
