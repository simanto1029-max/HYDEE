import React, { useState } from 'react';
import { ProductCard } from '../components/ProductCard';
import { store } from '../services/store';
import { Product } from '../types';
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';

interface HomeViewProps {
  onNavigate: (path: string) => void;
  onSelectProduct: (slug: string) => void;
  onSelectCategory: (slug: string) => void;
  onAddToCart: (product: Product) => void;
  onBuyNow?: (product: Product) => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  onNavigate,
  onSelectProduct,
  onSelectCategory,
  onAddToCart,
  onBuyNow,
}) => {
  const categories = store.getCategories();
  const allProducts = store.getPublishedProducts();

  // Active category filter on homepage
  const [selectedCategorySlug, setSelectedCategorySlug] = useState<string>('all');

  // Hero carousel slides tailored specifically for Women's Luxury Fashion
  const heroSlidesData = [
    {
      id: 1,
      badge: 'NEW SEASON COLLECTION',
      title: 'Modern Luxury For Women',
      description: 'Handcrafted Jamdani weaves, bespoke silk organza, and artisanal silhouettes tailored for the contemporary woman.',
      ctaText: 'SHOP THE COLLECTION',
      ctaPath: '/products',
      bgImage: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=1600&q=85',
    },
    {
      id: 2,
      badge: 'HERITAGE ATELIER',
      title: 'Monochrome Jamdani Sharees',
      description: 'Generational craftsmanship from Dhaka and Rupganj master looms tailored for international galas.',
      ctaText: 'EXPLORE SHAREE COUTURE',
      ctaPath: '/categories/sharees',
      bgImage: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=1600&q=85',
    },
    {
      id: 3,
      badge: 'CONTEMPORARY READY-TO-WEAR',
      title: 'Bespoke Capes & Outerwear',
      description: 'Fine structured double-faced wool, pure cashmere loungewear, and tailored evening ensembles for her.',
      ctaText: 'DISCOVER SILHOUETTES',
      ctaPath: '/products',
      bgImage: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=1600&q=85',
    },
  ];

  const [activeSlide, setActiveSlide] = useState(0);

  const nextSlide = () => {
    setActiveSlide((prev) => (prev + 1) % heroSlidesData.length);
  };

  const prevSlide = () => {
    setActiveSlide((prev) => (prev - 1 + heroSlidesData.length) % heroSlidesData.length);
  };

  // Filter products based on selected circular category
  const filteredProducts =
    selectedCategorySlug === 'all'
      ? allProducts
      : allProducts.filter((p) => p.categorySlug === selectedCategorySlug);

  const displayProducts = filteredProducts.length > 0 ? filteredProducts : allProducts;

  return (
    <div className="w-full bg-[#FAF9F7] text-neutral-900 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 space-y-8 sm:space-y-12 pt-4">
        {/* ========================================================
            1. HERO / CAMPAIGN CAROUSEL BANNER (Tailored For Women)
           ======================================================== */}
        <section className="relative rounded-2xl overflow-hidden bg-neutral-950 shadow-xl border border-neutral-800">
          <div className="relative min-h-[380px] sm:min-h-[460px] lg:min-h-[500px] flex items-end">
            {/* Background Image with Subtle Vignette Overlay */}
            <div
              className="absolute inset-0 bg-cover bg-center transition-all duration-700 ease-in-out scale-102"
              style={{
                backgroundImage: `url(${heroSlidesData[activeSlide].bgImage})`,
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
            </div>

            {/* Clean Action Button: Only "Shop Now" as requested */}
            <div className="relative z-10 w-full p-6 sm:p-10 flex flex-col sm:flex-row items-center sm:items-end justify-between gap-4 mt-auto">
              <button
                type="button"
                onClick={() => onNavigate('/products')}
                className="bg-gradient-to-r from-[#E5C287] via-[#CCA361] to-[#B88B46] hover:brightness-110 text-neutral-950 font-bold text-xs sm:text-sm px-8 py-3.5 sm:px-10 sm:py-4 rounded-full uppercase tracking-wider shadow-2xl flex items-center gap-2 cursor-pointer transition-all active:scale-95 border border-[#F5E6CC]/40"
              >
                <span>Shop Now</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              {/* Minimalist Slide Dots Indicator */}
              <div className="flex items-center space-x-2 bg-black/40 backdrop-blur-xs px-3 py-1.5 rounded-full border border-white/10">
                {heroSlidesData.map((_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActiveSlide(idx)}
                    className={`h-1.5 rounded-full transition-all cursor-pointer ${
                      activeSlide === idx ? 'w-6 bg-[#E5C287]' : 'w-1.5 bg-white/40 hover:bg-white/70'
                    }`}
                    aria-label={`Slide ${idx + 1}`}
                  />
                ))}
              </div>
            </div>

            {/* Left/Right Thin Navigation Arrow Buttons */}
            <button
              type="button"
              onClick={prevSlide}
              className="absolute left-3 sm:left-5 top-1/2 -translate-y-1/2 z-20 w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-black/40 hover:bg-black/70 border border-white/20 text-white flex items-center justify-center transition-all cursor-pointer backdrop-blur-xs"
              aria-label="Previous Slide"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={nextSlide}
              className="absolute right-3 sm:right-5 top-1/2 -translate-y-1/2 z-20 w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-black/40 hover:bg-black/70 border border-white/20 text-white flex items-center justify-center transition-all cursor-pointer backdrop-blur-xs"
              aria-label="Next Slide"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </section>

        {/* ========================================================
            2. "OUR CATEGORIES" SECTION (Text + Circles Centered in Middle)
           ======================================================== */}
        <section className="space-y-6 text-center">
          {/* Centered Heading and Subtitle in the Middle */}
          <div className="flex flex-col items-center justify-center space-y-1 max-w-xl mx-auto">
            <h2 className="font-serif text-2xl sm:text-3xl font-semibold text-neutral-950 tracking-tight text-center">
              Our Categories
            </h2>
            <p className="text-xs sm:text-sm text-neutral-500 text-center">
              Explore our fashion collections
            </p>
          </div>

          {/* Centered Circular Categories Container */}
          <div className="flex items-center justify-center gap-4 sm:gap-6 overflow-x-auto no-scrollbar py-2 px-2 max-w-4xl mx-auto">
            {/* 1st Circle: "ALL" Solid Dark Circle */}
            <button
              type="button"
              onClick={() => setSelectedCategorySlug('all')}
              className="flex flex-col items-center justify-center shrink-0 cursor-pointer group"
            >
              <div
                className={`w-16 h-16 sm:w-18 sm:h-18 rounded-full flex items-center justify-center transition-all ${
                  selectedCategorySlug === 'all'
                    ? 'bg-neutral-950 text-white ring-2 ring-[#B88B46] shadow-md scale-105'
                    : 'bg-neutral-900 text-white hover:bg-neutral-800'
                }`}
              >
                <span className="font-bold text-xs sm:text-sm tracking-wider uppercase">ALL</span>
              </div>
              <span
                className={`text-[11px] sm:text-xs mt-2 font-medium tracking-tight text-center ${
                  selectedCategorySlug === 'all'
                    ? 'text-neutral-950 font-bold'
                    : 'text-neutral-600 group-hover:text-neutral-900'
                }`}
              >
                All Items
              </span>
            </button>

            {/* Subsequent Category Circles with ring borders & labels centered underneath */}
            {categories.map((cat) => {
              const isSelected = selectedCategorySlug === cat.slug;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategorySlug(cat.slug)}
                  className="flex flex-col items-center justify-center shrink-0 cursor-pointer group"
                >
                  <div
                    className={`w-16 h-16 sm:w-18 sm:h-18 rounded-full overflow-hidden p-0.5 transition-all ${
                      isSelected
                        ? 'ring-2 ring-neutral-950 shadow-md scale-105'
                        : 'ring-1 ring-neutral-300 hover:ring-neutral-700'
                    }`}
                  >
                    <img
                      src={cat.imageUrl}
                      alt={cat.name}
                      className="w-full h-full object-cover rounded-full group-hover:scale-110 transition-transform duration-300"
                    />
                  </div>
                  <span
                    className={`text-[11px] sm:text-xs mt-2 font-medium uppercase tracking-tight text-center ${
                      isSelected
                        ? 'text-neutral-950 font-bold'
                        : 'text-neutral-600 group-hover:text-neutral-900'
                    }`}
                  >
                    {cat.name}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        {/* ========================================================
            3. PRODUCT SHOWCASE GRID (2-Cols Mobile / 4-Cols Desktop)
           ======================================================== */}
        <section className="space-y-4">
          <div className="flex items-center justify-between border-b border-neutral-200/80 pb-3">
            <div>
              <h2 className="font-serif text-2xl sm:text-3xl font-semibold text-neutral-950 tracking-tight">
                {selectedCategorySlug === 'all'
                  ? 'Trending Silhouettes'
                  : categories.find((c) => c.slug === selectedCategorySlug)?.name || 'Collection'}
              </h2>
              <p className="text-xs text-neutral-500 mt-0.5">
                Showing {displayProducts.length} curated luxury pieces
              </p>
            </div>

            <button
              type="button"
              onClick={() => onNavigate('/products')}
              className="text-xs sm:text-sm font-bold uppercase tracking-wider text-neutral-900 hover:text-[#800000] flex items-center gap-1 transition-colors cursor-pointer"
            >
              <span>View All</span>
              <span className="text-sm font-bold">&gt;</span>
            </button>
          </div>

          {/* 2-Column (Mobile) / 4-Column (Desktop) Grid with Dual Action Buttons */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5 sm:gap-6">
            {displayProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onSelectProduct={onSelectProduct}
                onAddToCart={onAddToCart}
                onBuyNow={onBuyNow}
              />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};
