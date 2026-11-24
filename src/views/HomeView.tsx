import React, { useState, useRef, useEffect } from 'react';
import { ProductCard } from '../components/ProductCard';
import { store } from '../services/store';
import { Product } from '../types';
import { HeroSlider } from '../components/HeroSlider';

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
  const [heroSlides, setHeroSlides] = useState(store.getHeroSlides());

  useEffect(() => {
    const unsubscribe = store.subscribe(() => {
      setCategories(store.getCategories());
      setAllProducts(store.getPublishedProducts());
      setHeroSlides(store.getHeroSlides());
    });
    return () => unsubscribe();
  }, []);

  // Active category filter on homepage
  const [selectedCategorySlug, setSelectedCategorySlug] = useState<string>('all');

  // Hero banners are chosen by the admin (Admin > Homepage). Nothing is generated from products.
  const activeHeroSlides = React.useMemo(
    () => heroSlides.filter((sl) => sl.isActive && sl.desktopImage),
    [heroSlides]
  );

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
            1. HERO BANNER (pictures selected by the admin)
           ======================================================== */}
        <HeroSlider slides={activeHeroSlides} onNavigate={onNavigate} />

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
