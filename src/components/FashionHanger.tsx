import React, { useState, useRef } from 'react';
import { ChevronLeft, ChevronRight, ShoppingBag } from 'lucide-react';
import { Product } from '../types';

interface FashionHangerProps {
  products: Product[];
  onSelectProduct: (slug: string) => void;
  onAddToCart: (product: Product) => void;
}

export const FashionHanger: React.FC<FashionHangerProps> = ({
  products,
  onSelectProduct,
  onAddToCart,
}) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const touchStartX = useRef<number | null>(null);

  if (!products || products.length === 0) return null;

  const total = products.length;

  const handleNext = () => {
    setSelectedIndex((prev) => (prev + 1) % total);
  };

  const handlePrev = () => {
    setSelectedIndex((prev) => (prev - 1 + total) % total);
  };

  const handleSelect = (idx: number) => {
    setSelectedIndex(idx);
  };

  // Touch swipe support for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 40) {
      if (diff > 0) handleNext();
      else handlePrev();
    }
    touchStartX.current = null;
  };

  return (
    <section id="hanger" className="py-10 sm:py-16 bg-white relative overflow-hidden select-none">
      <div className="max-w-7xl mx-auto px-6 sm:px-10">
        
        {/* Navigation arrows (Exact match to reference screenshot: Circular border outline buttons at top right) */}
        <div className="flex items-center justify-end mb-6 sm:mb-8 space-x-3">
          <button
            onClick={handlePrev}
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-full border border-neutral-300 bg-white hover:bg-neutral-50 text-neutral-800 flex items-center justify-center transition-all duration-200 hover:border-neutral-500 active:scale-95 cursor-pointer shadow-2xs"
            aria-label="Previous hanger piece"
          >
            <ChevronLeft className="w-4 h-4 stroke-[2]" />
          </button>
          <button
            onClick={handleNext}
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-full border border-neutral-300 bg-white hover:bg-neutral-50 text-neutral-800 flex items-center justify-center transition-all duration-200 hover:border-neutral-500 active:scale-95 cursor-pointer shadow-2xs"
            aria-label="Next hanger piece"
          >
            <ChevronRight className="w-4 h-4 stroke-[2]" />
          </button>
        </div>

        {/* Realistic Wardrobe Hanging Rod (Exact match to reference screenshot) */}
        <div
          className="relative w-full min-h-[520px] sm:min-h-[590px] pt-4"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {/* Main Horizontal Metallic Hanging Rod with Specular Gleam and Wall Caps */}
          <div className="relative w-full h-3 bg-gradient-to-b from-[#e8e8e8] via-[#c6c6c6] to-[#7f7f7f] rounded-full shadow-[0_6px_14px_rgba(0,0,0,0.14)] z-20 flex items-center mb-1">
            {/* Left Circular Wall Mount / End Cap */}
            <div className="absolute -left-2 -top-3 w-4 h-9 bg-neutral-800 rounded-sm shadow-md border-r border-neutral-600 flex items-center justify-center">
              <div className="w-1.5 h-6 bg-neutral-900 rounded-xs" />
            </div>

            {/* Specular Gleam Highlight along the length */}
            <div className="w-full h-[1.5px] bg-white/80" />

            {/* Right Circular Wall Mount / End Cap */}
            <div className="absolute -right-2 -top-3 w-4 h-9 bg-neutral-800 rounded-sm shadow-md border-l border-neutral-600 flex items-center justify-center">
              <div className="w-1.5 h-6 bg-neutral-900 rounded-xs" />
            </div>
          </div>

          {/* Rod Drop Shadow on the Atelier Wall */}
          <div className="w-full h-6 bg-gradient-to-b from-black/10 to-transparent blur-xs -mt-1 pointer-events-none" />

          {/* Cards Stage: Active Card on Left-Center + Trailing Inactive Cards on Right (Screenshot Match) */}
          <div className="relative w-full h-[470px] sm:h-[530px] overflow-visible">
            {products.map((product, idx) => {
              // Calculate offset relative to selected index in a circular manner
              let offset = (idx - selectedIndex) % total;
              if (offset < 0) offset += total;

              // Only show active and the next 4 items to the right as in screenshot
              if (offset > 4 && offset < total - 1) return null;

              const isSelected = offset === 0;

              // Calculate positions matching reference screenshot:
              // Active card: positioned around left ~35% on desktop, drops lower on longer cord
              // Inactive cards: staggered to the right with subtle overlap and higher elevation
              let leftPercent = 35;
              let topPx = 28; // Active card drops lower
              let cardWidth = '330px';
              let zIndex = 30;
              let opacity = 1;
              let scale = 1;

              if (isSelected) {
                leftPercent = 33;
                topPx = 36;
                cardWidth = '340px';
                zIndex = 35;
                opacity = 1;
                scale = 1;
              } else {
                // Trailing cards along the rail to the right
                leftPercent = 33 + offset * 14;
                topPx = 18;
                cardWidth = '315px';
                zIndex = 30 - offset;
                opacity = Math.max(0.65, 0.95 - offset * 0.08);
                scale = 0.97;
              }

              return (
                <div
                  key={product.id}
                  onClick={() => {
                    if (isSelected) {
                      onSelectProduct(product.slug);
                    } else {
                      handleSelect(idx);
                    }
                  }}
                  className="absolute transition-all duration-500 ease-out cursor-pointer flex flex-col items-center"
                  style={{
                    left: `${leftPercent}%`,
                    top: `${topPx}px`,
                    width: cardWidth,
                    transform: `translateX(-50%) scale(${scale})`,
                    zIndex,
                    opacity,
                  }}
                >
                  {/* Realistic Wooden Coat Hanger + Metal Hook hooked on rail */}
                  <div className="flex flex-col items-center -mt-6 mb-1 z-30 pointer-events-none">
                    {/* Metal Hook curving over top of rail */}
                    <div className="w-3.5 h-5 border-t-2 border-r-2 border-neutral-700 rounded-tr-full transform -translate-y-1" />
                    
                    {/* Triangular Wooden Hanger Bar */}
                    <div className="w-20 sm:w-24 h-2.5 bg-gradient-to-r from-[#8a5327] via-[#cf9560] to-[#8a5327] rounded-xs shadow-xs relative flex items-center justify-center">
                      <div className="w-1.5 h-1.5 rounded-full bg-neutral-900" />
                    </div>

                    {/* Suspension Cord dropping to card */}
                    <div
                      className={`w-[1px] bg-neutral-400 ${
                        isSelected ? 'h-5 sm:h-6' : 'h-3 sm:h-4'
                      } transition-all`}
                    />
                  </div>

                  {/* Garment Card Container (Exact match to screenshot) */}
                  <div
                    className={`relative w-full aspect-[3/4] rounded-2xl overflow-hidden transition-all duration-300 bg-neutral-100 group ${
                      isSelected
                        ? 'border-2 border-[#800000] shadow-[0_22px_45px_rgba(0,0,0,0.22)]'
                        : 'border border-neutral-200/90 shadow-md hover:shadow-lg'
                    }`}
                  >
                    {/* High-Resolution Garment / Model Image */}
                    <img
                      src={product.images[0]}
                      alt={product.name}
                      className="w-full h-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-102"
                      loading="lazy"
                    />

                    {/* Top-Left "NEW DROP" Badge (Exact match: Dark maroon pill badge with bold white text) */}
                    {(isSelected || product.isFeatured || offset <= 2) && (
                      <div className="absolute top-3.5 left-3.5 z-20">
                        <span className="bg-[#800000] text-white text-[10px] sm:text-[11px] font-bold tracking-wider px-2.5 py-1 rounded-xs uppercase shadow-sm">
                          NEW DROP
                        </span>
                      </div>
                    )}

                    {/* Quick Add To Bag on Hover for Active Card */}
                    {isSelected && (
                      <div className="absolute top-3.5 right-3.5 z-20 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onAddToCart(product);
                          }}
                          className="w-8 h-8 rounded-full bg-white/95 hover:bg-white text-neutral-900 flex items-center justify-center shadow-md transition-transform hover:scale-110 active:scale-95 cursor-pointer"
                          title="Add To Bag"
                        >
                          <ShoppingBag className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}

                    {/* Bottom Dark Gradient Overlay with Category, Title, and Price (Exact Screenshot Match) */}
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/95 via-black/55 to-transparent pt-14 pb-4 px-4 sm:px-5 flex flex-col justify-end text-white">
                      {/* Uppercase Tracked Category */}
                      <span className="text-[10px] sm:text-[11px] font-medium tracking-widest text-neutral-300 uppercase mb-1">
                        {product.categoryName || 'COUTURE'}
                      </span>

                      {/* Product Title and Price in BDT */}
                      <div className="flex items-baseline justify-between gap-2">
                        <h3 className="text-sm sm:text-[15px] font-semibold text-white tracking-normal truncate max-w-[65%]">
                          {product.name}
                        </h3>
                        <span className="text-sm sm:text-base font-bold text-white shrink-0">
                          ৳{product.price.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};
