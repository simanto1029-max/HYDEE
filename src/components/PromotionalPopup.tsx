import React, { useState, useEffect } from 'react';
import { X, ArrowRight, Tag } from 'lucide-react';
import { store } from '../services/store';

interface PromotionalPopupProps {
  onNavigate: (path: string) => void;
}

export const PromotionalPopup: React.FC<PromotionalPopupProps> = ({ onNavigate }) => {
  const [isVisible, setIsVisible] = useState(false);
  const popupConfig = store.getPromoPopup();

  useEffect(() => {
    if (!popupConfig.isEnabled) return;

    // Check localStorage dismissal
    const dismissedKey = 'hydee_promo_dismissed_v2';
    const lastDismissed = localStorage.getItem(dismissedKey);

    if (lastDismissed) {
      const daysSince =
        (Date.now() - parseInt(lastDismissed, 10)) / (1000 * 60 * 60 * 24);
      if (daysSince < (popupConfig.showOncePerDays || 7)) {
        return; // Don't show if within period
      }
    }

    const timer = setTimeout(() => {
      setIsVisible(true);
    }, (popupConfig.delaySeconds || 4) * 1000);

    return () => clearTimeout(timer);
  }, [popupConfig]);

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem('hydee_promo_dismissed_v2', Date.now().toString());
  };

  const handleClaim = () => {
    handleDismiss();
    navigator.clipboard?.writeText?.(popupConfig.discountCode);
    onNavigate(popupConfig.targetUrl || '/products');
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isVisible) {
        handleDismiss();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isVisible]);

  if (!isVisible || !popupConfig.isEnabled) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) handleDismiss();
      }}
    >
      <div className="relative w-full max-w-2xl max-h-[92vh] overflow-y-auto bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-neutral-100 flex flex-col md:flex-row touch-scroll">
        {/* Prominent High-Visibility Close Button */}
        <button
          onClick={handleDismiss}
          className="absolute top-3.5 right-3.5 z-30 w-9 h-9 rounded-full bg-black/60 hover:bg-black/80 md:bg-white/90 md:hover:bg-white text-white md:text-neutral-700 flex items-center justify-center transition-all shadow-md cursor-pointer active:scale-95"
          aria-label="Close promotion"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Left Side Imagery */}
        <div className="w-full md:w-1/2 h-56 md:h-auto relative bg-neutral-900">
          <img
            src={popupConfig.imageUrl}
            alt="HYDEE Campaign Promotion"
            className="w-full h-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent md:hidden" />
          <div className="absolute bottom-4 left-4 text-white md:hidden">
            <span className="text-[10px] uppercase tracking-widest text-amber-300 font-semibold">
              Privileged Offer
            </span>
          </div>
        </div>

        {/* Right Side Copy & CTA */}
        <div className="w-full md:w-1/2 p-6 sm:p-8 flex flex-col justify-between">
          <div>
            <span className="text-[11px] font-bold tracking-[0.2em] text-[#800000] uppercase block mb-2">
              EXCLUSIVE ATELIER ACCESS
            </span>
            <h3 className="font-serif text-2xl font-bold text-neutral-950 leading-tight">
              {popupConfig.title}
            </h3>
            <p className="text-xs text-neutral-600 mt-2 leading-relaxed">
              {popupConfig.subtitle}
            </p>

            {/* Discount Code Card */}
            {popupConfig.discountCode && (
              <div className="mt-5 p-3.5 bg-neutral-50 rounded-xl border border-dashed border-neutral-300 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Tag className="w-4 h-4 text-[#800000]" />
                  <span className="font-mono text-xs font-bold tracking-wider text-neutral-900">
                    {popupConfig.discountCode}
                  </span>
                </div>
                <span className="text-[10px] text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded-sm">
                  {popupConfig.discountPercent}% OFF
                </span>
              </div>
            )}
          </div>

          <div className="mt-6 space-y-2">
            <button
              onClick={handleClaim}
              className="w-full bg-[#800000] hover:bg-[#5c0000] text-white text-xs font-semibold tracking-wider uppercase py-3.5 px-4 rounded-xl transition-colors flex items-center justify-center gap-2 shadow-md"
            >
              <span>{popupConfig.buttonText || 'Claim Privileged Access'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={handleDismiss}
              className="w-full text-center text-[11px] text-neutral-600 hover:text-neutral-700 py-1"
            >
              No thanks, I will shop regular catalog
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
