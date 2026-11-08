import React, { useState, useEffect } from 'react';
import { ShoppingBag, Menu, X, ArrowRight, MessageCircle } from 'lucide-react';
import { store } from '../services/store';

interface HeaderProps {
  currentPath: string;
  onNavigate: (path: string) => void;
  onOpenCart: () => void;
  onOpenSearch: () => void;
  cartCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  currentPath,
  onNavigate,
  onOpenCart,
  cartCount,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [settings, setSettings] = useState(store.getSettings());
  const [categories, setCategories] = useState(store.getCategories());

  useEffect(() => {
    const unsub = store.subscribe(() => {
      setSettings(store.getSettings());
      setCategories(store.getCategories());
    });
    return () => {
      unsub();
    };
  }, []);

  const cleanWhatsapp = (settings.whatsappNumber || '8801700000000').replace(/[^0-9]/g, '');

  const handleWhatsAppChat = () => {
    const text = encodeURIComponent('Hello HYDEE Atelier! I would like personal styling and bespoke order assistance.');
    window.open(`https://wa.me/${cleanWhatsapp}?text=${text}`, '_blank');
  };

  return (
    <>
      {/* Main Header Bar: [Hamburger Icon] — [HYDEE Logo] — [Shopping Bag Icon] */}
      <header
        className={`bg-white border-b border-neutral-100/90 transition-all duration-200 z-40 ${
          settings.stickyHeader ? 'sticky top-0' : 'relative'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-8 py-3 sm:py-3.5">
          <div className="flex items-center justify-between h-12 sm:h-14">
            
            {/* Left: Pure Hamburger Icon Button (No extra text) */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="p-2 -ml-2 text-neutral-900 hover:text-[#800000] transition-colors cursor-pointer"
              aria-label="Open Navigation Menu"
            >
              <Menu className="w-6 h-6 stroke-[1.8]" />
            </button>

            {/* Center: Official HYDEE Brand Logo */}
            <button
              type="button"
              onClick={() => onNavigate('/')}
              className="flex items-center justify-center hover:opacity-90 transition-opacity cursor-pointer py-0.5"
              title="HYDEE"
            >
              <img
                src="/assets/aistudio/hydee_wordmark_transparent.png"
                alt="HYDEE Women Collection"
                className="h-10 sm:h-12 md:h-14 w-auto object-contain drop-shadow-xs"
              />
            </button>

            {/* Right: Cart Bag Icon with Black Badge */}
            <button
              type="button"
              onClick={onOpenCart}
              className="p-2 -mr-2 text-neutral-900 hover:text-[#800000] relative transition-colors cursor-pointer"
              aria-label="Shopping Bag"
            >
              <ShoppingBag className="w-6 h-6 stroke-[1.8]" />
              {cartCount > 0 && (
                <span className="absolute top-1 right-0.5 bg-black text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center border-2 border-white shadow-xs">
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Slide-out Navigation Drawer (Matches User Screenshot 2 Exactly) */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-neutral-950/50 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
          />

          {/* Drawer Body */}
          <div className="relative w-full max-w-xs bg-white h-full shadow-2xl flex flex-col z-10 animate-in slide-in-from-left duration-300">
            {/* Drawer Header */}
            <div className="p-4 border-b border-neutral-100 flex items-center justify-between">
              <img
                src="/assets/aistudio/hydee_wordmark_transparent.png"
                alt="HYDEE Women Collection"
                className="h-9 w-auto object-contain"
              />
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="p-1.5 text-neutral-500 hover:text-neutral-900 cursor-pointer rounded-full hover:bg-neutral-100 transition-colors"
                aria-label="Close menu"
              >
                <X className="w-5 h-5 stroke-[1.8]" />
              </button>
            </div>

            {/* Navigation Links */}
            <div className="flex-1 overflow-y-auto px-5 py-6 space-y-6">
              
              {/* STORE NAVIGATION */}
              <div>
                <span className="text-[10px] font-bold tracking-[0.2em] text-neutral-400 uppercase block mb-3">
                  Store Navigation
                </span>
                <nav className="space-y-1">
                  <button
                    type="button"
                    onClick={() => {
                      onNavigate('/');
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center justify-between py-2.5 px-3 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                      currentPath === '/' ? 'bg-neutral-100 text-neutral-950 font-semibold' : 'text-neutral-700 hover:bg-neutral-50'
                    }`}
                  >
                    <span>Home</span>
                    <ArrowRight className="w-4 h-4 text-neutral-400" />
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      onNavigate('/products');
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center justify-between py-2.5 px-3 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                      currentPath === '/products' ? 'bg-neutral-100 text-neutral-950 font-semibold' : 'text-neutral-700 hover:bg-neutral-50'
                    }`}
                  >
                    <span>Shop All Collections</span>
                    <ArrowRight className="w-4 h-4 text-neutral-400" />
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      onNavigate('/track-order');
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center justify-between py-2.5 px-3 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                      currentPath === '/track-order' ? 'bg-neutral-100 text-neutral-950 font-semibold' : 'text-neutral-700 hover:bg-neutral-50'
                    }`}
                  >
                    <span>Track Order</span>
                    <ArrowRight className="w-4 h-4 text-neutral-400" />
                  </button>
                </nav>
              </div>

              {/* CATEGORIES */}
              <div>
                <span className="text-[10px] font-bold tracking-[0.2em] text-neutral-400 uppercase block mb-3">
                  Categories
                </span>
                <div className="grid grid-cols-2 gap-2">
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => {
                        onNavigate(`/categories/${cat.slug}`);
                        setMobileMenuOpen(false);
                      }}
                      className="text-left px-3 py-2 text-xs font-medium text-neutral-700 hover:text-[#800000] bg-neutral-50 hover:bg-neutral-100 rounded-lg transition-colors cursor-pointer truncate"
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* WhatsApp Concierge Button & Admin Link */}
              <div className="pt-4 border-t border-neutral-100 space-y-3">
                <button
                  type="button"
                  onClick={() => {
                    handleWhatsAppChat();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-semibold hover:bg-emerald-100 transition-colors border border-emerald-200 cursor-pointer"
                >
                  <MessageCircle className="w-4 h-4 text-emerald-600" />
                  <span>Chat on WhatsApp</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    onNavigate('/admin');
                    setMobileMenuOpen(false);
                  }}
                  className="w-full text-center py-2 text-[11px] text-neutral-400 hover:text-neutral-600 transition-colors cursor-pointer"
                >
                  Atelier Admin Portal
                </button>
              </div>

            </div>
          </div>
        </div>
      )}
    </>
  );
};
