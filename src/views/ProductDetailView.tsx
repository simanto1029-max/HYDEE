import React, { useState, useEffect } from 'react';
import { ArrowRight, Check, MessageCircle, ShoppingBag } from 'lucide-react';
import { ProductCard } from '../components/ProductCard';
import { store } from '../services/store';
import { metaPixel } from '../services/metaPixel';
import { BundleTier, Product } from '../types';

interface ProductDetailViewProps {
  slug: string;
  onNavigate: (path: string) => void;
  onAddToCart: (product: Product, variantId?: string, quantity?: number, customUnitPrice?: number) => void;
  onBuyNow: (product: Product, variantId?: string, quantity?: number, customUnitPrice?: number, isFreeShipping?: boolean) => void;
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
  const hasSameCategory = similarProducts.some((p) => p.categorySlug === product.categorySlug);

  const handleAddToCartClick = () => {
    onAddToCart(product, selectedVariant?.id, tierQuantity, effectiveUnitPrice);
  };

  const handleBuyNowClick = () => {
    onBuyNow(product, selectedVariant?.id, tierQuantity, effectiveUnitPrice, currentTier.freeShipping);
  };

  const handleWhatsAppOrder = () => {
    const sizeText = product.hasSizes !== false && selectedVariant?.size && selectedVariant.size !== 'Free Size' ? `\n• Size: ${selectedVariant.size}` : '';
    const colorText = selectedVariant?.color ? `\n• Color: ${selectedVariant.color}` : '';
    const freeShipText = currentTier.freeShipping ? ' (Free Delivery 🎉)' : '';
    const message = `Hello HYDEE! I would like to place an order for:\n\n✨ Product: ${product.name}${sizeText}${colorText}\n📦 Quantity: ${tierQuantity} item(s) (${currentTier.label})\n💰 Total Price: ৳${tierTotalPrice.toLocaleString()}${freeShipText}\n\nProduct Link: ${window.location.origin}/products/${product.slug}`;
    const url = `https://wa.me/8801977771029?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
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

            {/* Color Options & Model Swatches (Right Under Price Section) */}
            {(() => {
              const colorList: { name: string; imageUrl?: string; colorHex?: string }[] =
                product.colorOptions && product.colorOptions.length > 0
                  ? product.colorOptions
                  : availableColors.map((c) => {
                      const v = product.variants.find((vr) => vr.color === c.color);
                      return {
                        name: c.color,
                        imageUrl: v?.colorImage || product.images[0],
                        colorHex: c.colorHex,
                      };
                    });

              if (colorList.length === 0) return null;

              const currentColorName = selectedVariant?.color || colorList[0]?.name;

              return (
                <div className="space-y-2 pt-1">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-neutral-500 font-medium">Color:</span>
                    <span className="font-bold text-neutral-900">{currentColorName}</span>
                  </div>

                  <div className="flex items-center gap-3.5 overflow-x-auto no-scrollbar py-1">
                    {colorList.map((col) => {
                      const isSelected = currentColorName === col.name;
                      const thumbnail = col.imageUrl || product.images[0];

                      return (
                        <button
                          key={col.name}
                          type="button"
                          onClick={() => {
                            const matched = product.variants.find((v) => v.color === col.name);
                            if (matched) setSelectedVariantId(matched.id);

                            // Sync main gallery photo if image matches
                            const imgIdx = product.images.findIndex((img) => img === col.imageUrl);
                            if (imgIdx >= 0) setSelectedImageIndex(imgIdx);
                          }}
                          className="flex flex-col items-center group cursor-pointer shrink-0 focus:outline-hidden"
                        >
                          <div
                            className={`w-16 h-16 sm:w-20 sm:h-20 rounded-2xl p-0.5 relative transition-all ${
                              isSelected
                                ? 'border-2 border-emerald-500 ring-2 ring-emerald-400/40 shadow-md'
                                : 'border-2 border-neutral-200/90 hover:border-neutral-400 shadow-xs'
                            }`}
                          >
                            <div className="w-full h-full rounded-xl overflow-hidden bg-neutral-100 relative">
                              {thumbnail ? (
                                <img
                                  src={thumbnail}
                                  alt={col.name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div
                                  className="w-full h-full flex items-center justify-center font-bold text-xs text-white"
                                  style={{ backgroundColor: col.colorHex || '#800000' }}
                                >
                                  {col.name.slice(0, 3)}
                                </div>
                              )}
                            </div>

                            {/* Screenshot 4 Exact Match: Round green badge with white checkmark in top-right */}
                            {isSelected && (
                              <div className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center text-white shadow-sm ring-2 ring-white">
                                <Check className="w-3.5 h-3.5 stroke-[3]" />
                              </div>
                            )}
                          </div>

                          {/* Color name label below card */}
                          <span
                            className={`text-xs sm:text-sm mt-1.5 font-medium transition-colors ${
                              isSelected ? 'text-slate-900 font-bold' : 'text-slate-600 group-hover:text-slate-900'
                            }`}
                          >
                            {col.name}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })()}

            {/* Variant Selector: Sizes (Directly Under Color, hidden for Sarees/Unstitched) */}
            {product.hasSizes !== false && (
              (() => {
                const displaySizes = (product.customSizes && product.customSizes.length > 0)
                  ? product.customSizes
                  : Array.from(new Set(product.variants.map((v) => v.size).filter((s) => s && s !== 'Free Size' && s !== 'Standard')));
                if (displaySizes.length === 0) return null;
                return (
                  <div className="space-y-2 pt-1">
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                      {displaySizes.map((sz) => {
                        const isSelected = selectedVariant?.size === sz;
                        return (
                          <button
                            key={sz}
                            type="button"
                            onClick={() => {
                              const matched = product.variants.find((v) => v.size === sz && (!selectedVariant?.color || v.color === selectedVariant.color)) || product.variants.find((v) => v.size === sz);
                              if (matched) setSelectedVariantId(matched.id);
                            }}
                            className={`py-2 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                              isSelected
                                ? 'border-neutral-950 bg-neutral-950 text-white shadow-xs'
                                : 'border-neutral-200 bg-white text-neutral-800 hover:border-neutral-400'
                            }`}
                          >
                            {sz}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })()
            )}

            {/* ========================================================
                QUANTITY BUNDLE OFFERS (Screenshot 3 Style)
               ======================================================== */}
            <div className="pt-1 space-y-2.5">

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

                      {/* Left: Buy X + Subtitle + Free Delivery tag if configured */}
                      <div>
                        <div className="font-bold text-sm text-black">
                          {tier.label}
                        </div>
                        {tier.subtitle && (
                          <div className="text-[11px] text-neutral-700 font-normal mt-0.5">
                            {tier.subtitle}
                          </div>
                        )}
                        {tier.freeShipping && (
                          <div className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md mt-1 border border-emerald-200">
                            <Check className="w-3 h-3 stroke-[3]" />
                            <span>Free Delivery (ফ্রি ডেলিভারি)</span>
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

            {/* Action Buttons: Order Now & Order Via WhatsApp */}
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

              {/* Order Via WhatsApp (Replaces Add To Bag as requested) */}
              <button
                type="button"
                onClick={handleWhatsAppOrder}
                className="w-full bg-[#25D366] hover:bg-[#20ba59] text-white text-xs sm:text-sm font-bold tracking-wider py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md active:scale-[0.99]"
              >
                <MessageCircle className="w-5 h-5 fill-white stroke-none" />
                <span>Order Via WhatsApp</span>
              </button>
            </div>

            {/* Product Description Underneath Buttons (whitespace-pre-line preserves newlines & spaces) */}
            <div className="mt-5 pt-5 border-t border-neutral-200/80 space-y-3">
              <h4 className="text-xs sm:text-sm font-bold text-neutral-900 uppercase tracking-widest flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#800000]" />
                <span>Product Details</span>
              </h4>
              <div className="font-['Hind_Siliguri',sans-serif] text-[15px] sm:text-base md:text-[17px] text-neutral-800 leading-relaxed font-normal whitespace-pre-line">
                {product.description || product.shortDescription}
              </div>
              {product.specifications?.fabric && (
                <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs sm:text-sm text-neutral-700 bg-neutral-50 p-3.5 rounded-xl border border-neutral-200/80">
                  <div>
                    <strong className="text-neutral-950 block font-semibold mb-0.5">Fabric:</strong>
                    <span className="leading-snug">{product.specifications.fabric}</span>
                  </div>
                  <div>
                    <strong className="text-neutral-950 block font-semibold mb-0.5">Care:</strong>
                    <span className="leading-snug">{product.specifications.care}</span>
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>

        {/* Similar & Other Recommended Products Section */}
        {similarProducts.length > 0 && (
          <div className="mt-14 sm:mt-20 pt-10 sm:pt-14 border-t border-neutral-200/80">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-6 sm:mb-8 gap-2">
              <div>
                <span className="text-[11px] font-bold tracking-[0.2em] text-[#800000] uppercase block">
                  MORE FROM THIS COLLECTION
                </span>
                <h2 className="font-serif text-2xl sm:text-3xl font-bold text-neutral-950 mt-1">
                  Similar Products
                </h2>
              </div>
              <button
                onClick={() => {
                  onNavigate('/products');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="text-xs font-bold text-[#800000] hover:text-black uppercase tracking-wider self-start sm:self-auto cursor-pointer flex items-center gap-1.5 transition-colors"
              >
                <span>View Full Collection</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {similarProducts.map((p) => (
                <ProductCard
                  key={p.id}
                  product={p}
                  onSelectProduct={(s) => {
                    onNavigate(`/products/${s}`);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
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
