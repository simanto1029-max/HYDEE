import React, { useState, useRef, useEffect } from 'react';
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
  const [categories, setCategories] = useState(store.getCategories());
  const [allProducts, setAllProducts] = useState(store.getPublishedProducts());

  useEffect(() => {
    const unsubscribe = store.subscribe(() => {
      setCategories(store.getCategories());
      setAllProducts(store.getPublishedProducts());
    });
    return () => unsubscribe();
  }, []);

  // Active category filter on homepage
  const [selectedCategorySlug, setSelectedCategorySlug] = useState<string>('all');

  // Dynamically generate hero showcase from real products (NO fake mock products)
  const heroShowcaseData = React.useMemo(() => {
    if (allProducts.length === 0) {
      return [
        {
          id: 0,
          categorySlug: 'all',
          categoryLabel: 'HYDEE Collection',
          headlinePart1: 'HYDEE Bespoke',
          headlinePart2: 'Luxury In Every Fold',
          description: 'Handcrafted haute couture silhouettes designed with generational artisanal legacy in Tangail, Bangladesh.',
          tagline: 'Handcrafted in Tangail · 100% Bespoke Elegance',
          productSlug: '',
          bgImage: '/images/editorial-glory-red.jpg',
          bgPosition: 'center 18%',
        },
      ];
    }

    const featured = allProducts.filter((p) => p.isFeatured || p.isHangerFeatured);
    const pool = featured.length > 0 ? featured : allProducts;

    return pool.slice(0, 6).map((p, idx) => {
      const words = p.name.split(' ');
      const p1 = words.slice(0, Math.min(3, words.length)).join(' ');
      const p2 = words.slice(Math.min(3, words.length)).join(' ') || 'Atelier Collection';
      return {
        id: idx,
        categorySlug: p.categorySlug,
        categoryLabel: p.categoryName || 'Exclusive Piece',
        headlinePart1: p1,
        headlinePart2: p2,
        description: p.shortDescription || p.description?.slice(0, 150) || 'Luxury in every fold. Handcrafted in Tangail.',
        tagline: `৳${p.price.toLocaleString()} · Handcrafted in Tangail`,
        productSlug: p.slug,
        bgImage: p.images[0] || '/images/editorial-glory-red.jpg',
        bgPosition: 'center 18%',
      };
    });
  }, [allProducts]);

  const [activeSlide, setActiveSlide] = useState(0);

  const safeSlideIndex = activeSlide < heroShowcaseData.length ? activeSlide : 0;
  const currentHero = heroShowcaseData[safeSlideIndex] || heroShowcaseData[0];

  const nextSlide = () => {
    setActiveSlide((prev) => (prev + 1) % heroShowcaseData.length);
  };

  const prevSlide = () => {
    setActiveSlide((prev) => (prev - 1 + heroShowcaseData.length) % heroShowcaseData.length);
  };

  // Drag-to-scroll & Touch support for circular categories
  const categoryScrollRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!categoryScrollRef.current) return;
    setIsDragging(true);
    setStartX(e.pageX - categoryScrollRef.current.offsetLeft);
    setScrollLeft(categoryScrollRef.current.scrollLeft);
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !categoryScrollRef.current) return;
    e.preventDefault();
    const x = e.pageX - categoryScrollRef.current.offsetLeft;
    const walk = (x - startX) * 1.6;
    categoryScrollRef.current.scrollLeft = scrollLeft - walk;
  };

  // Filter products based on selected circular category
  const filteredProducts =
    selectedCategorySlug === 'all'
      ? allProducts
      : allProducts.filter((p) => p.categorySlug === selectedCategorySlug);

  const displayProducts = filteredProducts.length > 0 ? filteredProducts : allProducts;

  return (
    <div className="w-full bg-[#FAF9F7] text-neutral-900 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10 sm:space-y-14 pt-3">

        {/* ========================================================
            1. HERO SHOWCASE (Women Model Background in HYDEE Maroon Palette)
           ======================================================== */}
        <section className="relative rounded-3xl overflow-hidden bg-neutral-950 text-white shadow-2xl shadow-[#4A0000]/30 border border-[#990000]/40 transition-all min-h-[400px] sm:min-h-[460px] lg:min-h-[520px] flex flex-col justify-between p-6 sm:p-10 lg:p-14">
          
          {/* Full-bleed Women Model Background with HYDEE Royal Maroon Gradient Overlay */}
          <div
            className="absolute inset-0 bg-cover transition-all duration-1000 ease-in-out scale-102"
            style={{
              backgroundImage: `url(${currentHero.bgImage})`,
              backgroundPosition: currentHero.bgPosition || 'center 20%',
            }}
          >
            {/* Deep Rich HYDEE Maroon Gradient Overlay (Protects readability, showcases luxury woman model) */}
            <div className="absolute inset-0 bg-gradient-to-r from-[#4A0000]/95 via-[#660000]/80 to-[#800000]/30 sm:from-[#4A0000]/90 sm:via-[#660000]/60 sm:to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-black/30" />
          </div>

          {/* Top Pill Category Navigation */}
          <div className="relative z-20 flex justify-center sm:justify-start mb-6 sm:mb-8">
            <div className="bg-black/45 backdrop-blur-md border border-white/20 rounded-full p-1 sm:p-1.5 flex items-center gap-1 sm:gap-1.5 max-w-full overflow-x-auto no-scrollbar touch-scroll">
              {heroShowcaseData.map((item, idx) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveSlide(idx)}
                  className={`text-[11px] sm:text-xs font-semibold px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-full transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                    activeSlide === idx
                      ? 'bg-white text-neutral-950 shadow-md font-bold scale-102'
                      : 'text-white/80 hover:text-white hover:bg-white/10'
                  }`}
                >
                  {item.categoryLabel}
                </button>
              ))}
            </div>
          </div>

          {/* Main Hero Content: Headlines, Description & Action Button */}
          <div className="relative z-10 max-w-xl space-y-4 text-left my-auto">
            {/* Minimal Navigation Arrows */}
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={prevSlide}
                className="w-8 h-8 rounded-full bg-black/40 border border-white/25 text-white flex items-center justify-center hover:bg-white hover:text-neutral-950 transition-all cursor-pointer backdrop-blur-xs active:scale-95"
                aria-label="Previous Outfit"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={nextSlide}
                className="w-8 h-8 rounded-full bg-black/40 border border-white/25 text-white flex items-center justify-center hover:bg-white hover:text-neutral-950 transition-all cursor-pointer backdrop-blur-xs active:scale-95"
                aria-label="Next Outfit"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Bold Headline */}
            <h1 className="font-sans text-3xl sm:text-4xl lg:text-5xl font-bold text-white tracking-tight leading-[1.12]">
              {currentHero.headlinePart1} <br />
              <span className="font-light text-white/90">{currentHero.headlinePart2}</span>
            </h1>

            {/* Concise Editorial Subtitle */}
            <p className="text-xs sm:text-sm text-white/85 leading-relaxed font-normal max-w-md">
              {currentHero.description}
            </p>

            {/* Action Pill Button: "Get The Look ->" */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => {
                  if (currentHero && currentHero.productSlug) {
                    onNavigate(`/products/${currentHero.productSlug}`);
                  } else {
                    onNavigate('/products');
                  }
                }}
                className="bg-white hover:bg-neutral-100 text-neutral-950 font-bold text-xs sm:text-sm px-7 py-3 sm:px-8 sm:py-3.5 rounded-full tracking-wide flex items-center gap-2 shadow-xl hover:shadow-2xl transition-all cursor-pointer active:scale-95 border border-white/40"
              >
                <span>Get The Look</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Bottom Indicators & Tagline */}
          <div className="relative z-10 flex items-center justify-between pt-6 border-t border-white/10 text-xs text-white/70">
            <span className="font-serif italic text-white/85 text-[11px] sm:text-xs">
              {currentHero.tagline}
            </span>
            <div className="flex items-center space-x-1.5">
              {heroShowcaseData.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setActiveSlide(idx)}
                  className={`h-1.5 rounded-full transition-all cursor-pointer ${
                    activeSlide === idx ? 'w-6 bg-white' : 'w-1.5 bg-white/40 hover:bg-white/70'
                  }`}
                  aria-label={`Slide ${idx + 1}`}
                />
              ))}
            </div>
          </div>

        </section>

        {/* ========================================================
            2. "OUR CATEGORIES" SECTION (Smooth Touch & Mouse Scrollable)
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

          {/* Smooth Scrollable Circular Categories (Touch & Mouse Drag with NO clipping) */}
          <div
            ref={categoryScrollRef}
            onMouseDown={handleMouseDown}
            onMouseLeave={handleMouseLeave}
            onMouseUp={handleMouseUp}
            onMouseMove={handleMouseMove}
            className="flex items-center justify-start sm:justify-center gap-4 sm:gap-6 overflow-x-auto touch-scroll no-scrollbar py-3 px-4 max-w-5xl mx-auto scroll-smooth overscroll-x-contain cursor-grab active:cursor-grabbing select-none"
          >
            {/* 1st Circle: "ALL" Solid Dark Circle */}
            <button
              type="button"
              onClick={() => setSelectedCategorySlug('all')}
              className="flex flex-col items-center justify-center shrink-0 cursor-pointer group transition-transform active:scale-95"
            >
              <div
                className={`w-16 h-16 sm:w-18 sm:h-18 rounded-full flex items-center justify-center transition-all ${
                  selectedCategorySlug === 'all'
                    ? 'bg-neutral-950 text-white ring-2 ring-[#800000] shadow-md scale-105'
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
                  className="flex flex-col items-center justify-center shrink-0 cursor-pointer group transition-transform active:scale-95"
                >
                  <div
                    className={`w-16 h-16 sm:w-18 sm:h-18 rounded-full overflow-hidden p-0.5 transition-all ${
                      isSelected
                        ? 'ring-2 ring-[#800000] shadow-md scale-105'
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
            3. PRODUCT SHOWCASE GRID (Smooth 60fps GPU Animations)
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

          {/* 2-Column (Mobile) / 4-Column (Desktop) Grid with Dual Action Buttons & Smooth Entrance */}
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
