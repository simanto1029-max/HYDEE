import React, { useState, useEffect } from 'react';
import { ArrowRight, ShoppingBag } from 'lucide-react';
import { ProductCard } from '../components/ProductCard';
import { store } from '../services/store';
import { metaPixel } from '../services/metaPixel';
import { BundleTier, Product } from '../types';

interface ProductDetailViewProps {
  slug: string;
  onNavigate: (path: string) => void;
  onAddToCart: (product: Product, variantId?: string, quantity?: number, customUnitPrice?: number) => void;
  onBuyNow: (product: Product, variantId?: string, quantity?: number, customUnitPrice?: number) => void;
}

export const ProductDetailView: React.FC<ProductDetailViewProps> = ({
  slug,
  onNavigate,
  onAddToCart,
  onBuyNow,
}) => {
  const product = store.getProductBySlug(slug);

  const [selectedVariantId, setSelectedVariantId] = useState<string>(
    product?.variants[0]?.id || ''
  );
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [selectedTierIndex, setSelectedTierIndex] = useState(1); // Default to Most Popular (Buy 2)

  useEffect(() => {
    if (product) {
      if (product.variants.length > 0) {
        setSelectedVariantId(product.variants[0].id);
      }
      setSelectedImageIndex(0);

      // Always pre-select Most Popular tier by default
      const tiers = (product.bundleTiers && product.bundleTiers.length > 0)
        ? product.bundleTiers
        : [
            { quantity: 1, label: 'Buy 1', price: product.price },
            { quantity: 2, label: 'Buy 2', badge: 'Most Popular', price: Math.round(product.price * 2 * 0.9) },
            { quantity: 3, label: 'Buy 3', price: Math.round(product.price * 3 * 0.8) },
          ];
      const popIdx = tiers.findIndex((t) => t.badge?.toLowerCase().includes('popular'));
      setSelectedTierIndex(popIdx >= 0 ? popIdx : 1);

      // Meta Pixel ViewContent event
      metaPixel.track('ViewContent', {
        content_name: product.name,
        content_category: product.categoryName,
        content_ids: [product.id, product.sku],
        content_type: 'product',
        value: product.price,
        currency: 'BDT',
      });
    }
  }, [slug, product]);

  if (!product) {
    return (
      <div className="py-32 max-w-xl mx-auto px-6 text-center">
        <h2 className="font-serif text-3xl font-bold text-neutral-900">Piece Not Found</h2>
        <p className="text-sm text-neutral-500 mt-3">
          The requested couture piece is no longer available in the HYDEE archives.
        </p>
        <button
          onClick={() => onNavigate('/products')}
          className="mt-6 bg-[#800000] text-white text-xs font-semibold px-8 py-3.5 rounded-full uppercase cursor-pointer"
        >
          Return To Atelier
        </button>
      </div>
    );
  }

  const selectedVariant = product.variants.find((v) => v.id === selectedVariantId) || product.variants[0];
  const unitPrice = selectedVariant?.price || product.price;
  const currentCompareAt = selectedVariant?.compareAtPrice || product.compareAtPrice;

  // Distinct stock calculation per product
  const seed = product.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const distinctStock = selectedVariant?.stock ?? product.stock ?? (((seed * 7) % 15) + 3);
  const isOutOfStock = distinctStock <= 0;

  // Build bundle tiers
  const defaultTiers: BundleTier[] = [
    {
      quantity: 1,
      label: 'Buy 1',
      subtitle: 'Standard Edition',
      price: unitPrice,
    },
    {
      quantity: 2,
      label: 'Buy 2',
      subtitle: 'Save 10% Extra',
      badge: 'Most Popular',
      price: Math.round(unitPrice * 2 * 0.9),
    },
    {
      quantity: 3,
      label: 'Buy 3',
      subtitle: 'Save 20% Extra',
      price: Math.round(unitPrice * 3 * 0.8),
    },
  ];

  const activeTiers = (product.bundleTiers && product.bundleTiers.length > 0)
    ? product.bundleTiers
    : defaultTiers;

  const currentTier = activeTiers[selectedTierIndex] || activeTiers[0];
  const tierQuantity = currentTier.quantity;
  const tierTotalPrice = currentTier.price ?? (unitPrice * tierQuantity);
  const effectiveUnitPrice = Math.round(tierTotalPrice / tierQuantity);

  // Extract unique colors for interactive color circles
  const colorMap = new Map<string, { color: string; colorHex?: string; variantId: string }>();
  product.variants.forEach((v) => {
    if (v.color && !colorMap.has(v.color)) {
      colorMap.set(v.color, {
        color: v.color,
        colorHex: v.colorHex || (v.color.toLowerCase().includes('maroon') ? '#800000' : v.color.toLowerCase().includes('black') ? '#1A1A1A' : v.color.toLowerCase().includes('white') ? '#F8F8F8' : '#C4A482'),
        variantId: v.id,
      });
    }
  });
  const availableColors = Array.from(colorMap.values());

  const similarProducts = store.getSimilarProducts(product, 4);

  const handleAddToCartClick = () => {
    onAddToCart(product, selectedVariant?.id, tierQuantity, effectiveUnitPrice);
  };

  const handleBuyNowClick = () => {
    onBuyNow(product, selectedVariant?.id, tierQuantity, effectiveUnitPrice);
  };

  return (
    <div className="py-6 sm:py-10 bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-8">

        {/* Product Main Display */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          
          {/* Left Column: Product Image Gallery (Full proper size on desktop) */}
          <div className="lg:col-span-6 space-y-3">
            {/* Main Image Frame (Full generous aspect ratio on desktop) */}
            <div className="relative aspect-[4/5] sm:aspect-[3/4] lg:aspect-[4/5] max-h-[560px] lg:max-h-[640px] w-full rounded-2xl overflow-hidden bg-[#F7F6F3] border border-neutral-200/80 shadow-xs">
              <img
                src={product.images[selectedImageIndex] || product.images[0]}
                alt={product.name}
                className="w-full h-full object-cover object-center transition-transform duration-500"
              />
            </div>

            {/* Thumbnail Row */}
            <div className="flex items-center justify-start space-x-2.5 overflow-x-auto no-scrollbar py-1">
              {product.images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImageIndex(idx)}
                  className={`w-14 h-16 sm:w-18 sm:h-20 rounded-xl overflow-hidden shrink-0 border-2 transition-all cursor-pointer ${
                    selectedImageIndex === idx
                      ? 'border-[#800000] ring-1 ring-[#800000] scale-102 shadow-xs'
                      : 'border-neutral-200 opacity-60 hover:opacity-100'
                  }`}
                >
                  <img src={img} alt={`Thumb ${idx + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>

          {/* Right Column: Information, Pricing, Variants & Quantity Tier Selector */}
          <div className="lg:col-span-6 flex flex-col space-y-5">
            <div>
              {/* Product Name (Hind Siliguri Font + Bold) */}
              <h1 className="font-['Hind_Siliguri',sans-serif] font-bold text-2xl sm:text-3xl text-neutral-950 leading-snug">
                {product.name}
              </h1>

              {/* Distinct In-Stock Indicator */}
              <div className="flex items-center gap-2 text-xs text-neutral-600 mt-2">
                <span className={`w-2.5 h-2.5 rounded-full ${isOutOfStock ? 'bg-red-500' : 'bg-emerald-500 animate-pulse'}`} />
                <span className={`font-semibold ${isOutOfStock ? 'text-red-600' : 'text-emerald-700'}`}>
                  {isOutOfStock ? 'Sold Out' : `In Stock (${distinctStock} pieces left)`}
                </span>
              </div>

              {/* Price & Discount (Save % Badge with HYDEE Brand Maroon Background) */}
              <div className="flex items-baseline space-x-3 mt-3">
                <span className="text-2xl sm:text-3xl font-bold text-neutral-950">
                  ৳{unitPrice.toLocaleString()}
                </span>
                {currentCompareAt && currentCompareAt > unitPrice && (
                  <>
                    <span className="text-base text-neutral-400 line-through">
                      ৳{currentCompareAt.toLocaleString()}
                    </span>
                    <span className="text-xs font-bold text-white bg-[#800000] px-2.5 py-0.5 rounded-md shadow-xs">
                      Save {Math.round(((currentCompareAt - unitPrice) / currentCompareAt) * 100)}%
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Variant Selector: Sizes (Without "Select Size" text as requested) */}
            {product.variants.length > 0 && (
              <div className="space-y-3 pt-1">
                {/* Size buttons without "Select Size" label */}
                <div className="grid grid-cols-4 gap-2">
                  {product.variants.map((v) => {
                    const isSelected = v.id === selectedVariantId;
                    return (
                      <button
                        key={v.id}
                        onClick={() => setSelectedVariantId(v.id)}
                        disabled={v.stock <= 0}
                        className={`py-2 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                          isSelected
                            ? 'border-neutral-950 bg-neutral-950 text-white shadow-xs'
                            : v.stock <= 0
                            ? 'border-neutral-200 bg-neutral-100 text-neutral-400 line-through cursor-not-allowed'
                            : 'border-neutral-200 bg-white text-neutral-800 hover:border-neutral-400'
                        }`}
                      >
                        {v.size}
                      </button>
                    );
                  })}
                </div>

                {/* Interactive Color Circle Swatches (Customer can click to select color) */}
                {availableColors.length > 0 && (
                  <div className="space-y-1.5 pt-1">
                    <div className="flex items-center space-x-2 text-xs">
                      <span className="text-neutral-500 font-medium">Color:</span>
                      <span className="font-bold text-neutral-900">{selectedVariant?.color || availableColors[0].color}</span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      {availableColors.map((c) => {
                        const isColSelected = selectedVariant?.color === c.color;
                        return (
                          <button
                            key={c.color}
                            type="button"
                            onClick={() => {
                              const matched = product.variants.find((v) => v.color === c.color);
                              if (matched) setSelectedVariantId(matched.id);
                            }}
                            className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full border-2 transition-all p-0.5 cursor-pointer flex items-center justify-center ${
                              isColSelected
                                ? 'border-[#800000] ring-2 ring-[#800000]/30 scale-110 shadow-xs'
                                : 'border-neutral-300 hover:border-neutral-700'
                            }`}
                            title={c.color}
                            aria-label={c.color}
                          >
                            <span
                              className="w-full h-full rounded-full border border-black/10 inline-block"
                              style={{ backgroundColor: c.colorHex || '#800000' }}
                            />
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ========================================================
                QUANTITY BUNDLE OFFERS (Most Popular selected by default, Maroon Border, All Black Text)
               ======================================================== */}
            <div className="pt-1 space-y-2.5">
              {/* Note: "50% OFF TODAY ONLY" headline removed as requested */}

              {/* Tier Cards (Buy 1 / Buy 2 / Buy 3) */}
              <div className="space-y-2">
                {activeTiers.map((tier, idx) => {
                  const isSelected = selectedTierIndex === idx;
                  const displayTierPrice = tier.price ?? (unitPrice * tier.quantity);
                  const regularTierPrice = (currentCompareAt || unitPrice) * tier.quantity;

                  return (
                    <div
                      key={idx}
                      onClick={() => setSelectedTierIndex(idx)}
                      className={`relative rounded-xl p-3 sm:p-3.5 flex items-center justify-between cursor-pointer transition-all ${
                        isSelected
                          ? 'border-2 border-[#800000] bg-[#800000]/[0.03] shadow-xs'
                          : 'border border-neutral-300 bg-white hover:border-neutral-400'
                      }`}
                    >
                      {/* Pill Badge (e.g. "Most Popular") in HYDEE Maroon */}
                      {tier.badge && (
                        <span className="absolute -top-2.5 right-4 bg-[#800000] text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full tracking-tight shadow-xs">
                          {tier.badge}
                        </span>
                      )}

                      {/* Left: Buy X + Subtitle in Black Text */}
                      <div>
                        <div className="font-bold text-sm text-black">
                          {tier.label}
                        </div>
                        {tier.subtitle && (
                          <div className="text-[11px] text-neutral-700 font-normal mt-0.5">
                            {tier.subtitle}
                          </div>
                        )}
                      </div>

                      {/* Right: Package Price (Smaller text) + Regular Price underneath */}
                      <div className="text-right">
                        <div className="font-bold text-sm sm:text-[15px] text-black">
                          ৳{displayTierPrice.toLocaleString()}
                        </div>
                        <div className="text-[10px] text-neutral-500 font-normal mt-0.5">
                          Regular: <span className="line-through text-neutral-400">৳{regularTierPrice.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Action Buttons (Order Now in HYDEE Maroon, Add To Bag with Maroon Text) */}
            <div className="space-y-2.5 pt-1">
              {/* Order Now (Direct Checkout) */}
              <button
                onClick={handleBuyNowClick}
                disabled={isOutOfStock}
                className="w-full bg-[#800000] hover:bg-[#600000] text-white text-xs sm:text-sm font-bold tracking-wider py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 shadow-md cursor-pointer disabled:bg-neutral-300 active:scale-[0.99]"
              >
                <span>{isOutOfStock ? 'Sold Out' : `Order Now · ৳${tierTotalPrice.toLocaleString()}`}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              {/* Add to Bag (Text in HYDEE Maroon) */}
              <button
                onClick={handleAddToCartClick}
                disabled={isOutOfStock}
                className="w-full bg-white hover:bg-[#800000]/5 text-[#800000] border-2 border-[#800000] text-xs sm:text-sm font-bold tracking-wider py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs disabled:border-neutral-200 disabled:text-neutral-400 active:scale-[0.99]"
              >
                <ShoppingBag className="w-4 h-4 stroke-[2.2]" />
                <span>+ Add To Bag</span>
              </button>
            </div>

            {/* Product Description Underneath Add To Bag Button (Compact & Clean) */}
            <div className="mt-4 pt-4 border-t border-neutral-100 space-y-2">
              <h4 className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">
                Product Details
              </h4>
              <p className="font-['Hind_Siliguri',sans-serif] text-xs sm:text-[13px] text-neutral-700 leading-relaxed font-normal">
                {product.description || product.shortDescription}
              </p>
              {product.specifications?.fabric && (
                <div className="pt-1.5 grid grid-cols-2 gap-2 text-[11px] text-neutral-600 bg-neutral-50/80 p-2.5 rounded-xl border border-neutral-100">
                  <div>
                    <strong className="text-neutral-900 block font-semibold">Fabric:</strong>
                    <span>{product.specifications.fabric}</span>
                  </div>
                  <div>
                    <strong className="text-neutral-900 block font-semibold">Care:</strong>
                    <span>{product.specifications.care}</span>
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>

        {/* Similar Outfits Section */}
        {similarProducts.length > 0 && (
          <div className="mt-16 pt-10 border-t border-neutral-200/80">
            <h2 className="font-serif text-2xl font-normal text-neutral-950 mb-6">
              Complete The Look
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {similarProducts.map((p) => (
                <ProductCard
                  key={p.id}
                  product={p}
                  onSelectProduct={(s) => onNavigate(`/products/${s}`)}
                  onAddToCart={(prod) => onAddToCart(prod)}
                  onBuyNow={(prod) => onBuyNow(prod)}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
