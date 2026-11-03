import React from 'react';
import { ShoppingBag, Home, ShoppingCart, Package, Search } from 'lucide-react';

interface BottomNavBarProps {
  currentPath: string;
  onNavigate: (path: string) => void;
  onOpenSearch?: () => void;
  cartCount: number;
}

export const BottomNavBar: React.FC<BottomNavBarProps> = ({
  currentPath,
  onNavigate,
  onOpenSearch,
  cartCount,
}) => {
  const isShopActive = currentPath === '/products' || currentPath.startsWith('/categories');
  const isHomeActive = currentPath === '/';
  const isCheckoutActive = currentPath === '/checkout';
  const isTrackActive = currentPath === '/track-order';

  return (
    <nav
      className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-neutral-200/80 shadow-[0_-4px_25px_rgba(0,0,0,0.06)]"
      aria-label="Bottom Navigation"
    >
      <div className="max-w-lg sm:max-w-xl mx-auto px-4 h-16 flex items-center justify-between relative">
        {/* 1. Search (Replaces WhatsApp as requested) */}
        <button
          type="button"
          onClick={() => {
            if (onOpenSearch) {
              onOpenSearch();
            } else {
              onNavigate('/products');
            }
          }}
          className="flex-1 flex flex-col items-center justify-center py-1 text-neutral-500 hover:text-neutral-900 transition-colors cursor-pointer group"
        >
          <Search className="w-5 h-5 stroke-[1.8] transition-transform group-hover:scale-110" />
          <span className="text-[11px] tracking-tight mt-1 font-medium">Search</span>
        </button>

        {/* 2. Shop */}
        <button
          type="button"
          onClick={() => onNavigate('/products')}
          className={`flex-1 flex flex-col items-center justify-center py-1 transition-colors cursor-pointer ${
            isShopActive ? 'text-neutral-950 font-semibold' : 'text-neutral-500 hover:text-neutral-900'
          }`}
        >
          <ShoppingBag className={`w-5 h-5 ${isShopActive ? 'stroke-[2.2]' : 'stroke-[1.7]'}`} />
          <span className="text-[11px] tracking-tight mt-1">Shop</span>
        </button>

        {/* 3. Center Elevated Floating Home Button */}
        <div className="flex-1 flex flex-col items-center justify-center relative">
          <button
            type="button"
            onClick={() => onNavigate('/')}
            className={`w-12 h-12 -mt-6 rounded-full flex items-center justify-center transition-transform active:scale-95 shadow-[0_8px_20px_rgba(0,0,0,0.3)] border-4 border-white cursor-pointer ${
              isHomeActive
                ? 'bg-neutral-950 text-white ring-2 ring-neutral-950'
                : 'bg-neutral-900 text-white hover:bg-[#800000]'
            }`}
            aria-label="Home"
          >
            <Home className="w-5 h-5 stroke-[2]" />
          </button>
          <span
            className={`text-[11px] tracking-tight mt-0.5 ${
              isHomeActive ? 'text-neutral-950 font-semibold' : 'text-neutral-500'
            }`}
          >
            Home
          </span>
        </div>

        {/* 4. Checkout (With live cart counter badge) */}
        <button
          type="button"
          onClick={() => onNavigate('/checkout')}
          className={`flex-1 flex flex-col items-center justify-center py-1 relative transition-colors cursor-pointer ${
            isCheckoutActive ? 'text-neutral-950 font-semibold' : 'text-neutral-500 hover:text-neutral-900'
          }`}
        >
          <div className="relative">
            <ShoppingCart className={`w-5 h-5 ${isCheckoutActive ? 'stroke-[2.2]' : 'stroke-[1.7]'}`} />
            {cartCount > 0 && (
              <span className="absolute -top-1.5 -right-2 bg-neutral-950 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center border border-white">
                {cartCount}
              </span>
            )}
          </div>
          <span className="text-[11px] tracking-tight mt-1">Checkout</span>
        </button>

        {/* 5. Track Order */}
        <button
          type="button"
          onClick={() => onNavigate('/track-order')}
          className={`flex-1 flex flex-col items-center justify-center py-1 transition-colors cursor-pointer ${
            isTrackActive ? 'text-neutral-950 font-semibold' : 'text-neutral-500 hover:text-neutral-900'
          }`}
        >
          <Package className={`w-5 h-5 ${isTrackActive ? 'stroke-[2.2]' : 'stroke-[1.7]'}`} />
          <span className="text-[11px] tracking-tight mt-1">Track</span>
        </button>
      </div>
    </nav>
  );
};
