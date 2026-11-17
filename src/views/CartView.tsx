import React, { useMemo } from 'react';
import { ArrowRight, Gift, Minus, Plus, ShoppingBag, Trash2, Truck, Check, ChevronLeft } from 'lucide-react';
import { store } from '../services/store';
import { metaPixel } from '../services/metaPixel';
import { describeOffer } from '../services/pricing';
import { TrustBadgeStrip } from '../components/TrustBadgeStrip';
import { CartItem, Product } from '../types';

interface CartViewProps {
  items: CartItem[];
  onNavigate: (path: string) => void;
  onAddToCart: (product: Product, variantId?: string, quantity?: number, customUnitPrice?: number) => void;
}

export const CartView: React.FC<CartViewProps> = ({ items, onNavigate }) => {
  const settings = store.getSettings();
  const currency = settings.currencySymbol || '৳';
  const pricing = store.getCartPricing(items);
  const zones = store.getDeliveryZones().filter((z) => z.isActive);
  const minFee = zones.length ? Math.min(...zones.map((z) => z.advanceFee)) : 80;
  const maxFee = zones.length ? Math.max(...zones.map((z) => z.advanceFee)) : 150;
  const totalPieces = items.reduce((s, i) => s + i.quantity, 0);

  // "Add more products" suggestions: same categories as what is in the cart first, then best sellers
  const suggestions = useMemo(() => {
    const inCartIds = new Set(items.map((i) => i.productId));
    const cartCategories = new Set(
      items.map((i) => store.getProductById(i.productId)?.categorySlug).filter(Boolean) as string[]
    );
    return store
      .getProducts()
      .filter((p) => !p.isArchived && p.stock > 0 && !inCartIds.has(p.id))
      .sort((a, b) => {
        const score = (p: Product) => (cartCategories.has(p.categorySlug) ? 2 : 0) + (p.isBestSeller ? 1 : 0);
        return score(b) - score(a);
      })
      .slice(0, 6);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items.map((i) => i.productId).join(',')]);

  const quickAdd = (product: Product) => {
    const v = product.variants.find((x) => x.stock > 0) || product.variants[0];
    store.addToCart(product, v?.id, 1, undefined, 'add');
    metaPixel.track('AddToCart', {
      content_name: product.name,
      content_ids: [product.id, product.sku],
      content_type: 'product',
      value: v?.price || product.price,
      currency: 'BDT',
    });
  };

  if (items.length === 0) {
    return (
      <div className="py-24 text-center max-w-md mx-auto px-6">
        <div className="w-16 h-16 rounded-full bg-neutral-100 flex items-center justify-center mx-auto mb-4">
          <ShoppingBag className="w-8 h-8 text-neutral-800" />
        </div>
        <h2 className="font-serif text-2xl font-bold text-neutral-950">Your Cart Is Empty</h2>
        <p className="text-xs text-neutral-600 mt-2">Add something you love and it will appear here.</p>
        <button
          onClick={() => onNavigate('/products')}
          className="mt-6 bg-[#800000] text-white text-xs font-semibold px-7 py-3.5 rounded-full cursor-pointer hover:bg-[#600000] transition-colors"
        >
          Start Shopping
        </button>
      </div>
    );
  }

  const { activeOffer, nextOffer } = pricing;

  return (
    <div className="bg-white min-h-screen py-5 sm:py-10 pb-28 sm:pb-12">
      <div className="max-w-6xl mx-auto px-3.5 sm:px-6 lg:px-8">
        <button
          type="button"
          onClick={() => onNavigate('/products')}
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-black hover:text-[#800000] transition-colors cursor-pointer mb-4"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Continue Shopping</span>
        </button>

        <div className="flex items-baseline gap-2 mb-4">
          <h1 className="text-xl sm:text-2xl font-bold text-black tracking-tight">Your Cart</h1>
          <span className="text-xs text-neutral-500 font-medium">
            {totalPieces} {totalPieces === 1 ? 'item' : 'items'}
          </span>
        </div>

        {/* Offer banner: tells the customer what adding one more product gives */}
        {(activeOffer || nextOffer) && (
          <div
            className={`mb-5 rounded-2xl border p-3.5 sm:p-4 flex items-start gap-3 ${
              activeOffer ? 'bg-emerald-50 border-emerald-200' : 'bg-amber-50 border-amber-200'
            }`}
          >
            <div
              className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                activeOffer ? 'bg-emerald-600 text-white' : 'bg-[#800000] text-white'
              }`}
            >
              {activeOffer ? <Check className="w-5 h-5" /> : <Gift className="w-5 h-5" />}
            </div>
            <div className="min-w-0 text-xs sm:text-sm text-neutral-900 leading-snug space-y-0.5">
              {activeOffer && (
                <p className="font-bold text-emerald-800">
                  Offer unlocked! {describeOffer(activeOffer)} on your order.
                </p>
              )}
              {nextOffer && (
                <p className={activeOffer ? 'text-neutral-700' : 'font-semibold'}>
                  Add <strong>{pricing.productsToNextOffer} more {pricing.productsToNextOffer === 1 ? 'product' : 'products'}</strong>{' '}
                  to get <strong>{describeOffer(nextOffer)}</strong>.
                </p>
              )}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10 items-start">
          {/* LEFT: items + add more */}
          <div className="lg:col-span-7 space-y-8 min-w-0">
            <div className="space-y-3">
              {pricing.lines.map(({ item, lineTotal, regularTotal }) => (
                <div
                  key={`${item.productId}-${item.variantId}`}
                  className="flex gap-3.5 rounded-2xl border border-neutral-200 p-3 bg-white"
                >
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    onClick={() => onNavigate(`/products/${item.slug}`)}
                    className="w-20 h-24 sm:w-24 sm:h-28 object-cover rounded-xl bg-neutral-100 shrink-0 cursor-pointer"
                  />
                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div>
                      <h3 className="font-semibold text-sm text-neutral-950 line-clamp-2 leading-snug">{item.name}</h3>
                      <p className="text-[11px] text-neutral-500 mt-0.5">
                        {item.size && item.size !== 'Free Size' ? `Size: ${item.size} · ` : ''}Color: {item.color}
                      </p>
                    </div>
                    <div className="flex items-end justify-between mt-2">
                      <div className="flex items-center border border-neutral-300 rounded-lg">
                        <button
                          type="button"
                          onClick={() => store.updateCartQuantity(item.productId, item.variantId, item.quantity - 1)}
                          className="p-1.5 hover:bg-neutral-100 text-neutral-700 cursor-pointer"
                          aria-label="Decrease quantity"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="px-3 text-xs font-bold text-neutral-900 tabular-nums">{item.quantity}</span>
                        <button
                          type="button"
                          onClick={() => store.updateCartQuantity(item.productId, item.variantId, item.quantity + 1)}
                          disabled={item.quantity >= item.maxStock}
                          className="p-1.5 hover:bg-neutral-100 text-neutral-700 disabled:opacity-30 cursor-pointer"
                          aria-label="Increase quantity"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-sm text-neutral-950 tabular-nums">
                          {currency}
                          {lineTotal.toLocaleString()}
                        </div>
                        {regularTotal > lineTotal && (
                          <div className="text-[10px] text-neutral-400 line-through tabular-nums">
                            {currency}
                            {regularTotal.toLocaleString()}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => store.removeFromCart(item.productId, item.variantId)}
                    className="self-start p-1 text-neutral-400 hover:text-red-600 transition-colors cursor-pointer"
                    title="Remove"
                    aria-label="Remove item"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            {/* Add more products */}
            {suggestions.length > 0 && (
              <div>
                <div className="flex items-end justify-between mb-3">
                  <div>
                    <h2 className="text-base sm:text-lg font-bold text-neutral-950">Add more products</h2>
                    <p className="text-[11px] sm:text-xs text-neutral-500 mt-0.5">
                      {nextOffer
                        ? `Add ${pricing.productsToNextOffer} more to get ${describeOffer(nextOffer)}`
                        : 'Pair it with something else from the collection'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onNavigate('/products')}
                    className="text-[11px] font-bold text-[#800000] uppercase tracking-wider flex items-center gap-1 cursor-pointer"
                  >
                    <span>See all</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {suggestions.map((p) => {
                    const needsOptions = p.variants.length > 1;
                    return (
                      <div key={p.id} className="rounded-2xl border border-neutral-200 overflow-hidden bg-white flex flex-col">
                        <img
                          src={p.images[0]}
                          alt={p.name}
                          loading="lazy"
                          onClick={() => onNavigate(`/products/${p.slug}`)}
                          className="aspect-[4/5] w-full object-cover bg-neutral-100 cursor-pointer"
                        />
                        <div className="p-2.5 flex flex-col gap-1.5 flex-1">
                          <h3 className="text-xs font-medium text-neutral-900 line-clamp-2 leading-snug min-h-[2rem]">{p.name}</h3>
                          <div className="font-bold text-sm text-neutral-950">
                            {currency}
                            {p.price.toLocaleString()}
                          </div>
                          {needsOptions ? (
                            <button
                              type="button"
                              onClick={() => onNavigate(`/products/${p.slug}`)}
                              className="mt-auto h-8 rounded-lg border border-neutral-950 text-neutral-950 text-[11px] font-bold uppercase tracking-wide cursor-pointer hover:bg-neutral-950 hover:text-white transition-colors"
                            >
                              Select options
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => quickAdd(p)}
                              className="mt-auto h-8 rounded-lg bg-neutral-950 text-white text-[11px] font-bold uppercase tracking-wide cursor-pointer hover:bg-[#800000] transition-colors"
                            >
                              + Add
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* RIGHT: bill */}
          <div className="lg:col-span-5 lg:sticky lg:top-24">
            <div className="rounded-2xl border border-neutral-200 p-4 sm:p-5 bg-neutral-50/60 space-y-3">
              <h2 className="text-base font-bold text-neutral-950">Order Summary</h2>

              <div className="space-y-2 text-xs sm:text-[13px]">
                {pricing.bundleSavings > 0 && (
                  <div className="flex justify-between text-neutral-600">
                    <span>Regular price</span>
                    <span className="line-through tabular-nums">
                      {currency}
                      {pricing.regularSubtotal.toLocaleString()}
                    </span>
                  </div>
                )}
                {pricing.bundleSavings > 0 && (
                  <div className="flex justify-between text-emerald-700 font-semibold">
                    <span>Buy 2 / Buy 3 savings</span>
                    <span className="tabular-nums">
                      - {currency}
                      {pricing.bundleSavings.toLocaleString()}
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-neutral-800">
                  <span>Subtotal</span>
                  <span className="font-bold tabular-nums">
                    {currency}
                    {pricing.subtotal.toLocaleString()}
                  </span>
                </div>
                {pricing.cartOfferDiscount > 0 && activeOffer && (
                  <div className="flex justify-between text-emerald-700 font-semibold">
                    <span>{activeOffer.extraDiscountPercent}% extra off ({pricing.distinctProducts} products)</span>
                    <span className="tabular-nums">
                      - {currency}
                      {pricing.cartOfferDiscount.toLocaleString()}
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-neutral-800">
                  <span className="flex items-center gap-1.5">
                    <Truck className="w-3.5 h-3.5" />
                    Delivery
                  </span>
                  {pricing.freeDelivery ? (
                    <span className="font-bold text-emerald-700">FREE</span>
                  ) : (
                    <span className="font-semibold tabular-nums">
                      {currency}
                      {minFee === maxFee ? minFee : `${minFee} – ${currency}${maxFee}`}{' '}
                      <span className="text-[10px] text-neutral-400 font-normal">(at checkout)</span>
                    </span>
                  )}
                </div>
              </div>

              <div className="border-t border-neutral-300 pt-3 flex justify-between items-baseline">
                <span className="text-sm font-bold text-neutral-950">Total</span>
                <span className="text-lg font-extrabold text-neutral-950 tabular-nums">
                  {currency}
                  {pricing.subtotalAfterOffer.toLocaleString()}
                  {!pricing.freeDelivery && <span className="text-[10px] font-medium text-neutral-500"> + delivery</span>}
                </span>
              </div>

              {(pricing.bundleSavings + pricing.cartOfferDiscount > 0 || pricing.freeDelivery) && (
                <p className="text-[11px] text-emerald-700 font-semibold">
                  You are saving {currency}
                  {(pricing.bundleSavings + pricing.cartOfferDiscount).toLocaleString()}
                  {pricing.freeDelivery ? ' and delivery is free' : ''} 🎉
                </p>
              )}

              <button
                type="button"
                onClick={() => onNavigate('/checkout')}
                className="w-full bg-[#800000] hover:bg-[#600000] active:scale-[0.99] text-white text-xs sm:text-sm font-bold tracking-wider py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 shadow-md cursor-pointer"
              >
                <span>Proceed To Checkout</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <TrustBadgeStrip />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
