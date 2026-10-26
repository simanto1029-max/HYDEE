export interface ProductVariant {
  id: string;
  name: string; // e.g. "Size 40 / Maroon"
  size: string; // e.g. "38", "40", "42", "44", "S", "M", "L", "XL"
  color: string; // e.g. "Maroon", "Pearl White", "Obsidian Black"
  colorHex?: string;
  sku: string;
  price: number;
  compareAtPrice?: number;
  stock: number;
}

export interface BundleTier {
  quantity: number; // e.g. 1, 2, 3
  label: string; // e.g. "Buy 1", "Buy 2", "Buy 3"
  subtitle?: string; // e.g. "Standard price", "Save 10%", "Save 20%"
  price?: number; // custom package price in BDT
  badge?: string; // e.g. "Most Popular"
}

export interface Product360Frame {
  id: string;
  frameIndex: number;
  imageUrl: string;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  sku: string;
  categorySlug: string;
  categoryName: string;
  price: number;
  compareAtPrice?: number;
  costPrice?: number;
  stock: number;
  description: string;
  shortDescription?: string;
  specifications: {
    fabric: string;
    fit: string;
    care: string;
    origin: string;
    craftsmanshipNotes?: string;
  };
  images: string[];
  transparentImage?: string; // For fashion hanger display
  has360View?: boolean;
  frames360?: string[]; // 8-16 rotation frames
  variants: ProductVariant[];
  tags: string[];
  isBestSeller?: boolean;
  isFeatured?: boolean;
  isHangerFeatured?: boolean;
  isArchived?: boolean;
  createdAt: string;
  updatedAt: string;
  manualRecommendationIds?: string[];
  bundleHeadline?: string; // e.g. "50% OFF TODAY ONLY"
  bundleTiers?: BundleTier[]; // Tiered bundle offers (Buy 1, Buy 2, Buy 3)
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  imageUrl: string;
  displayOrder: number;
  productCount?: number;
}

export interface DeliveryZone {
  id: string;
  name: string; // "Inside Dhaka", "Outside Dhaka", "Dhaka Suburbs"
  advanceFee: number; // e.g. 80, 150 BDT
  estimatedDays: string; // e.g. "24 - 48 Hours"
  isActive: boolean;
}

export interface CartItem {
  productId: string;
  variantId: string;
  name: string;
  slug: string;
  imageUrl: string;
  size: string;
  color: string;
  price: number;
  quantity: number;
  maxStock: number;
}

export type OrderStatus =
  | 'PENDING_ADVANCE'
  | 'CONFIRMED'
  | 'PROCESSING'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'REFUNDED';

export type PaymentStatus =
  | 'UNPAID'
  | 'ADVANCE_VERIFIED'
  | 'COD_COLLECTED'
  | 'FULLY_PAID'
  | 'FAILED'
  | 'MANUAL_REVIEW'
  | 'REFUNDED';

export interface OrderItem {
  productId: string;
  productName: string;
  variantId: string;
  variantName: string;
  price: number;
  quantity: number;
  imageUrl: string;
}

export interface Order {
  id: string;
  orderNumber: string; // e.g. "HYD-2026-8910"
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  deliveryAddress: string;
  district: string;
  zoneId: string;
  zoneName: string;
  notes?: string;
  items: OrderItem[];
  subtotal: number;
  advanceDeliveryFee: number;
  discountAmount: number;
  discountCode?: string;
  totalAmount: number; // Subtotal + Delivery - Discount
  remainingCodAmount: number; // Total - Advance paid
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  advancePaymentMethod?: 'bkash' | 'nagad' | 'rocket' | 'card' | 'manual_deposit';
  transactionId?: string;
  verifiedAt?: string;
  dispatchedAt?: string;
  deliveredAt?: string;
  courierName?: 'Steadfast' | 'Pathao' | 'Paperfly' | 'RedX' | 'eCourier' | string;
  courierTrackingCode?: string;
  isTestOrder: boolean;
  createdAt: string;
  updatedAt: string;
  timeline: {
    timestamp: string;
    status: string;
    note: string;
    actor: string;
  }[];
}

export interface PromotionalPopup {
  isEnabled: boolean;
  title: string;
  subtitle: string;
  discountCode: string;
  discountPercent: number;
  buttonText: string;
  targetUrl: string;
  imageUrl: string;
  delaySeconds: number;
  showOncePerDays: number;
}

export interface HeroSlide {
  id: string;
  title: string;
  subtitle: string;
  ctaText: string;
  ctaLink: string;
  desktopImage: string;
  mobileImage: string;
  align: 'left' | 'center' | 'right';
  isActive: boolean;
  order: number;
}

export interface SiteSettings {
  brandName: string;
  tagline: string;
  whatsappNumber: string; // e.g. "8801700000000"
  supportEmail: string;
  hotlinePhone: string;
  address: string;
  metaPixelId?: string;
  isPixelTestMode: boolean;
  courierSteadfastApiKey?: string;
  courierPathaoApiKey?: string;
  currencySymbol: string; // "৳"
  stickyHeader: boolean;
  announcementBarText?: string;
  announcementBarEnabled: boolean;
  supabaseConnected: boolean;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  action: string;
  details: string;
  user: string;
}
