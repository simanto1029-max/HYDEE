import React, { useState, useMemo } from 'react';
import { ProductCard } from '../components/ProductCard';
import { store } from '../services/store';
import { Product } from '../types';
import { SlidersHorizontal, ChevronDown, X, Check } from 'lucide-react';

interface CategoryViewProps {
  categorySlug?: string;
  onNavigate: (path: string) => void;
  onSelectProduct: (slug: string) => void;
  onAddToCart: (product: Product) => void;
  onBuyNow?: (product: Product) => void;
}

export const CategoryView: React.FC<CategoryViewProps> = ({
  categorySlug,
  onNavigate,
  onSelectProduct,
  onAddToCart,
  onBuyNow,
}) => {
  const [sortBy, setSortBy] = useState<'newest' | 'price-asc' | 'price-desc' | 'featured'>('newest');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedCat, setSelectedCat] = useState<string>(categorySlug || 'all');
  const [inStockOnly, setInStockOnly] = useState(false);
  const [maxPrice, setMaxPrice] = useState<number>(30000);

  // Read URL search param if present (e.g. /products?search=hoodie)
  const urlSearchQuery = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('search') || '';
  }, []);

  const categories = store.getCategories();
  const allProducts = store.getPublishedProducts();

  // Filter products
  const filteredProducts = useMemo(() => {
    let result = [...allProducts];

    // Category filter
    if (selectedCat && selectedCat !== 'all') {
      result = result.filter((p) => p.categorySlug === selectedCat);
    }

    // Search query filter
    if (urlSearchQuery.trim()) {
      const q = urlSearchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.categoryName.toLowerCase().includes(q) ||
          p.tags?.some((t) => t.toLowerCase().includes(q))
      );
    }

    // In stock filter
    if (inStockOnly) {
      result = result.filter((p) => p.stock > 0);
    }

    // Price range
    result = result.filter((p) => p.price <= maxPrice);

    // Sorting
    result.sort((a, b) => {
      if (sortBy === 'price-asc') return a.price - b.price;
      if (sortBy === 'price-desc') return b.price - a.price;
      if (sortBy === 'newest') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      return (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0);
    });

    return result;
  }, [allProducts, selectedCat, urlSearchQuery, inStockOnly, maxPrice, sortBy]);

  const activeCategoryObject = categories.find((c) => c.slug === selectedCat);

  return (
    <div className="w-full bg-[#FAF9F7] min-h-screen pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-4 sm:py-6 space-y-4 sm:space-y-6">
        {/* ========================================================
            1. BREADCRUMBS & TITLE HEADER (Exact Screenshot Match)
           ======================================================== */}
        <div className="space-y-1">
          {/* Breadcrumb: Home / All Products */}
          <div className="flex items-center gap-1.5 text-xs text-neutral-500">
            <button
              type="button"
              onClick={() => onNavigate('/')}
              className="hover:text-neutral-900 transition-colors cursor-pointer"
            >
              Home
            </button>
            <span>/</span>
            <span className="text-neutral-800 font-medium">
              {activeCategoryObject ? activeCategoryObject.name : 'All Products'}
            </span>
            {urlSearchQuery && (
              <>
                <span>/</span>
                <span className="text-[#800000]">"{urlSearchQuery}"</span>
              </>
            )}
          </div>

          {/* Bold Title */}
          <h1 className="font-serif text-3xl sm:text-4xl font-semibold text-neutral-950 tracking-tight">
            {activeCategoryObject ? activeCategoryObject.name : 'All Products'}
          </h1>

          {/* Subtitle: Showing X items available in store */}
          <p className="text-xs sm:text-sm text-neutral-500">
            Showing {filteredProducts.length} items available in store
          </p>
        </div>

        {/* ========================================================
            2. CONTROLS BAR: [ ⫴ Filters ] and [ Newest First ▾ ]
           ======================================================== */}
        <div className="flex items-center justify-between gap-3 pt-1 border-b border-neutral-200/80 pb-3">
          {/* Filters Button (Screenshot Match) */}
          <button
            type="button"
            onClick={() => setIsFilterOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-neutral-300 hover:border-neutral-900 rounded-xl text-xs sm:text-sm font-semibold text-neutral-900 shadow-xs transition-all cursor-pointer"
          >
            <SlidersHorizontal className="w-4 h-4 stroke-[1.8]" />
            <span>Filters</span>
            {selectedCat !== 'all' && (
              <span className="w-2 h-2 rounded-full bg-[#800000]" />
            )}
          </button>

          {/* Sort Dropdown Selector (Screenshot Match) */}
          <div className="relative">
            <div className="flex items-center gap-2 px-3.5 py-2 bg-white border border-neutral-300 rounded-xl text-xs sm:text-sm font-semibold text-neutral-900 shadow-xs cursor-pointer">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                aria-label="Sort products by"
                className="appearance-none bg-transparent pr-5 text-xs sm:text-sm font-semibold text-neutral-900 focus:outline-none cursor-pointer"
              >
                <option value="newest">Newest First</option>
                <option value="featured">Best Sellers</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
              </select>
              <ChevronDown className="w-4 h-4 stroke-[2] text-neutral-600 absolute right-3 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Quick Category Badges Bar */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
          <button
            type="button"
            onClick={() => setSelectedCat('all')}
            className={`text-xs px-3.5 py-1.5 rounded-full font-medium transition-all whitespace-nowrap cursor-pointer ${
              selectedCat === 'all'
                ? 'bg-neutral-950 text-white shadow-xs'
                : 'bg-white border border-neutral-200 text-neutral-700 hover:bg-neutral-100'
            }`}
          >
            All Items
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setSelectedCat(c.slug)}
              className={`text-xs px-3.5 py-1.5 rounded-full font-medium transition-all whitespace-nowrap cursor-pointer ${
                selectedCat === c.slug
                  ? 'bg-neutral-950 text-white shadow-xs'
                  : 'bg-white border border-neutral-200 text-neutral-700 hover:bg-neutral-100'
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>

        {/* ========================================================
            3. PRODUCT GRID: 2-Cols (Mobile) / 4-Cols (Desktop)
           ======================================================== */}
        {filteredProducts.length === 0 ? (
          <div className="bg-white rounded-2xl border border-neutral-200 p-12 text-center space-y-4">
            <p className="text-neutral-500 text-sm">No items found matching your filters.</p>
            <button
              type="button"
              onClick={() => {
                setSelectedCat('all');
                setInStockOnly(false);
                setMaxPrice(30000);
                if (urlSearchQuery) {
                  onNavigate('/products');
                }
              }}
              className="text-xs font-semibold uppercase tracking-wider text-[#800000] underline cursor-pointer"
            >
              Reset All Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5 sm:gap-6">
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onSelectProduct={onSelectProduct}
                onAddToCart={onAddToCart}
                onBuyNow={onBuyNow}
              />
            ))}
          </div>
        )}
      </div>

      {/* ========================================================
          4. FILTER MODAL / DRAWER
         ======================================================== */}
      {isFilterOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-neutral-950/50 backdrop-blur-xs transition-opacity"
            onClick={() => setIsFilterOpen(false)}
          />
          <div className="relative ml-auto w-full max-w-sm bg-white h-full shadow-2xl flex flex-col z-10 animate-in slide-in-from-right duration-300">
            {/* Header */}
            <div className="p-5 border-b border-neutral-100 flex items-center justify-between">
              <span className="font-serif text-xl font-bold text-neutral-950">Refine Selection</span>
              <button
                type="button"
                onClick={() => setIsFilterOpen(false)}
                className="p-1.5 text-neutral-500 hover:text-neutral-900 rounded-full hover:bg-neutral-100"
              >
                <X className="w-5 h-5 stroke-[1.8]" />
              </button>
            </div>

            {/* Filter Content */}
            <div className="flex-1 overflow-y-auto p-5 space-y-6">
              {/* Category */}
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 block mb-3">
                  Category
                </span>
                <div className="space-y-1.5">
                  <button
                    type="button"
                    onClick={() => setSelectedCat('all')}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium ${
                      selectedCat === 'all'
                        ? 'bg-neutral-950 text-white font-bold'
                        : 'text-neutral-700 hover:bg-neutral-100'
                    }`}
                  >
                    <span>All Categories</span>
                    {selectedCat === 'all' && <Check className="w-3.5 h-3.5" />}
                  </button>
                  {categories.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setSelectedCat(c.slug)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium ${
                        selectedCat === c.slug
                          ? 'bg-neutral-950 text-white font-bold'
                          : 'text-neutral-700 hover:bg-neutral-100'
                      }`}
                    >
                      <span>{c.name}</span>
                      {selectedCat === c.slug && <Check className="w-3.5 h-3.5" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Price range */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">
                    Maximum Price
                  </span>
                  <span className="text-xs font-bold text-neutral-900">
                    {maxPrice.toLocaleString()}৳
                  </span>
                </div>
                <input
                  type="range"
                  min="2000"
                  max="30000"
                  step="500"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(Number(e.target.value))}
                  className="w-full accent-[#800000] cursor-pointer"
                />
              </div>

              {/* In stock toggle */}
              <div className="pt-2">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={inStockOnly}
                    onChange={(e) => setInStockOnly(e.target.checked)}
                    className="w-4 h-4 rounded text-[#800000] focus:ring-[#800000] border-neutral-300"
                  />
                  <span className="text-xs font-medium text-neutral-800">
                    Show In-Stock Silhouettes Only
                  </span>
                </label>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="p-5 border-t border-neutral-100 flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setSelectedCat('all');
                  setInStockOnly(false);
                  setMaxPrice(30000);
                }}
                className="flex-1 py-2.5 border border-neutral-300 text-neutral-700 text-xs font-bold uppercase tracking-wider rounded-xl hover:bg-neutral-50"
              >
                Reset
              </button>
              <button
                type="button"
                onClick={() => setIsFilterOpen(false)}
                className="flex-1 py-2.5 bg-neutral-950 hover:bg-[#800000] text-white text-xs font-bold uppercase tracking-wider rounded-xl"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
