import React, { useState } from 'react';
import { MessageCircle, X, ArrowRight, Phone, Sparkles } from 'lucide-react';
import { store } from '../services/store';

// The real WhatsApp logo (speech bubble + phone)
const WhatsAppLogo: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 32 32" className={className} fill="currentColor" aria-hidden="true">
    <path d="M16.003 3C8.832 3 3 8.83 3 16c0 2.292.6 4.53 1.74 6.505L3 29l6.673-1.71A13 13 0 0 0 16.003 29C23.17 29 29 23.17 29 16S23.17 3 16.003 3Zm0 23.77a10.7 10.7 0 0 1-5.456-1.496l-.39-.232-3.96 1.015 1.056-3.86-.254-.397A10.74 10.74 0 0 1 5.23 16c0-5.9 4.8-10.7 10.773-10.7S26.77 10.1 26.77 16s-4.867 10.77-10.767 10.77Zm5.9-8.04c-.323-.162-1.913-.944-2.21-1.052-.297-.108-.512-.162-.727.162-.216.323-.836 1.052-1.025 1.268-.188.216-.377.243-.7.08-.323-.16-1.364-.503-2.6-1.603-.96-.857-1.61-1.915-1.8-2.238-.188-.323-.02-.498.142-.66.146-.145.323-.377.485-.566.162-.188.216-.323.324-.54.108-.215.054-.404-.027-.566-.08-.162-.727-1.752-.996-2.4-.262-.63-.529-.545-.727-.555l-.619-.01a1.19 1.19 0 0 0-.862.404c-.296.323-1.132 1.106-1.132 2.697s1.158 3.128 1.32 3.343c.162.216 2.28 3.482 5.523 4.882.772.333 1.374.532 1.844.68.775.246 1.48.211 2.037.128.62-.093 1.913-.782 2.182-1.537.27-.755.27-1.402.188-1.537-.08-.135-.296-.216-.62-.378Z" />
  </svg>
);

export const FloatingConcierge: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const settings = store.getSettings();

  const handleStartWhatsApp = (prefillMessage: string) => {
    const text = encodeURIComponent(prefillMessage);
    const num = (settings.whatsappNumber || '8801601705804').replace(/[^0-9]/g, '');
    window.open(`https://wa.me/${num}?text=${text}`, '_blank');
  };

  return (
    <>
      {/* Floating WhatsApp button: only the WhatsApp logo, in WhatsApp green (no text) */}
      <div className="fixed bottom-20 md:bottom-6 right-4 sm:right-6 z-30 flex items-center">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-[#25D366] hover:bg-[#1ebe5b] text-white flex items-center justify-center shadow-[0_8px_25px_rgba(37,211,102,0.45)] border-2 border-white transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer"
          aria-label="Contact us on WhatsApp"
          title="WhatsApp"
        >
          <WhatsAppLogo className="w-7 h-7 sm:w-8 sm:h-8" />
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
