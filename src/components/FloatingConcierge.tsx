import React, { useState } from 'react';
import { MessageCircle, X, ArrowRight, Phone, Sparkles } from 'lucide-react';
import { store } from '../services/store';

export const FloatingConcierge: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const settings = store.getSettings();

  const handleStartWhatsApp = (prefillMessage: string) => {
    const text = encodeURIComponent(prefillMessage);
    window.open(`https://wa.me/${settings.whatsappNumber}?text=${text}`, '_blank');
  };

  return (
    <>
      {/* Floating Concierge Action Button with Contact Us text */}
      <div className="fixed bottom-20 md:bottom-6 right-4 sm:right-6 z-30 flex items-center">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="h-11 sm:h-12 px-3.5 sm:px-4 rounded-full bg-[#800000] hover:bg-[#600000] text-white flex items-center gap-2 shadow-[0_8px_25px_rgba(128,0,0,0.35)] border-2 border-white transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer group"
          aria-label="Contact Us"
          title="Contact Us"
        >
          <MessageCircle className="w-5 h-5 transition-transform group-hover:scale-110 shrink-0" />
          <span className="text-xs sm:text-[13px] font-bold tracking-wide select-none">Contact Us</span>
        </button>
      </div>

      {/* Concierge Dialog Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:justify-end p-4 sm:p-6 pointer-events-none">
          <div className="bg-white pointer-events-auto rounded-3xl shadow-2xl border border-neutral-200/80 w-full max-w-sm overflow-hidden animate-in slide-in-from-bottom duration-300">
            {/* Header */}
            <div className="bg-gradient-to-r from-neutral-950 to-neutral-900 text-white p-6 relative">
              <button
                onClick={() => setIsOpen(false)}
                className="absolute top-4 right-4 text-neutral-400 hover:text-white p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="flex items-center space-x-2 text-xs text-amber-400 font-medium mb-1">
                <Sparkles className="w-3.5 h-3.5" />
                <span>HYDEE Bespoke Styling</span>
              </div>
              <h3 className="font-serif text-xl font-bold">Dhaka Atelier Concierge</h3>
              <p className="text-xs text-neutral-300 mt-1">
                Direct channel to our senior fashion consultants & master tailors.
              </p>
            </div>

            {/* Quick Actions */}
            <div className="p-6 space-y-3">
              <p className="text-xs font-semibold text-neutral-400 tracking-wider mb-2">
                How May We Assist You Today?
              </p>

              <button
                onClick={() =>
                  handleStartWhatsApp(
                    'Hello HYDEE Atelier! I need personalized size recommendation for an item.'
                  )
                }
                className="w-full text-left text-xs p-3 rounded-xl border border-neutral-200 hover:border-[#800000] hover:bg-neutral-50 transition-all flex items-center justify-between group cursor-pointer"
              >
                <span className="text-neutral-800 font-medium">Bespoke Size & Fit Consultation</span>
                <ArrowRight className="w-4 h-4 text-neutral-400 group-hover:text-[#800000] transition-colors" />
              </button>

              <button
                onClick={() =>
                  handleStartWhatsApp(
                    'Hello! I would like to visit or contact the Tangail Atelier.'
                  )
                }
                className="w-full text-left text-xs p-3 rounded-xl border border-neutral-200 hover:border-[#800000] hover:bg-neutral-50 transition-all flex items-center justify-between group cursor-pointer"
              >
                <span className="text-neutral-800 font-medium">Visit Tangail Atelier</span>
                <ArrowRight className="w-4 h-4 text-neutral-400 group-hover:text-[#800000] transition-colors" />
              </button>

              <button
                onClick={() =>
                  handleStartWhatsApp(
                    'Hello! I have a question regarding my HYDEE order or delivery.'
                  )
                }
                className="w-full text-left text-xs p-3 rounded-xl border border-neutral-200 hover:border-[#800000] hover:bg-neutral-50 transition-all flex items-center justify-between group cursor-pointer"
              >
                <span className="text-neutral-800 font-medium">Order & Delivery Assistance</span>
                <ArrowRight className="w-4 h-4 text-neutral-400 group-hover:text-[#800000] transition-colors" />
              </button>

              <div className="pt-2">
                <button
                  onClick={() =>
                    handleStartWhatsApp('Greetings HYDEE team, I would like to speak with a VIP stylist.')
                  }
                  className="w-full bg-[#800000] hover:bg-[#5c0000] text-white py-3 rounded-xl text-xs font-semibold tracking-wider flex items-center justify-center space-x-2 transition-colors shadow-sm cursor-pointer"
                >
                  <MessageCircle className="w-4 h-4 fill-current" />
                  <span>Open WhatsApp Direct Chat</span>
                </button>
              </div>

              <div className="pt-2 flex items-center justify-center text-[11px] text-neutral-500 space-x-2">
                <Phone className="w-3 h-3 text-[#800000]" />
                <span>Atelier Hotline: {settings.hotlinePhone}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
