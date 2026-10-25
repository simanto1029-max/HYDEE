import React from 'react';
import { Lock, MessageCircle, Mail } from 'lucide-react';
import { store } from '../services/store';

interface FooterProps {
  onNavigate: (path: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  const settings = store.getSettings();

  const handleWhatsAppChat = () => {
    const text = encodeURIComponent('Hello HYDEE Concierge, I would like personal styling and bespoke order assistance.');
    window.open(`https://wa.me/${settings.whatsappNumber}?text=${text}`, '_blank');
  };

  return (
    <footer className="w-full bg-[#FAF9F7] pt-8 pb-14 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto bg-white rounded-2xl border border-neutral-200/60 shadow-xs p-6 sm:p-10">
        
        {/* Top Header: Brand Name + Small Hind Siliguri Tagline + Minimal Socials */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-6 border-b border-neutral-100 gap-4">
          <div>
            <span className="font-serif tracking-[0.25em] text-2xl font-semibold text-[#800000] block">
              HYDEE
            </span>
            {/* Tagline in Hind Siliguri font + compact/cut down size */}
            <p className="font-['Hind_Siliguri',sans-serif] text-xs sm:text-[13px] text-neutral-500 font-normal mt-1 max-w-md tracking-normal">
              Bespoke luxury for every occasion, crafted in Bangladesh.
            </p>
          </div>

          {/* Minimalist Social / Contact Circle Buttons */}
          <div className="flex items-center space-x-2.5">
            <button
              onClick={handleWhatsAppChat}
              className="w-8 h-8 rounded-full border border-neutral-200 text-neutral-600 hover:text-emerald-700 hover:border-emerald-500 flex items-center justify-center transition-colors cursor-pointer"
              aria-label="WhatsApp"
              title="WhatsApp Concierge"
            >
              <MessageCircle className="w-4 h-4" />
            </button>
            <a
              href={`mailto:${settings.supportEmail}`}
              className="w-8 h-8 rounded-full border border-neutral-200 text-neutral-600 hover:text-[#800000] hover:border-[#800000] flex items-center justify-center transition-colors"
              aria-label="Email"
              title="Email Concierge"
            >
              <Mail className="w-4 h-4" />
            </a>
          </div>
        </div>

        {/* Clean, Streamlined Navigation Links */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 sm:gap-8 py-6">
          {/* Collections */}
          <div>
            <h3 className="text-[11px] font-bold text-neutral-400 mb-3 uppercase tracking-wider">
              Collections
            </h3>
            <ul className="space-y-2 text-xs text-neutral-600">
              <li>
                <button
                  onClick={() => onNavigate('/categories/sharees')}
                  className="hover:text-neutral-950 transition-colors cursor-pointer"
                >
                  Jamdani Sharees
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('/categories/panjabis')}
                  className="hover:text-neutral-950 transition-colors cursor-pointer"
                >
                  Luxury Panjabis
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('/products')}
                  className="hover:text-neutral-950 transition-colors cursor-pointer"
                >
                  All Products
                </button>
              </li>
            </ul>
          </div>

          {/* Atelier */}
          <div>
            <h3 className="text-[11px] font-bold text-neutral-400 mb-3 uppercase tracking-wider">
              Atelier
            </h3>
            <ul className="space-y-2 text-xs text-neutral-600">
              <li>
                <button
                  onClick={() => onNavigate('/craftsmanship')}
                  className="hover:text-neutral-950 transition-colors cursor-pointer"
                >
                  Craftsmanship
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('/lookbook')}
                  className="hover:text-neutral-950 transition-colors cursor-pointer"
                >
                  Lookbook
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('/track-order')}
                  className="hover:text-neutral-950 transition-colors cursor-pointer"
                >
                  Track Order
                </button>
              </li>
            </ul>
          </div>

          {/* Assistance & Policies */}
          <div className="col-span-2 sm:col-span-1">
            <h3 className="text-[11px] font-bold text-neutral-400 mb-3 uppercase tracking-wider">
              Assistance
            </h3>
            <ul className="space-y-2 text-xs text-neutral-600">
              <li>
                <button
                  onClick={handleWhatsAppChat}
                  className="hover:text-neutral-950 transition-colors cursor-pointer"
                >
                  VIP Concierge
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('/legal/privacy')}
                  className="hover:text-neutral-950 transition-colors cursor-pointer"
                >
                  Privacy Policy
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('/legal/terms')}
                  className="hover:text-neutral-950 transition-colors cursor-pointer"
                >
                  Terms Of Service
                </button>
              </li>
            </ul>
          </div>
        </div>

        {/* Minimal Bottom Bar */}
        <div className="pt-4 border-t border-neutral-100 flex flex-col sm:flex-row items-center justify-between text-[11px] text-neutral-400 gap-2">
          <p>© 2026 HYDEE Atelier. All Rights Reserved.</p>
          <button
            onClick={() => onNavigate('/admin')}
            className="inline-flex items-center text-neutral-500 hover:text-[#800000] transition-colors cursor-pointer"
          >
            <Lock className="w-3 h-3 mr-1 text-[#800000]" />
            Store Admin
          </button>
        </div>

      </div>
    </footer>
  );
};
