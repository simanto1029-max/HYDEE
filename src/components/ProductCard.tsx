import React, { useState } from 'react';
import { Heart } from 'lucide-react';
import { Product } from '../types';

interface ProductCardProps {
  product: Product;
  onSelectProduct: (slug: string) => void;
  onAddToCart: (product: Product) => void;
  onBuyNow?: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onSelectProduct,
  onAddToCart,
  onBuyNow,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(false);

  const primaryImage = product.images[0];
  const secondaryImage = product.images[1] || primaryImage;

  // Calculate discount percentage if compareAtPrice is present
  const discountPercent =
    product.compareAtPrice && product.compareAtPrice > product.price
      ? Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100)
      : null;

  const handleOrderNow = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onBuyNow) {
      onBuyNow(product);
    } else {
      onAddToCart(product);
    }
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    onAddToCart(product);
  };

  return (
    <div
      className="group flex flex-col bg-white rounded-xl sm:rounded-2xl border border-neutral-100/90 shadow-[0_2px_12px_rgba(0,0,0,0.04)] hover:shadow-lg transition-all duration-300 overflow-hidden cursor-pointer"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onSelectProduct(product.slug)}
    >
      {/* Product Image Frame */}
      <div className="relative aspect-[4/5] w-full overflow-hidden bg-[#F6F5F2]">
        <img
          src={isHovered ? secondaryImage : primaryImage}
          alt={product.name}
          className="w-full h-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-105"
          loading="lazy"
        />

        {/* Top-Left Discount Badge Pill (Black with white text matching reference screenshot) */}
        {discountPercent ? (
          <span className="absolute top-2.5 left-2.5 z-10 bg-black text-white text-[10px] sm:text-[11px] font-bold px-2 py-0.5 rounded-md tracking-tight shadow-sm">
            -{discountPercent}%
          </span>
        ) : null}

        {/* Top-Right Heart Wishlist Icon */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setIsWishlisted(!isWishlisted);
          }}
          className="absolute top-2.5 right-2.5 z-10 p-1.5 rounded-full bg-white/70 backdrop-blur-xs text-neutral-700 hover:text-neutral-950 transition-transform active:scale-90 cursor-pointer shadow-xs"
          aria-label="Wishlist"
        >
          <Heart
            className={`w-3.5 h-3.5 stroke-[2] ${
              isWishlisted ? 'fill-[#800000] text-[#800000]' : 'text-neutral-700'
            }`}
          />
        </button>
      </div>

      {/* Product Details Section */}
      <div className="p-3 sm:p-4 flex flex-col flex-1 justify-between">
        <div>
          {/* Small Gold/Tan Category Tag */}
          <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-[#B88B46] block mb-1">
            {product.categoryName || 'HYDEE ATELIER'}
          </span>

          {/* Product Title (2-line clean clamping) */}
          <h3 className="font-medium text-xs sm:text-[14px] text-neutral-900 group-hover:text-[#800000] transition-colors line-clamp-2 leading-snug min-h-[2.5rem]">
            {product.name}
          </h3>

          {/* Price Line (Bold price in ৳ + Compare Price in Strikethrough) */}
          <div className="mt-2 flex items-baseline gap-2">
            <span className="font-bold text-neutral-950 text-sm sm:text-base">
              {product.price.toLocaleString()}৳
            </span>
            {product.compareAtPrice && product.compareAtPrice > product.price && (
              <span className="text-xs text-neutral-400 line-through">
                {product.compareAtPrice.toLocaleString()}৳
              </span>
            )}
          </div>
        </div>

        {/* Dual Action Buttons (ORDER / + CART with matched compact height) */}
        <div className="mt-2.5 pt-1.5 grid grid-cols-2 gap-1.5 sm:gap-2">
          {/* ORDER NOW (Solid Dark Button - 'Order' on mobile, 'Order Now' on sm+) */}
          <button
            type="button"
            onClick={handleOrderNow}
            disabled={product.stock <= 0}
            className="w-full h-8 sm:h-8.5 bg-neutral-950 hover:bg-[#800000] text-white text-[10px] sm:text-[11px] font-bold px-1.5 sm:px-2 rounded-lg transition-all duration-200 tracking-wide uppercase text-center shadow-xs cursor-pointer active:scale-97 flex items-center justify-center leading-none"
          >
            <span className="sm:hidden">{product.stock > 0 ? 'Order' : 'Sold'}</span>
            <span className="hidden sm:inline">{product.stock > 0 ? 'Order Now' : 'Sold Out'}</span>
          </button>

          {/* + CART (Outline / Light Button with matching compact height) */}
          <button
            type="button"
            onClick={handleAddToCart}
            disabled={product.stock <= 0}
            className="w-full h-8 sm:h-8.5 bg-white hover:bg-neutral-50 border border-neutral-300 hover:border-neutral-950 text-neutral-900 text-[10px] sm:text-[11px] font-bold px-1.5 sm:px-2 rounded-lg transition-all duration-200 tracking-wide uppercase text-center cursor-pointer active:scale-97 flex items-center justify-center leading-none"
          >
            + Cart
          </button>
        </div>
      </div>
    </div>
  );
};
