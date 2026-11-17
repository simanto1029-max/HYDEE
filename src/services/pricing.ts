// ONE place that decides every price in the store.
// The product page, cart page, checkout page and the order saved in the database all use these same functions,
// so the amount a customer sees is always the amount that is saved in the order.

import { BundleTier, CartItem, CartOfferRule, Product, SiteSettings } from '../types';

// ---------------------------------------------------------------------------
// 1) Same-product bundle tiers (Buy 1 / Buy 2 / Buy 3) - edited per product in Admin > Products
// ---------------------------------------------------------------------------

export const isTierFreeShipping = (t: BundleTier): boolean => {
  // The admin's Free Delivery tick is the single source of truth
  if (typeof t.freeShipping === 'boolean') return t.freeShipping;
  // Very old products without the tick: keep the previous guessing behaviour
  return Boolean(
    t.subtitle?.toLowerCase().includes('free delivery') ||
      t.subtitle?.includes('ফ্রি ডেলিভারি') ||
      t.quantity >= 3
  );
};

export const isBundleEnabled = (product: Product): boolean =>
  product.bundleEnabled !== false && !product.bundleTiers?.[0]?.bundleOff;

// The tiers exactly as the customer sees them for a given single-piece price
export const buildTiers = (product: Product, unitPrice: number): BundleTier[] => {
  const defaultTiers: BundleTier[] = [
    { quantity: 1, label: 'Buy 1', subtitle: 'Standard Edition', price: unitPrice },
    {
      quantity: 2,
      label: 'Buy 2',
      subtitle: 'Save 10% Extra',
      badge: 'Most Popular',
      price: Math.round(unitPrice * 2 * 0.9),
      freeShipping: false,
    },
    {
      quantity: 3,
      label: 'Buy 3',
      subtitle: 'Save 20% Extra + Free Delivery',
      price: Math.round(unitPrice * 3 * 0.8),
      freeShipping: true,
    },
  ];

  const raw = product.bundleTiers && product.bundleTiers.length > 0 ? product.bundleTiers : defaultTiers;

  return raw.map((t, idx) => {
    if (idx === 0) return { ...t, price: unitPrice };
    if (idx === 1 && (!t.price || t.price > unitPrice * 3 || t.price < unitPrice)) {
      return { ...t, price: Math.round(unitPrice * 2 * 0.9) };
    }
    if (idx === 2 && (!t.price || t.price > unitPrice * 4 || t.price < unitPrice)) {
      return { ...t, price: Math.round(unitPrice * 3 * 0.8) };
    }
    return t;
  });
};

export const getVariantUnitPrice = (product: Product, variantId?: string): number => {
  const v = product.variants.find((x) => x.id === variantId) || product.variants[0];
  return Number(v?.price || product.price);
};

// Total price for `qty` pieces of one product (all its sizes/colours together) + whether that quantity earns free delivery
export const priceProductQuantity = (
  product: Product,
  unitPrice: number,
  qty: number
): { total: number; regularTotal: number; freeShipping: boolean; tierLabel?: string } => {
  const regularTotal = unitPrice * qty;
  if (!isBundleEnabled(product) || qty <= 0) {
    return { total: regularTotal, regularTotal, freeShipping: false };
  }
  const tiers = buildTiers(product, unitPrice)
    .filter((t) => t.quantity >= 1)
    .sort((a, b) => a.quantity - b.quantity);

  // the biggest tier that fits into this quantity; the pieces above it are charged at the normal price
  let matched: BundleTier | undefined;
  for (const t of tiers) {
    if (t.quantity <= qty) matched = t;
  }
  if (!matched) return { total: regularTotal, regularTotal, freeShipping: false };

  const tierPrice = matched.quantity === 1 ? unitPrice : Number(matched.price ?? unitPrice * matched.quantity);
  const total = Math.min(regularTotal, tierPrice + (qty - matched.quantity) * unitPrice);
  return {
    total,
    regularTotal,
    freeShipping: matched.quantity > 1 && isTierFreeShipping(matched),
    tierLabel: matched.label,
  };
};

// ---------------------------------------------------------------------------
// 2) Whole-cart offers (different products together) - edited in Admin > Offers & Badges
// ---------------------------------------------------------------------------

export const getCartOfferRules = (settings: SiteSettings): CartOfferRule[] => {
  if (settings.cartOffersEnabled === false) return [];
  return (settings.cartOffers || [])
    .filter((r) => r.enabled && r.minProducts >= 2)
    .sort((a, b) => a.minProducts - b.minProducts);
};

export const describeOffer = (r: CartOfferRule): string => {
  const parts: string[] = [];
  if (r.extraDiscountPercent > 0) parts.push(`${r.extraDiscountPercent}% extra off`);
  if (r.freeDelivery) parts.push('Free Delivery');
  return parts.join(' + ');
};

// ---------------------------------------------------------------------------
// 3) The full cart
// ---------------------------------------------------------------------------

export interface PricedLine {
  item: CartItem;
  unitPrice: number; // effective price per piece after bundle pricing (may have decimals)
  lineTotal: number;
  regularTotal: number;
}

export interface CartPricing {
  lines: PricedLine[];
  regularSubtotal: number; // everything at the normal single-piece price
  bundleSavings: number; // saved through Buy 2 / Buy 3 on the same product
  subtotal: number; // after bundle pricing, before cart offer
  distinctProducts: number;
  activeOffer: CartOfferRule | null;
  nextOffer: CartOfferRule | null;
  productsToNextOffer: number;
  cartOfferDiscount: number;
  subtotalAfterOffer: number;
  freeDeliveryFromBundle: boolean;
  freeDeliveryFromCartOffer: boolean;
  freeDelivery: boolean;
}

export const priceCart = (
  items: CartItem[],
  settings: SiteSettings,
  getProduct: (id: string) => Product | undefined
): CartPricing => {
  // group lines by product, because Buy 2 / Buy 3 counts all sizes & colours of the same product together
  const groups = new Map<string, CartItem[]>();
  items.forEach((it) => {
    if (it.quantity <= 0) return;
    groups.set(it.productId, [...(groups.get(it.productId) || []), it]);
  });

  const lines: PricedLine[] = [];
  let freeDeliveryFromBundle = false;

  groups.forEach((groupItems, productId) => {
    const product = getProduct(productId);
    if (!product) {
      // product was deleted: keep the price the cart remembers, no offers
      groupItems.forEach((it) =>
        lines.push({ item: it, unitPrice: it.price, lineTotal: it.price * it.quantity, regularTotal: it.price * it.quantity })
      );
      return;
    }

    const qty = groupItems.reduce((s, i) => s + i.quantity, 0);
    const basePrices = groupItems.map((it) => getVariantUnitPrice(product, it.variantId));
    const refUnit = basePrices[0];
    const group = priceProductQuantity(product, refUnit, qty);
    if (group.freeShipping) freeDeliveryFromBundle = true;

    const factor = group.regularTotal > 0 ? group.total / group.regularTotal : 1;
    let allocated = 0;
    groupItems.forEach((it, idx) => {
      const regular = basePrices[idx] * it.quantity;
      const isLast = idx === groupItems.length - 1;
      const lineTotal = isLast ? Math.max(0, Math.round(group.total) - allocated) : Math.round(regular * factor);
      allocated += lineTotal;
      lines.push({
        item: it,
        unitPrice: it.quantity > 0 ? lineTotal / it.quantity : 0,
        lineTotal,
        regularTotal: regular,
      });
    });
  });

  // keep the same order as the cart
  lines.sort(
    (a, b) =>
      items.findIndex((i) => i.productId === a.item.productId && i.variantId === a.item.variantId) -
      items.findIndex((i) => i.productId === b.item.productId && i.variantId === b.item.variantId)
  );

  const regularSubtotal = lines.reduce((s, l) => s + l.regularTotal, 0);
  const subtotal = lines.reduce((s, l) => s + l.lineTotal, 0);
  const distinctProducts = groups.size;

  const rules = getCartOfferRules(settings);
  const fitting = rules.filter((r) => distinctProducts >= r.minProducts); // sorted: the last one that fits is the best
  const activeOffer: CartOfferRule | null = fitting.length > 0 ? fitting[fitting.length - 1] : null;
  const nextOffer = rules.find((r) => r.minProducts > distinctProducts) || null;

  const cartOfferDiscount = activeOffer
    ? Math.round((subtotal * Math.max(0, Math.min(100, activeOffer.extraDiscountPercent))) / 100)
    : 0;
  const freeDeliveryFromCartOffer = Boolean(activeOffer && activeOffer.freeDelivery);

  return {
    lines,
    regularSubtotal,
    bundleSavings: Math.max(0, regularSubtotal - subtotal),
    subtotal,
    distinctProducts,
    activeOffer,
    nextOffer,
    productsToNextOffer: nextOffer ? nextOffer.minProducts - distinctProducts : 0,
    cartOfferDiscount,
    subtotalAfterOffer: Math.max(0, subtotal - cartOfferDiscount),
    freeDeliveryFromBundle,
    freeDeliveryFromCartOffer,
    freeDelivery: freeDeliveryFromBundle || freeDeliveryFromCartOffer,
  };
};
