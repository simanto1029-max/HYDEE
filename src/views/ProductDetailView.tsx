import React, { useState, useEffect } from 'react';
import { ShoppingBag, ArrowRight } from 'lucide-react';
import { store } from '../services/store';
import { metaPixel } from '../services/metaPixel';
import { Product, BundleTier } from '../types';
import { ProductCard } from '../components/ProductCard';

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

  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [selectedVariantId, setSelectedVariantId] = useState<string>('');
  const [selectedTierIndex, setSelectedTierIndex] = useState<number>(0);

  // Initialize variant & track ViewContent
  useEffect(() => {
    if (product) {
      if (product.variants.length > 0) {
        setSelectedVariantId(product.variants[0].id);
      }
      setSelectedImageIndex(0);
      setSelectedTierIndex(0);

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

  // Build bundle tiers matching Screenshot 3
  const bundleHeadline = product.bundleHeadline || '50% OFF TODAY ONLY';
  const defaultTiers: BundleTier[] = [
    {
      quantity: 1,
      label: 'Buy 1',
      subtitle: 'Standard price',
      price: unitPrice,
    },
    {
      quantity: 2,
      label: 'Buy 2',
      subtitle: 'Save 10%',
      badge: 'Most Popular',
      price: Math.round(unitPrice * 2 * 0.9),
    },
    {
      quantity: 3,
      label: 'Buy 3',
      subtitle: 'Save 20%',
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
          
          {/* Left Column: Compact Product Image Gallery (Smaller size requested) */}
          <div className="lg:col-span-6 space-y-3">
            {/* Main Image Frame (Made smaller and bounded in max-height) */}
            <div className="relative aspect-[4/5] max-h-[380px] sm:max-h-[440px] max-w-md mx-auto rounded-xl overflow-hidden bg-neutral-100 border border-neutral-200/80 shadow-xs">
              <img
                src={product.images[selectedImageIndex] || product.images[0]}
                alt={product.name}
                className="w-full h-full object-cover object-center"
              />
            </div>

            {/* Compact Thumbnail Row (Smaller card sizes requested) */}
            <div className="flex items-center justify-center space-x-2 overflow-x-auto no-scrollbar py-1">
              {product.images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImageIndex(idx)}
                  className={`w-14 h-16 sm:w-16 sm:h-18 rounded-lg overflow-hidden shrink-0 border-2 transition-all cursor-pointer ${
                    selectedImageIndex === idx
                      ? 'border-neutral-950 ring-1 ring-neutral-950 scale-102'
                      : 'border-neutral-200 opacity-60 hover:opacity-100'
                  }`}
                >
                  <img src={img} alt={`Thumb ${idx + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>

          {/* Right Column: Information, Pricing, Variants & Screenshot 3 Bundle Tier Selector */}
          <div className="lg:col-span-6 flex flex-col space-y-5">
            <div>
              {/* Product Name (Hind Siliguri Font + Bold as requested) */}
              <h1 className="font-['Hind_Siliguri',sans-serif] font-bold text-2xl sm:text-3xl text-neutral-950 leading-snug">
                {product.name}
              </h1>

              {/* Distinct In-Stock Indicator (SKU text removed as requested) */}
              <div className="flex items-center gap-2 text-xs text-neutral-600 mt-2">
                <span className={`w-2.5 h-2.5 rounded-full ${isOutOfStock ? 'bg-red-500' : 'bg-emerald-500 animate-pulse'}`} />
                <span className={`font-semibold ${isOutOfStock ? 'text-red-600' : 'text-emerald-700'}`}>
                  {isOutOfStock ? 'Sold Out' : `In Stock (${distinctStock} pieces left)`}
                </span>
              </div>

              {/* Price & Discount */}
              <div className="flex items-baseline space-x-3 mt-3">
                <span className="text-2xl sm:text-3xl font-bold text-neutral-950">
                  ৳{unitPrice.toLocaleString()}
                </span>
                {currentCompareAt && currentCompareAt > unitPrice && (
                  <>
                    <span className="text-base text-neutral-400 line-through">
                      ৳{currentCompareAt.toLocaleString()}
                    </span>
                    <span className="text-xs font-semibold text-white bg-black px-2 py-0.5 rounded-sm">
                      Save {Math.round(((currentCompareAt - unitPrice) / currentCompareAt) * 100)}%
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Variant Selector (Size) */}
            {product.variants.length > 0 && (
              <div className="space-y-3 pt-1">
                <div className="flex justify-between text-xs">
                  <span className="font-semibold text-neutral-900">Select Size</span>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {product.variants.map((v) => {
                    const isSelected = v.id === selectedVariantId;
                    return (
                      <button
                        key={v.id}
                        onClick={() => setSelectedVariantId(v.id)}
                        disabled={v.stock <= 0}
                        className={`py-2.5 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
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

                {/* Color indicator if present */}
                {selectedVariant?.color && (
                  <div className="text-xs text-neutral-600 flex items-center space-x-2 pt-1">
                    <span>Color:</span>
                    <span className="font-semibold text-neutral-900">{selectedVariant.color}</span>
                    {selectedVariant?.colorHex && (
                      <span
                        className="w-3.5 h-3.5 rounded-full border border-neutral-300 inline-block shadow-xs"
                        style={{ backgroundColor: selectedVariant.colorHex }}
                      />
                    )}
                  </div>
                )}
              </div>
            )}

            {/* ========================================================
                QUANTITY BUNDLE OFFERS (Exact Screenshot 3 Match)
               ======================================================== */}
            <div className="pt-2 space-y-3">
              {/* Headline: 50% OFF TODAY ONLY */}
              <div className="text-center font-black italic tracking-wider text-neutral-950 text-sm sm:text-base">
                {bundleHeadline}
              </div>

              {/* Tier Cards (Buy 1 / Buy 2 / Buy 3) */}
              <div className="space-y-2.5">
                {activeTiers.map((tier, idx) => {
                  const isSelected = selectedTierIndex === idx;
                  const displayTierPrice = tier.price ?? (unitPrice * tier.quantity);

                  return (
                    <div
                      key={idx}
                      onClick={() => setSelectedTierIndex(idx)}
                      className={`relative rounded-xl p-3.5 sm:p-4 flex items-center justify-between cursor-pointer transition-all ${
                        isSelected
                          ? 'border-2 border-neutral-950 bg-neutral-50/70 shadow-xs'
                          : 'border border-neutral-300 bg-white hover:border-neutral-400'
                      }`}
                    >
                      {/* Pill Badge (e.g. "Most Popular") */}
                      {tier.badge && (
                        <span className="absolute -top-2.5 right-4 bg-neutral-950 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full tracking-tight shadow-xs">
                          {tier.badge}
                        </span>
                      )}

                      {/* Left: Buy X + Subtitle */}
                      <div>
                        <div className="font-bold text-sm sm:text-base text-neutral-950">
                          {tier.label}
                        </div>
                        {tier.subtitle && (
                          <div className="text-xs text-neutral-500 font-normal mt-0.5">
                            {tier.subtitle}
                          </div>
                        )}
                      </div>

                      {/* Right: Package Price */}
                      <div className="text-right">
                        <span className="font-bold text-base sm:text-lg text-neutral-950">
                          ৳{displayTierPrice.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Action Buttons (Add To Bag & Order Now) */}
            <div className="space-y-2.5 pt-2">
              {/* Order Now (Direct Checkout) */}
              <button
                onClick={handleBuyNowClick}
                disabled={isOutOfStock}
                className="w-full bg-neutral-950 hover:bg-[#800000] text-white text-xs sm:text-sm font-bold tracking-wider py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer disabled:bg-neutral-300"
              >
                <span>{isOutOfStock ? 'Sold Out' : `Order Now · ৳${tierTotalPrice.toLocaleString()}`}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              {/* Add to Bag */}
              <button
                onClick={handleAddToCartClick}
                disabled={isOutOfStock}
                className="w-full bg-white hover:bg-neutral-50 text-neutral-950 border border-neutral-300 text-xs sm:text-sm font-bold tracking-wider py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer disabled:border-neutral-200 disabled:text-neutral-400"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>+ Add To Bag</span>
              </button>
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
