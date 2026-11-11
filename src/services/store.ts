import {
  AuditLog,
  CartItem,
  Category,
  Coupon,
  DeliveryZone,
  HeroSlide,
  Order,
  OrderStatus,
  PaymentStatus,
  Product,
  PromotionalPopup,
  SiteSettings,
} from '../types';
import {
  ALL_DEMO_CATEGORIES,
  ALL_DEMO_PRODUCTS,
  INITIAL_CATEGORIES,
  INITIAL_DELIVERY_ZONES,
  INITIAL_HERO_SLIDES,
  INITIAL_PRODUCTS,
  INITIAL_PROMO_POPUP,
  INITIAL_SITE_SETTINGS,
} from './mockData';
import { supabase, isSupabaseConfigured } from './supabase';
import {
  saveAllProductsIDB,
  getAllProductsIDB,
  deleteSingleProductIDB,
} from './db';

export const INITIAL_COUPONS: Coupon[] = [
  {
    id: 'coup-1',
    code: 'HYDEE1000',
    discountType: 'flat',
    discountValue: 1000,
    minOrderAmount: 5000,
    isActive: true,
    usageCount: 14,
    description: 'Flat ৳1,000 off on orders of ৳5,000 or more',
  },
  {
    id: 'coup-2',
    code: 'PRIVILEGE10',
    discountType: 'percentage',
    discountValue: 10,
    minOrderAmount: 0,
    maxDiscountAmount: 3000,
    isActive: true,
    usageCount: 28,
    description: '10% privilege discount for atelier clientele',
  },
  {
    id: 'coup-3',
    code: 'WELCOME500',
    discountType: 'flat',
    discountValue: 500,
    minOrderAmount: 2000,
    isActive: true,
    usageCount: 42,
    description: '৳500 instant welcome savings on orders over ৳2,000',
  },
  {
    id: 'coup-4',
    code: 'HYDEE5',
    discountType: 'percentage',
    discountValue: 5,
    minOrderAmount: 0,
    isActive: true,
    usageCount: 9,
    description: '5% instant discount on all silhouettes',
  },
];

const STORAGE_KEYS = {
  PRODUCTS: 'hydee_products_v6',
  DELETED_PRODUCTS: 'hydee_deleted_product_ids_v2',
  CATEGORIES: 'hydee_categories_v6',
  DELETED_CATEGORIES: 'hydee_deleted_category_ids_v2',
  ORDERS: 'hydee_orders_v2',
  CART: 'hydee_cart_v2',
  ZONES: 'hydee_zones_v2',
  HERO: 'hydee_hero_v5',
  SETTINGS: 'hydee_settings_v2',
  PROMO: 'hydee_promo_v2',
  COUPONS: 'hydee_coupons_v2',
  LOGS: 'hydee_logs_v2',
  ADMIN_AUTH: 'hydee_admin_authenticated',
};

class StoreService {
  private products: Product[] = [];
  private deletedProductIds: Set<string> = new Set();
  private categories: Category[] = [];
  private deletedCategoryIds: Set<string> = new Set();
  private orders: Order[] = [];
  private cart: CartItem[] = [];
  private coupons: Coupon[] = [];
  private zones: DeliveryZone[] = [];
  private heroSlides: HeroSlide[] = [];
  private settings: SiteSettings = INITIAL_SITE_SETTINGS;
  private promoPopup: PromotionalPopup = INITIAL_PROMO_POPUP;
  private auditLogs: AuditLog[] = [];
  private listeners: Set<() => void> = new Set();
  public isSyncing: boolean = false;
  public hasInitialSyncCompleted: boolean = false;

  constructor() {
    this.loadFromStorage();
    this.loadFromIndexedDB();
    if (isSupabaseConfigured && supabase) {
      this.syncFromSupabase();
    } else {
      this.hasInitialSyncCompleted = true;
    }
  }

  public getIsSyncing(): boolean {
    return this.isSyncing;
  }

  public getHasInitialSyncCompleted(): boolean {
    return this.hasInitialSyncCompleted;
  }

  public normalizeProductPrices(p: Product): Product {
    const prodPrice = Number(p.price) || 1799;
    const compareAt = p.compareAtPrice ? Number(p.compareAtPrice) : undefined;

    // Normalize variants to have the exact same price as product
    const normalizedVariants = (p.variants || []).map((v) => ({
      ...v,
      price: prodPrice,
      compareAtPrice: compareAt,
    }));

    // Normalize bundle tiers
    let tiers = p.bundleTiers && Array.isArray(p.bundleTiers) && p.bundleTiers.length > 0 ? [...p.bundleTiers] : [];
    if (tiers.length === 0) {
      tiers = [
        { quantity: 1, label: 'Buy 1', subtitle: 'Standard Edition', price: prodPrice, freeShipping: false },
        { quantity: 2, label: 'Buy 2', subtitle: 'Save 10% Extra', badge: 'Most Popular', price: Math.round(prodPrice * 2 * 0.9), freeShipping: false },
        { quantity: 3, label: 'Buy 3', subtitle: 'Save 20% Extra + Free Delivery', price: Math.round(prodPrice * 3 * 0.8), freeShipping: true },
      ];
    } else {
      tiers[0] = { ...tiers[0], price: prodPrice };
      if (!tiers[1]?.price || tiers[1].price > prodPrice * 3 || tiers[1].price < prodPrice) {
        tiers[1] = {
          ...tiers[1],
          label: tiers[1]?.label || 'Buy 2',
          price: Math.round(prodPrice * 2 * 0.9),
        };
      }
      if (!tiers[2]?.price || tiers[2].price > prodPrice * 4 || tiers[2].price < prodPrice) {
        tiers[2] = {
          ...tiers[2],
          label: tiers[2]?.label || 'Buy 3',
          price: Math.round(prodPrice * 3 * 0.8),
          freeShipping: true,
        };
      }
    }

    return {
      ...p,
      price: prodPrice,
      compareAtPrice: compareAt,
      variants: normalizedVariants.length > 0 ? normalizedVariants : [
        { id: `v-${p.id}-std`, name: 'Free Size', size: 'Free Size', color: 'Signature', sku: `${p.sku}-STD`, price: prodPrice, compareAtPrice: compareAt, stock: p.stock ?? 10 }
      ],
      bundleTiers: tiers,
    };
  }

  private async loadFromIndexedDB() {
    try {
      const idbProducts = await getAllProductsIDB();
      if (Array.isArray(idbProducts) && idbProducts.length > 0) {
        const valid = idbProducts
          .filter((p) => !this.deletedProductIds.has(p.id))
          .map((p) => this.normalizeProductPrices(p));

        if (valid.length > 0) {
          const map = new Map<string, Product>();
          this.products.forEach((p) => map.set(p.id, p));
          valid.forEach((p) => map.set(p.id, p));
          const merged = Array.from(map.values());

          // If user has real custom products, drop demo placeholder prod-tp-glory
          if (merged.some((p) => p.id !== 'prod-tp-glory')) {
            this.products = merged.filter((p) => p.id !== 'prod-tp-glory' || !this.deletedProductIds.has('prod-tp-glory'));
          } else {
            this.products = merged;
          }
          this.notify();
        }
      }
    } catch (e) {
      console.warn('Error loading from IndexedDB:', e);
    }
  }

  private loadFromStorage() {
    try {
      const storedDeleted = localStorage.getItem(STORAGE_KEYS.DELETED_PRODUCTS);
      if (storedDeleted) {
        try {
          const arr = JSON.parse(storedDeleted);
          if (Array.isArray(arr)) {
            this.deletedProductIds = new Set(arr);
          }
        } catch (e) {}
      }

      const storedDeletedCats = localStorage.getItem(STORAGE_KEYS.DELETED_CATEGORIES);
      if (storedDeletedCats) {
        try {
          const arr = JSON.parse(storedDeletedCats);
          if (Array.isArray(arr)) {
            this.deletedCategoryIds = new Set(arr);
          }
        } catch (e) {}
      }

      const storedProds = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
      const rawProds: Product[] = storedProds ? JSON.parse(storedProds) : [];
      const filtered = rawProds
        .filter((p) => !this.deletedProductIds.has(p.id))
        .map((p) => this.normalizeProductPrices(p));

      // If user has created custom pieces, do not pollute with initial mock product
      if (filtered.some((p) => p.id !== 'prod-tp-glory')) {
        this.products = filtered.filter((p) => p.id !== 'prod-tp-glory' || !this.deletedProductIds.has('prod-tp-glory'));
      } else {
        this.products = filtered;
      }

      const storedCats = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
      const rawCats: Category[] = storedCats ? JSON.parse(storedCats) : INITIAL_CATEGORIES;
      this.categories = rawCats.filter((c) => !this.deletedCategoryIds.has(c.id) && !this.deletedCategoryIds.has(c.slug));

      const storedOrders = localStorage.getItem(STORAGE_KEYS.ORDERS);
      this.orders = storedOrders ? JSON.parse(storedOrders) : [];
      if (this.orders && Array.isArray(this.orders)) {
        this.orders.forEach((o) => {
          if (o.status !== 'SHIPPED' && o.status !== 'DELIVERED') {
            delete o.courierTrackingCode;
          }
          if (o.status === 'DELIVERED') {
            o.paymentStatus = 'COD_COLLECTED';
          }
        });
      }

      const storedCart = localStorage.getItem(STORAGE_KEYS.CART);
      this.cart = storedCart ? JSON.parse(storedCart) : [];

      const storedZones = localStorage.getItem(STORAGE_KEYS.ZONES);
      this.zones = storedZones ? JSON.parse(storedZones) : INITIAL_DELIVERY_ZONES;

      const storedHero = localStorage.getItem(STORAGE_KEYS.HERO);
      this.heroSlides = storedHero ? JSON.parse(storedHero) : INITIAL_HERO_SLIDES;

      const storedSettings = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      this.settings = storedSettings ? { ...INITIAL_SITE_SETTINGS, ...JSON.parse(storedSettings) } : INITIAL_SITE_SETTINGS;
      if (!this.settings.adminEmail || this.settings.adminEmail === 'admin@hydee.com') {
        this.settings.adminEmail = 'simanto1029@gmail.com';
        this.settings.adminPassword = 'soumik1029';
      }
      if (
        !this.settings.supportEmail ||
        this.settings.supportEmail.includes('@hydee.com') ||
        this.settings.supportEmail === 'concierge@hydee.com' ||
        this.settings.supportEmail === 'support@hydee.com'
      ) {
        this.settings.supportEmail = 'support@hydee.shop';
      }
      if (this.settings.tangailLocation === 'Main Atelier, Tangail, Dhaka Division, Bangladesh') {
        this.settings.tangailLocation = 'Tangail, Dhaka Division, Bangladesh';
        this.settings.address = 'Tangail, Dhaka Division, Bangladesh';
      }
      // Official WhatsApp & Wallet Numbers
      if (!this.settings.whatsappNumber || this.settings.whatsappNumber.includes('1711') || this.settings.whatsappNumber.includes('0000')) {
        this.settings.whatsappNumber = '8801601705804';
      }
      this.settings.bkashNumber = this.settings.bkashNumber || '01601705804';
      this.settings.nagadNumber = this.settings.nagadNumber || '01601705804';
      this.settings.hotlinePhone = '01601-705804';
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(this.settings));

      const storedPromo = localStorage.getItem(STORAGE_KEYS.PROMO);
      this.promoPopup = storedPromo ? JSON.parse(storedPromo) : INITIAL_PROMO_POPUP;

      const storedCoupons = localStorage.getItem(STORAGE_KEYS.COUPONS);
      this.coupons = storedCoupons ? JSON.parse(storedCoupons) : INITIAL_COUPONS;

      const storedLogs = localStorage.getItem(STORAGE_KEYS.LOGS);
      this.auditLogs = storedLogs ? JSON.parse(storedLogs) : [];
    } catch (e) {
      console.error('Error loading data from storage:', e);
      this.products = INITIAL_PRODUCTS;
      this.categories = INITIAL_CATEGORIES;
      this.zones = INITIAL_DELIVERY_ZONES;
      this.heroSlides = INITIAL_HERO_SLIDES;
      this.settings = INITIAL_SITE_SETTINGS;
      this.promoPopup = INITIAL_PROMO_POPUP;
      this.coupons = INITIAL_COUPONS;
    }
  }

  private persist() {
    // 1. Always persist full uncompressed products into IndexedDB (no 5MB limit!)
    saveAllProductsIDB(this.products).catch(() => {});

    // 2. Try saving to localStorage with graceful fallback
    try {
      localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(this.products));
    } catch (e: any) {
      console.warn('localStorage quota warning, caching compact version:', e);
      try {
        localStorage.removeItem(STORAGE_KEYS.LOGS);
        localStorage.removeItem(STORAGE_KEYS.COUPONS);
        const compact = this.products.map((p) => ({
          ...p,
          images: p.images.slice(0, 2),
        }));
        localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(compact));
      } catch (err2) {
        console.warn('localStorage full, relying on IndexedDB & Supabase');
      }
    }

    try {
      localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(this.categories));
      localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(this.orders));
      localStorage.setItem(STORAGE_KEYS.CART, JSON.stringify(this.cart));
      localStorage.setItem(STORAGE_KEYS.COUPONS, JSON.stringify(this.coupons));
      localStorage.setItem(STORAGE_KEYS.ZONES, JSON.stringify(this.zones));
      localStorage.setItem(STORAGE_KEYS.HERO, JSON.stringify(this.heroSlides));
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(this.settings));
      localStorage.setItem(STORAGE_KEYS.PROMO, JSON.stringify(this.promoPopup));
      localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(this.auditLogs));
    } catch (e) {}
    this.notify();
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  async syncFromSupabase() {
    if (!isSupabaseConfigured || !supabase) {
      this.hasInitialSyncCompleted = true;
      return;
    }
    this.isSyncing = true;
    this.notify();
    try {
      // 1. Fetch Categories
      const { data: catData, error: catError } = await supabase
        .from('categories')
        .select('*')
        .order('display_order', { ascending: true });

      if (!catError && catData && catData.length > 0) {
        this.categories = catData.map((c: any) => ({
          id: c.id,
          name: c.name,
          slug: c.slug,
          description: c.description || '',
          imageUrl: c.image_url || '/images/editorial-glory-red.jpg',
          displayOrder: c.display_order || 1,
        }));
      }

      // 2. Fetch Products (in small batches so heavy rows never hit the Supabase timeout)
      const { data: idRows, error: idError } = await supabase
        .from('products')
        .select('id, is_archived, created_at')
        .order('created_at', { ascending: false });

      if (idError) {
        console.error('Supabase products id fetch error:', idError.message, idError.details);
      }

      if (!idError && idRows) {
        const activeIds = idRows
          .filter((r: any) => r.is_archived !== true)
          .map((r: any) => r.id as string);

        const loaded: Product[] = [];
        const BATCH_SIZE = 2;
        let anyBatchFailed = false;

        for (let i = 0; i < activeIds.length; i += BATCH_SIZE) {
          const batchIds = activeIds.slice(i, i + BATCH_SIZE);
          const { data: rows, error: batchError } = await supabase
            .from('products')
            .select('*')
            .in('id', batchIds);

          if (batchError) {
            anyBatchFailed = true;
            console.error('Supabase products batch error:', batchError.message, batchError.details);
            continue;
          }

          (rows || []).forEach((p: any) => {
            loaded.push(this.normalizeProductPrices(this.mapSupabaseProduct(p)));
          });

          // Show what we have so far right away (progressive loading)
          this.products = [...loaded];
          this.notify();
        }

        if (activeIds.length === 0 || !anyBatchFailed) {
          this.products = loaded;
        }

        saveAllProductsIDB(this.products).catch(() => {});
        try {
          localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(this.products));
        } catch (e) {}
      }

      // 3. Fetch Orders
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (!orderError && orderData && orderData.length > 0) {
        this.orders = orderData.map((o: any) => ({
          id: o.id,
          orderNumber: o.order_number,
          customerName: o.customer_name,
          customerPhone: o.customer_phone,
          customerEmail: o.customer_email,
          deliveryAddress: o.delivery_address,
          district: o.district,
          zoneId: o.zone_id,
          zoneName: o.zone_name,
          notes: o.notes,
          subtotal: Number(o.subtotal),
          advanceDeliveryFee: Number(o.advance_delivery_fee),
          discountAmount: Number(o.discount_amount || 0),
          discountCode: o.discount_code,
          totalAmount: Number(o.total_amount),
          remainingCodAmount: Number(o.remaining_cod_amount),
          status: o.status,
          paymentStatus: o.payment_status,
          advancePaymentMethod: o.advance_payment_method,
          transactionId: o.transaction_id,
          verifiedAt: o.verified_at,
          courierName: o.courier_name,
          courierTrackingCode: o.courier_tracking_code,
          isTestOrder: Boolean(o.is_test_order),
          createdAt: o.created_at,
          updatedAt: o.updated_at,
          timeline: Array.isArray(o.timeline) ? o.timeline : [],
          items: Array.isArray(o.items) ? o.items : [],
        }));
      }

      // 4. Fetch Site Settings
      try {
        const { data: settingsData, error: settingsError } = await supabase
          .from('site_settings')
          .select('*')
          .eq('id', 'global')
          .maybeSingle();

        if (!settingsError && settingsData && settingsData.data) {
          this.settings = { ...this.settings, ...settingsData.data };
        }
      } catch (err) {}

      this.persist();
    } catch (err) {
      console.warn('Supabase initial sync notice:', err);
    } finally {
      this.isSyncing = false;
      this.hasInitialSyncCompleted = true;
      this.notify();
    }
  }

  private notify() {
    this.listeners.forEach((l) => l());
  }

  logAudit(action: string, details: string, user: string = 'HYDEE Admin') {
    const entry: AuditLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      timestamp: new Date().toISOString(),
      action,
      details,
      user,
    };
    this.auditLogs.unshift(entry);
    if (this.auditLogs.length > 200) this.auditLogs.pop();
    this.persist();
  }

  getAuditLogs(): AuditLog[] {
    return [...this.auditLogs];
  }

  // --- Products ---
  getProducts(): Product[] {
    return [...this.products];
  }

  getPublishedProducts(): Product[] {
    return this.products.filter((p) => !p.isArchived);
  }

  getProductById(id: string): Product | undefined {
    return this.products.find((p) => p.id === id);
  }

  public mapSupabaseProduct(p: any): Product {
    const existing = this.products.find((ep) => ep.id === p.id || ep.slug === p.slug);
    const variantsList = Array.isArray(p.variants) && p.variants.length > 0 ? p.variants : (existing?.variants || []);
    const realSizes = Array.from(
      new Set(variantsList.map((v: any) => v.size).filter((s: any) => s && s !== 'Free Size' && s !== 'Standard'))
    );
    const hasSizes = p.has_sizes !== undefined ? Boolean(p.has_sizes) : (existing?.hasSizes ?? (realSizes.length > 0));

    let colors = p.color_options && Array.isArray(p.color_options) && p.color_options.length > 0
      ? p.color_options
      : (existing?.colorOptions && existing.colorOptions.length > 0 ? existing.colorOptions : null);

    if (!colors || colors.length === 0) {
      const uniqueColNames = Array.from(new Set(variantsList.map((v: any) => v.color).filter(Boolean)));
      if (uniqueColNames.length > 0) {
        colors = uniqueColNames.map((cName: any) => {
          const match = variantsList.find((v: any) => v.color === cName);
          return {
            name: String(cName),
            imageUrl: match?.colorImage || p.images?.[0] || '',
            colorHex: match?.colorHex || '#800000',
          };
        });
      }
    }

    // Preserve bundle tiers & free delivery options
    let resolvedBundleTiers = p.bundle_tiers && Array.isArray(p.bundle_tiers) && p.bundle_tiers.length > 0
      ? p.bundle_tiers
      : (existing?.bundleTiers && existing.bundleTiers.length > 0 ? existing.bundleTiers : null);

    if (!resolvedBundleTiers || resolvedBundleTiers.length === 0) {
      resolvedBundleTiers = [
        { quantity: 1, label: 'Buy 1', subtitle: 'Standard Edition', price: Number(p.price), freeShipping: false },
        { quantity: 2, label: 'Buy 2', subtitle: 'Save 10% Extra', badge: 'Most Popular', price: Math.round(Number(p.price) * 2 * 0.9), freeShipping: false },
        { quantity: 3, label: 'Buy 3', subtitle: 'Save 20% Extra + Free Delivery', price: Math.round(Number(p.price) * 3 * 0.8), freeShipping: true },
      ];
    }

    const resolvedHeadline = p.bundle_headline || existing?.bundleHeadline || '50% OFF TODAY ONLY';

    return {
      id: p.id,
      name: p.name,
      slug: p.slug,
      sku: p.sku || `HYD-${p.id}`,
      categorySlug: p.category_slug || 'three-piece',
      categoryName: p.category_name || 'Three Piece',
      price: Number(p.price),
      compareAtPrice: p.compare_at_price ? Number(p.compare_at_price) : undefined,
      costPrice: p.cost_price ? Number(p.cost_price) : undefined,
      stock: p.stock ?? 10,
      description: p.description || '',
      shortDescription: p.short_description || '',
      specifications: {
        fabric: p.fabric || '',
        fit: p.fit || '',
        care: p.care || '',
        origin: p.origin || '',
        craftsmanshipNotes: p.craftsmanship_notes || '',
      },
      images: Array.isArray(p.images) && p.images.length > 0 ? p.images : ['/images/editorial-glory-red.jpg'],
      variants: variantsList,
      hasSizes,
      customSizes: p.custom_sizes || existing?.customSizes || (hasSizes ? realSizes : []),
      colorOptions: colors || [],
      bundleTiers: resolvedBundleTiers,
      bundleHeadline: resolvedHeadline,
      tags: Array.isArray(p.tags) ? p.tags : [],
      isBestSeller: Boolean(p.is_best_seller),
      isFeatured: Boolean(p.is_featured),
      isHangerFeatured: Boolean(p.is_hanger_featured),
      isArchived: Boolean(p.is_archived),
      createdAt: p.created_at || new Date().toISOString(),
      updatedAt: p.updated_at || new Date().toISOString(),
    };
  }

  getProductBySlug(slug: string): Product | undefined {
    if (!slug) return undefined;
    const clean = decodeURIComponent(slug).split('?')[0].split('#')[0].trim().replace(/\/+$/, '').toLowerCase();
    
    // 1. Exact slug match
    let match = this.products.find((p) => (p.slug || '').trim().toLowerCase() === clean);
    if (match) return match;

    // 2. Exact ID or SKU match
    match = this.products.find((p) => (p.id || '').trim().toLowerCase() === clean || (p.sku || '').trim().toLowerCase() === clean);
    if (match) return match;

    // 3. Hyphen-normalized match
    const cleanNormalized = clean.replace(/[^a-z0-9]/g, '');
    match = this.products.find((p) => (p.slug || '').toLowerCase().replace(/[^a-z0-9]/g, '') === cleanNormalized);
    if (match) return match;

    // 4. Substring partial match
    return this.products.find((p) => {
      const pSlug = (p.slug || '').trim().toLowerCase();
      return pSlug.includes(clean) || clean.includes(pSlug);
    });
  }

  async fetchProductBySlug(slug: string): Promise<Product | undefined> {
    const local = this.getProductBySlug(slug);
    if (local) return local;

    // Fast check from IndexedDB
    try {
      const idbList = await getAllProductsIDB();
      if (Array.isArray(idbList)) {
        const clean = decodeURIComponent(slug).split('?')[0].split('#')[0].trim().replace(/\/+$/, '').toLowerCase();
        const idbMatch = idbList.find(
          (p: any) =>
            (p.slug || '').toLowerCase() === clean ||
            (p.id || '').toLowerCase() === clean ||
            (p.sku || '').toLowerCase() === clean
        );
        if (idbMatch) {
          const norm = this.normalizeProductPrices(idbMatch);
          const existingIdx = this.products.findIndex((p) => p.id === norm.id || p.slug === norm.slug);
          if (existingIdx >= 0) {
            this.products[existingIdx] = norm;
          } else {
            this.products.unshift(norm);
          }
          this.notify();
          return norm;
        }
      }
    } catch (e) {}

    if (isSupabaseConfigured && supabase) {
      const clean = decodeURIComponent(slug).split('?')[0].split('#')[0].trim().replace(/\/+$/, '');
      try {
        const queryPromise = supabase
          .from('products')
          .select('*')
          .or(`slug.eq.${clean},id.eq.${clean},sku.eq.${clean}`)
          .maybeSingle();

        const timeoutPromise = new Promise<{ data: null; error: null }>((resolve) =>
          setTimeout(() => resolve({ data: null, error: null }), 15000)
        );

        const { data, error } = (await Promise.race([queryPromise, timeoutPromise])) as any;

        if (!error && data) {
          const mapped = this.normalizeProductPrices(this.mapSupabaseProduct(data));
          const idx = this.products.findIndex((p) => p.id === mapped.id || p.slug === mapped.slug);
          if (idx >= 0) {
            this.products[idx] = mapped;
          } else {
            this.products.unshift(mapped);
          }
          this.persist();
          return mapped;
        }
      } catch (e) {
        console.warn('Fast timeout or error fetching product by slug:', e);
      }
    }
    return undefined;
  }

  getHangerProducts(): Product[] {
    return this.products.filter((p) => !p.isArchived && p.isHangerFeatured);
  }

  getBestSellingProducts(): Product[] {
    return this.products.filter((p) => !p.isArchived && p.isBestSeller);
  }

  getSimilarProducts(product: Product, limit: number = 4): Product[] {
    // 1. If manual recommendations are configured and exist in store
    if (product.manualRecommendationIds && product.manualRecommendationIds.length > 0) {
      const recs = this.products.filter(
        (p) => !p.isArchived && p.id !== product.id && product.manualRecommendationIds?.includes(p.id)
      );
      if (recs.length > 0) return recs.slice(0, limit);
    }

    // 2. Strictly find other products in the SAME catalog/category that actually exist in the admin products
    const sameCatalogMatches = this.products.filter(
      (p) =>
        !p.isArchived &&
        p.id !== product.id &&
        (p.categorySlug === product.categorySlug || p.categoryName === product.categoryName)
    );

    // Return other pieces only if they exist in this catalog; otherwise empty array (do NOT show unrelated or demo products)
    return sameCatalogMatches.slice(0, limit);
  }

  generateUniqueSlug(name: string, excludeId?: string): string {
    const baseSlug = name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    let slug = baseSlug || 'product';
    let counter = 1;
    while (this.products.some((p) => p.slug === slug && p.id !== excludeId)) {
      counter++;
      slug = `${baseSlug}-${counter}`;
    }
    return slug;
  }

  saveProduct(product: Partial<Product> & { name: string; price: number }): Product {
    const now = new Date().toISOString();
    let saved: Product;

    if (product.id) {
      const index = this.products.findIndex((p) => p.id === product.id);
      if (index === -1) throw new Error('Product not found');

      const existing = this.products[index];
      const newSlug = product.slug ? this.generateUniqueSlug(product.slug, existing.id) : existing.slug;

      saved = {
        ...existing,
        ...product,
        slug: newSlug,
        updatedAt: now,
      } as Product;

      this.products[index] = saved;
      this.logAudit('Update Product', `Updated product: ${saved.name} (${saved.sku})`);
    } else {
      const id = `prod-${Date.now()}`;
      const slug = product.slug ? this.generateUniqueSlug(product.slug) : this.generateUniqueSlug(product.name);
      const sku = product.sku || `HYD-${Date.now().toString().slice(-4)}`;

      saved = {
        id,
        name: product.name,
        slug,
        sku,
        categorySlug: product.categorySlug || 'shackets',
        categoryName: product.categoryName || 'Shackets',
        price: product.price,
        compareAtPrice: product.compareAtPrice,
        costPrice: product.costPrice || Math.round(product.price * 0.45),
        stock: product.stock ?? 10,
        description: product.description || '',
        shortDescription: product.shortDescription || '',
        specifications: product.specifications || {
          fabric: 'Premium Blend',
          fit: 'Bespoke Tailoring',
          care: 'Specialist Dry Clean Only',
          origin: 'Handcrafted in Bangladesh',
        },
        images: product.images && product.images.length > 0 ? product.images : ['https://images.unsplash.com/photo-1548883354-7622d03aca27?auto=format&fit=crop&w=1200&q=85'],
        transparentImage: product.transparentImage || product.images?.[0],
        has360View: product.has360View ?? false,
        frames360: product.frames360 || [],
        variants: product.variants || [
          { id: `v-${id}-std`, name: 'Free Size', size: 'Free Size', color: 'Signature', sku: `${sku}-STD`, price: product.price, stock: product.stock ?? 10 },
        ],
        tags: product.tags || ['luxury'],
        isBestSeller: product.isBestSeller ?? false,
        isFeatured: product.isFeatured ?? true,
        isHangerFeatured: product.isHangerFeatured ?? true,
        isArchived: false,
        createdAt: now,
        updatedAt: now,
      };

      this.products.unshift(saved);
      this.logAudit('Create Product', `Created new product: ${saved.name} (${saved.sku})`);
    }

    this.persist();

    if (isSupabaseConfigured && supabase) {
      supabase.from('products').upsert({
        id: saved.id,
        name: saved.name,
        slug: saved.slug,
        sku: saved.sku,
        category_slug: saved.categorySlug,
        category_name: saved.categoryName,
        price: saved.price,
        compare_at_price: saved.compareAtPrice,
        cost_price: saved.costPrice,
        stock: saved.stock,
        description: saved.description,
        short_description: saved.shortDescription,
        fabric: saved.specifications?.fabric || '',
        fit: saved.specifications?.fit || '',
        care: saved.specifications?.care || '',
        origin: saved.specifications?.origin || '',
        craftsmanship_notes: saved.specifications?.craftsmanshipNotes || '',
        images: saved.images,
        variants: saved.variants,
        tags: saved.tags,
        is_best_seller: saved.isBestSeller,
        is_featured: saved.isFeatured,
        is_hanger_featured: saved.isHangerFeatured,
        is_archived: saved.isArchived,
      }).then(({ error }) => {
        if (error) {
          console.error('Supabase product sync error:', error.message, error.details);
        }
      });
    }

    return saved;
  }

  deleteProduct(id: string) {
    this.deletedProductIds.add(id);
    deleteSingleProductIDB(id).catch(() => {});
    try {
      localStorage.setItem(STORAGE_KEYS.DELETED_PRODUCTS, JSON.stringify(Array.from(this.deletedProductIds)));
    } catch (e) {
      console.error('Error saving deleted products set:', e);
    }

    const product = this.getProductById(id);
    this.products = this.products.filter((p) => p.id !== id);
    this.cart = this.cart.filter((c) => c.productId !== id);
    if (product) {
      this.logAudit('Delete Product', `Permanently deleted product: ${product.name} (${product.sku})`);
    }
    this.persist();

    if (isSupabaseConfigured && supabase) {
      supabase.from('products').delete().eq('id', id).then(() => {});
    }
  }

  duplicateProduct(id: string): Product | null {
    const original = this.getProductById(id);
    if (!original) return null;

    const copyName = `${original.name} (Copy)`;
    const copySlug = this.generateUniqueSlug(copyName);
    const copySku = `${original.sku}-CP`;

    const duplicated: Product = {
      ...original,
      id: `prod-${Date.now()}`,
      name: copyName,
      slug: copySlug,
      sku: copySku,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      variants: original.variants.map((v) => ({
        ...v,
        id: `v-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        sku: `${v.sku}-CP`,
      })),
    };

    this.products.unshift(duplicated);
    this.logAudit('Duplicate Product', `Duplicated ${original.name} as ${duplicated.name}`);
    this.persist();
    return duplicated;
  }

  restoreDemoProducts() {
    this.products = [...ALL_DEMO_PRODUCTS];
    this.deletedProductIds.clear();
    try {
      localStorage.removeItem(STORAGE_KEYS.DELETED_PRODUCTS);
    } catch (e) {
      console.error('Error clearing deleted products:', e);
    }
    this.logAudit('Restore Catalog', 'Restored 15 luxury atelier demo pieces');
    this.persist();
  }

  // --- Categories ---
  getCategories(): Category[] {
    return [...this.categories].sort((a, b) => a.displayOrder - b.displayOrder);
  }

  getCategoryBySlug(slug: string): Category | undefined {
    return this.categories.find((c) => c.slug === slug);
  }

  getProductsByCategorySlug(slug: string): Product[] {
    return this.products.filter((p) => p.categorySlug === slug && !p.isArchived);
  }

  saveCategory(category: Partial<Category> & { name: string; imageUrl?: string }): Category {
    if (category.id) {
      const idx = this.categories.findIndex((c) => c.id === category.id);
      if (idx === -1) throw new Error('Category not found');
      const oldSlug = this.categories[idx].slug;
      const newSlug = category.slug || oldSlug;
      
      this.categories[idx] = { 
        ...this.categories[idx], 
        ...category,
        slug: newSlug,
      };

      // If category name or slug changed, keep linked products in sync
      if (oldSlug !== newSlug || category.name) {
        this.products.forEach((p) => {
          if (p.categorySlug === oldSlug) {
            p.categorySlug = newSlug;
            if (category.name) p.categoryName = category.name;
          }
        });
      }

      this.logAudit('Update Category', `Updated category: ${category.name || this.categories[idx].name}`);
      this.persist();

      if (isSupabaseConfigured && supabase) {
        const cat = this.categories[idx];
        supabase.from('categories').upsert({
          id: cat.id,
          name: cat.name,
          slug: cat.slug,
          description: cat.description || '',
          image_url: cat.imageUrl || '',
          display_order: cat.displayOrder || 1,
        }).then(() => {});
      }

      return this.categories[idx];
    } else {
      const baseSlug = (category.slug || category.name).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      let slug = baseSlug || 'category';
      let count = 1;
      while (this.categories.some((c) => c.slug === slug)) {
        count++;
        slug = `${baseSlug}-${count}`;
      }

      const newCat: Category = {
        id: `cat-${Date.now()}`,
        name: category.name,
        slug,
        description: category.description || '',
        imageUrl: category.imageUrl || 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80',
        displayOrder: category.displayOrder || this.categories.length + 1,
      };
      this.categories.push(newCat);
      this.logAudit('Create Category', `Created category: ${newCat.name}`);
      this.persist();

      if (isSupabaseConfigured && supabase) {
        supabase.from('categories').upsert({
          id: newCat.id,
          name: newCat.name,
          slug: newCat.slug,
          description: newCat.description || '',
          image_url: newCat.imageUrl || '',
          display_order: newCat.displayOrder || 1,
        }).then(() => {});
      }

      return newCat;
    }
  }

  deleteCategory(id: string, reassignToCategorySlug?: string) {
    const cat = this.categories.find((c) => c.id === id);
    if (!cat) return;

    this.deletedCategoryIds.add(id);
    if (cat.slug) this.deletedCategoryIds.add(cat.slug);
    try {
      localStorage.setItem(STORAGE_KEYS.DELETED_CATEGORIES, JSON.stringify(Array.from(this.deletedCategoryIds)));
    } catch (e) {}

    // Handle products in this category
    const remainingCats = this.categories.filter((c) => c.id !== id);
    const fallbackCat = remainingCats.find((c) => c.slug === reassignToCategorySlug) || remainingCats[0];

    if (fallbackCat) {
      this.products.forEach((p) => {
        if (p.categorySlug === cat.slug) {
          p.categorySlug = fallbackCat.slug;
          p.categoryName = fallbackCat.name;
        }
      });
    }

    this.categories = remainingCats;
    this.logAudit('Delete Category', `Deleted category: ${cat.name}`);
    this.persist();

    if (isSupabaseConfigured && supabase) {
      supabase.from('categories').delete().or(`id.eq.${id},slug.eq.${cat.slug}`).then(() => {});
    }
  }

  restoreDemoCategories() {
    this.categories = [...ALL_DEMO_CATEGORIES];
    this.deletedCategoryIds.clear();
    try {
      localStorage.removeItem(STORAGE_KEYS.DELETED_CATEGORIES);
    } catch (e) {}
    this.logAudit('Restore Categories', 'Restored 5 luxury atelier demo categories');
    this.persist();
  }

  assignProductToCategory(productId: string, newCategorySlug: string) {
    const prod = this.getProductById(productId);
    if (!prod) return;
    const cat = this.getCategoryBySlug(newCategorySlug);
    if (!cat) return;

    prod.categorySlug = cat.slug;
    prod.categoryName = cat.name;
    prod.updatedAt = new Date().toISOString();
    this.logAudit('Update Category', `Assigned product "${prod.name}" to category "${cat.name}"`);
    this.persist();
  }

  verifyAdminCredentials(emailInput: string, passwordInput: string): boolean {
    const configuredEmail = (this.settings.adminEmail || 'simanto1029@gmail.com').trim().toLowerCase();
    const configuredPass = (this.settings.adminPassword || 'soumik1029').trim();
    
    const inputEmail = emailInput.trim().toLowerCase();
    const inputPass = passwordInput.trim();

    return (
      (inputEmail === 'simanto1029@gmail.com' && inputPass === 'soumik1029') ||
      (inputEmail === configuredEmail && inputPass === configuredPass) ||
      (inputPass === configuredPass && (!inputEmail || inputEmail === configuredEmail || inputEmail === 'simanto1029@gmail.com'))
    );
  }

  updateAdminCredentials(newEmail?: string, newPassword?: string) {
    if (newEmail && newEmail.trim()) {
      this.settings.adminEmail = newEmail.trim().toLowerCase();
    }
    if (newPassword && newPassword.trim()) {
      this.settings.adminPassword = newPassword.trim();
    }
    this.logAudit('Security', 'Admin login credentials updated');
    this.persist();
  }

  // --- Delivery Zones ---
  getDeliveryZones(): DeliveryZone[] {
    return [...this.zones];
  }

  getDeliveryZoneById(id: string): DeliveryZone | undefined {
    return this.zones.find((z) => z.id === id);
  }

  saveDeliveryZone(zone: DeliveryZone) {
    const index = this.zones.findIndex((z) => z.id === zone.id);
    if (index >= 0) {
      this.zones[index] = zone;
    } else {
      this.zones.push(zone);
    }
    this.logAudit('Delivery Settings', `Updated delivery zone: ${zone.name} fee to ৳${zone.advanceFee}`);
    this.persist();
  }

  // --- Cart ---
  getCart(): CartItem[] {
    return [...this.cart];
  }

  addToCart(product: Product, variantId?: string, quantity: number = 1, customUnitPrice?: number) {
    const selectedVariant = product.variants.find((v) => v.id === variantId) || product.variants[0];
    const existingIndex = this.cart.findIndex(
      (item) => item.productId === product.id && item.variantId === selectedVariant.id
    );

    const price = customUnitPrice !== undefined ? customUnitPrice : (selectedVariant.price || product.price);

    if (existingIndex >= 0) {
      const item = this.cart[existingIndex];
      const newQty = Math.min(item.quantity + quantity, selectedVariant.stock || product.stock);
      this.cart[existingIndex].quantity = newQty;
      if (customUnitPrice !== undefined) {
        this.cart[existingIndex].price = customUnitPrice;
      }
    } else {
      this.cart.push({
        productId: product.id,
        variantId: selectedVariant.id,
        name: product.name,
        slug: product.slug,
        imageUrl: product.images[0],
        size: selectedVariant.size,
        color: selectedVariant.color,
        price,
        quantity: Math.min(quantity, selectedVariant.stock || product.stock),
        maxStock: selectedVariant.stock || product.stock,
      });
    }

    this.persist();
  }

  updateCartQuantity(productId: string, variantId: string, quantity: number) {
    if (quantity <= 0) {
      this.removeFromCart(productId, variantId);
      return;
    }
    const item = this.cart.find((i) => i.productId === productId && i.variantId === variantId);
    if (item) {
      item.quantity = Math.min(quantity, item.maxStock);
      this.persist();
    }
  }

  removeFromCart(productId: string, variantId: string) {
    this.cart = this.cart.filter((i) => !(i.productId === productId && i.variantId === variantId));
    this.persist();
  }

  clearCart() {
    this.cart = [];
    this.persist();
  }

  getCartSubtotal(): number {
    return this.cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }

  // --- Orders & Advance Payment Validation ---
  getOrders(): Order[] {
    return [...this.orders];
  }

  getOrderById(id: string): Order | undefined {
    return this.orders.find((o) => o.id === id);
  }

  getOrderByNumber(orderNumber: string): Order | undefined {
    return this.orders.find((o) => o.orderNumber.trim().toUpperCase() === orderNumber.trim().toUpperCase());
  }

  // Server-like order validation & creation
  createOrder(payload: {
    customerName: string;
    customerPhone: string;
    customerEmail?: string;
    deliveryAddress: string;
    district: string;
    zoneId: string;
    notes?: string;
    items: CartItem[];
    discountCode?: string;
    isTestOrder?: boolean;
    paymentType?: 'advance_cod' | 'full_prepaid';
  }): { success: boolean; order?: Order; error?: string } {
    // 1. Validate inputs
    if (!payload.customerName.trim()) return { success: false, error: 'Full name is required.' };
    
    // Bangladesh mobile number verification: starts with 01 and 11 digits
    const cleanedPhone = payload.customerPhone.replace(/[^0-9]/g, '');
    if (cleanedPhone.length < 11 || (!cleanedPhone.startsWith('01') && !cleanedPhone.startsWith('8801'))) {
      return { success: false, error: 'Please enter a valid 11-digit Bangladesh mobile number (e.g. 017XXXXXXXX).' };
    }

    if (!payload.deliveryAddress.trim()) return { success: false, error: 'Complete delivery address is required.' };
    if (!payload.district.trim()) return { success: false, error: 'District is required.' };

    const zone = this.getDeliveryZoneById(payload.zoneId) || this.zones[0];
    if (payload.items.length === 0) return { success: false, error: 'Cart is empty.' };

    // 2. Server re-validation of inventory & prices
    let subtotal = 0;
    const validatedOrderItems = [];

    for (const item of payload.items) {
      const product = this.getProductById(item.productId);
      if (!product || product.isArchived) {
        return { success: false, error: `Product "${item.name}" is no longer available.` };
      }
      const variant = product.variants.find((v) => v.id === item.variantId) || product.variants[0];
      const availableStock = variant.stock ?? product.stock;

      if (availableStock < item.quantity && !payload.isTestOrder) {
        return { success: false, error: `Insufficient stock for "${product.name}" (${variant.name}). Only ${availableStock} left.` };
      }

      const verifiedPrice = variant.price || product.price;
      subtotal += verifiedPrice * item.quantity;

      validatedOrderItems.push({
        productId: product.id,
        productName: product.name,
        variantId: variant.id,
        variantName: `${variant.size} / ${variant.color}`,
        price: verifiedPrice,
        quantity: item.quantity,
        imageUrl: product.images[0],
      });
    }

    // 3. Discount calculation
    let discountAmount = 0;
    let verifiedDiscountCode: string | undefined = undefined;
    if (payload.discountCode && payload.discountCode.trim()) {
      const couponCheck = this.validateCoupon(payload.discountCode.trim(), subtotal);
      if (couponCheck.valid && couponCheck.coupon) {
        discountAmount = couponCheck.discountAmount;
        verifiedDiscountCode = couponCheck.coupon.code;
        couponCheck.coupon.usageCount = (couponCheck.coupon.usageCount || 0) + 1;
      }
    }

    const advanceDeliveryFee = zone.advanceFee;
    const totalAmount = Math.max(0, subtotal + advanceDeliveryFee - discountAmount);
    const isFullPayment = payload.paymentType === 'full_prepaid';
    const remainingCodAmount = isFullPayment ? 0 : totalAmount;

    // For Cash on Delivery, order is confirmed immediately with full amount due on delivery
    const initialStatus: OrderStatus = isFullPayment ? 'PENDING_ADVANCE' : 'CONFIRMED';
    const initialPaymentStatus: PaymentStatus = 'UNPAID';

    // Deduct stock immediately for COD orders (since they don't go through TrxID verification modal)
    if (!isFullPayment && !payload.isTestOrder) {
      for (const item of validatedOrderItems) {
        const prod = this.getProductById(item.productId);
        if (prod) {
          const vIdx = prod.variants.findIndex((v) => v.id === item.variantId);
          if (vIdx >= 0) {
            prod.variants[vIdx].stock = Math.max(0, (prod.variants[vIdx].stock || 0) - item.quantity);
          }
          prod.stock = Math.max(0, (prod.stock || 0) - item.quantity);
        }
      }
    }

    const orderNumber = `HYD-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const now = new Date().toISOString();

    const newOrder: Order = {
      id: `ord-${Date.now()}`,
      orderNumber,
      customerName: payload.customerName.trim(),
      customerPhone: cleanedPhone,
      customerEmail: payload.customerEmail?.trim(),
      deliveryAddress: payload.deliveryAddress.trim(),
      district: payload.district.trim(),
      zoneId: zone.id,
      zoneName: zone.name,
      notes: payload.notes?.trim(),
      items: validatedOrderItems,
      subtotal,
      advanceDeliveryFee,
      discountAmount,
      discountCode: payload.discountCode,
      totalAmount,
      remainingCodAmount,
      paymentType: payload.paymentType || 'advance_cod',
      isFullPayment,
      status: initialStatus,
      paymentStatus: initialPaymentStatus,
      isTestOrder: Boolean(payload.isTestOrder),
      courierName: zone.name.includes('Inside') ? 'Pathao' : 'Steadfast',
      createdAt: now,
      updatedAt: now,
      timeline: [
        {
          timestamp: now,
          status: isFullPayment ? 'ORDER_INITIATED' : 'CONFIRMED',
          note: isFullPayment
            ? `100% Full Prepayment order initiated. Amount due: ৳${totalAmount.toLocaleString()}`
            : `Cash on Delivery order placed successfully. Total payable in cash upon delivery: ৳${totalAmount.toLocaleString()}`,
          actor: 'Customer',
        },
      ],
    };

    this.orders.unshift(newOrder);
    this.persist();

    if (isSupabaseConfigured && supabase) {
      supabase.from('orders').insert({
        id: newOrder.id,
        order_number: newOrder.orderNumber,
        customer_name: newOrder.customerName,
        customer_phone: newOrder.customerPhone,
        customer_email: newOrder.customerEmail,
        delivery_address: newOrder.deliveryAddress,
        district: newOrder.district,
        zone_id: newOrder.zoneId,
        zone_name: newOrder.zoneName,
        notes: newOrder.notes,
        subtotal: newOrder.subtotal,
        advance_delivery_fee: newOrder.advanceDeliveryFee,
        discount_amount: newOrder.discountAmount,
        discount_code: newOrder.discountCode,
        total_amount: newOrder.totalAmount,
        remaining_cod_amount: newOrder.remainingCodAmount,
        status: newOrder.status,
        payment_status: newOrder.paymentStatus,
        advance_payment_method: newOrder.advancePaymentMethod,
        transaction_id: newOrder.transactionId,
        verified_at: newOrder.verifiedAt,
        courier_name: newOrder.courierName,
        courier_tracking_code: newOrder.courierTrackingCode,
        is_test_order: newOrder.isTestOrder,
        timeline: newOrder.timeline,
        items: newOrder.items,
        created_at: newOrder.createdAt,
        updated_at: newOrder.updatedAt,
      }).then(() => {});
    }

    return { success: true, order: newOrder };
  }

  // Payment Verification Callback (Only marks confirmed when verified)
  verifyAdvancePayment(
    orderNumberOrId: string,
    method: 'bkash' | 'nagad' | 'rocket' | 'card' | 'manual_deposit',
    transactionId: string,
    verifiedBy: string = 'Payment Gateway Callback'
  ): { success: boolean; order?: Order; error?: string } {
    const cleanQuery = orderNumberOrId ? orderNumberOrId.trim().toUpperCase() : '';
    const order = this.orders.find(
      (o) =>
        o.id === orderNumberOrId ||
        (cleanQuery && o.orderNumber.trim().toUpperCase() === cleanQuery)
    );
    if (!order) return { success: false, error: 'Order not found.' };

    if (order.paymentStatus === 'ADVANCE_VERIFIED' || order.paymentStatus === 'FULLY_PAID') {
      return { success: false, error: 'Payment for this order was already confirmed previously (duplicate prevented).' };
    }

    if (!transactionId.trim()) {
      return { success: false, error: 'Transaction ID / reference number is required.' };
    }

    // The same TrxID must never confirm two different orders
    const trxUpper = transactionId.trim().toUpperCase();
    const trxUsedElsewhere = this.orders.find(
      (o) =>
        o.id !== order.id &&
        !o.isTestOrder &&
        (o.transactionId || '').trim().toUpperCase() === trxUpper &&
        (o.paymentStatus === 'FULLY_PAID' || o.paymentStatus === 'ADVANCE_VERIFIED')
    );
    if (trxUsedElsewhere) {
      return { success: false, error: `This Transaction ID was already used to confirm order ${trxUsedElsewhere.orderNumber}.` };
    }

    // Deduct stock for non-test orders
    if (!order.isTestOrder) {
      for (const item of order.items) {
        const product = this.getProductById(item.productId);
        if (product) {
          const vIdx = product.variants.findIndex((v) => v.id === item.variantId);
          if (vIdx >= 0) {
            product.variants[vIdx].stock = Math.max(0, (product.variants[vIdx].stock || 0) - item.quantity);
          }
          product.stock = Math.max(0, (product.stock || 0) - item.quantity);
        }
      }
    }

    const now = new Date().toISOString();
    order.status = 'CONFIRMED';
    const isFull = Boolean(order.isFullPayment || order.paymentType === 'full_prepaid');
    order.paymentStatus = isFull ? 'FULLY_PAID' : 'ADVANCE_VERIFIED';
    if (isFull) {
      order.remainingCodAmount = 0;
    }
    order.advancePaymentMethod = method;
    order.transactionId = transactionId.trim().toUpperCase();
    order.verifiedAt = now;
    order.updatedAt = now;

    order.timeline.push({
      timestamp: now,
      status: isFull ? 'FULL_PAYMENT_CONFIRMED' : 'ADVANCE_PAID_CONFIRMED',
      note: isFull
        ? `Verified 100% full order prepayment of ৳${order.totalAmount.toLocaleString()} via ${method.toUpperCase()} (TrxID: ${order.transactionId}). No cash on delivery due (৳0).`
        : `Verified advance delivery payment of ৳${order.advanceDeliveryFee} via ${method.toUpperCase()} (TrxID: ${order.transactionId}). COD balance due on delivery: ৳${order.remainingCodAmount.toLocaleString()}`,
      actor: verifiedBy,
    });

    this.logAudit(
      'Verify Advance Payment',
      isFull
        ? `Confirmed full payment ৳${order.totalAmount.toLocaleString()} for order ${order.orderNumber} (TrxID: ${order.transactionId})`
        : `Confirmed advance ৳${order.advanceDeliveryFee} for order ${order.orderNumber} (TrxID: ${order.transactionId})`
    );

    this.persist();
    return { success: true, order };
  }

  // Customer typed a TrxID in the payment popup. This does NOT confirm the order:
  // it only records the reference so the admin can check it in the bKash / Nagad app.
  submitPaymentReference(
    orderNumber: string,
    method: 'bkash' | 'nagad' | 'rocket' | 'card' | 'manual_deposit',
    transactionId: string
  ): { success: boolean; order?: Order; error?: string } {
    const order = this.orders.find((o) => o.orderNumber.trim().toUpperCase() === (orderNumber || '').trim().toUpperCase());
    if (!order) return { success: false, error: 'Order not found.' };

    if (order.paymentStatus === 'FULLY_PAID' || order.paymentStatus === 'ADVANCE_VERIFIED') {
      return { success: false, error: 'This order is already paid.' };
    }

    const trx = (transactionId || '').trim().toUpperCase();
    if (!/^[A-Z0-9]{8,14}$/.test(trx) || /^(.)\1+$/.test(trx)) {
      return {
        success: false,
        error: 'Invalid Transaction ID. Please copy the TrxID exactly from the bKash/Nagad SMS (8-14 letters and numbers, no spaces or dashes).'
      };
    }

    const usedElsewhere = this.orders.find(
      (o) => o.id !== order.id && !o.isTestOrder && (o.transactionId || '').trim().toUpperCase() === trx
    );
    if (usedElsewhere) {
      return { success: false, error: 'This Transaction ID has already been used for another order. Please check the TrxID in your SMS.' };
    }

    const now = new Date().toISOString();
    order.transactionId = trx;
    order.advancePaymentMethod = method;
    order.paymentStatus = 'MANUAL_REVIEW';
    order.status = 'PENDING_ADVANCE';
    order.updatedAt = now;
    order.timeline.push({
      timestamp: now,
      status: 'PAYMENT_SUBMITTED',
      note: `Customer submitted ${method.toUpperCase()} TrxID ${trx} for ৳${order.totalAmount.toLocaleString()}. Waiting for admin to verify in the ${method} app.`,
      actor: 'Customer',
    });
    this.logAudit('Payment Reference Submitted', `Order ${order.orderNumber}: ${method.toUpperCase()} TrxID ${trx}`);
    this.persist();
    return { success: true, order };
  }

  // Admin checked the app and the money did NOT arrive / TrxID is wrong
  rejectSubmittedPayment(orderNumber: string, actor: string = 'Admin Staff'): { success: boolean; error?: string } {
    const order = this.getOrderByNumber(orderNumber);
    if (!order) return { success: false, error: 'Order not found.' };
    if (order.paymentStatus === 'FULLY_PAID' || order.paymentStatus === 'ADVANCE_VERIFIED') {
      return { success: false, error: 'This payment is already confirmed.' };
    }
    const now = new Date().toISOString();
    const oldTrx = order.transactionId;
    order.transactionId = undefined;
    order.advancePaymentMethod = undefined;
    order.paymentStatus = 'UNPAID';
    order.status = 'PENDING_ADVANCE';
    order.updatedAt = now;
    order.timeline.push({
      timestamp: now,
      status: 'PAYMENT_REJECTED',
      note: `Payment reference ${oldTrx || ''} was rejected: money not received. Order moved back to Incomplete Leads.`,
      actor,
    });
    this.logAudit('Payment Rejected', `Order ${order.orderNumber}: TrxID ${oldTrx || ''} rejected`);
    this.persist();
    return { success: true };
  }

  // Customer abandoned prepayment but agrees to Cash on Delivery -> becomes a real confirmed COD order
  convertLeadToCod(orderNumber: string, actor: string = 'Admin Staff'): { success: boolean; order?: Order; error?: string } {
    const order = this.getOrderByNumber(orderNumber);
    if (!order) return { success: false, error: 'Order not found.' };
    if (order.status !== 'PENDING_ADVANCE') return { success: false, error: 'Only incomplete leads can be converted.' };
    if (order.paymentStatus === 'FULLY_PAID' || order.paymentStatus === 'ADVANCE_VERIFIED') {
      return { success: false, error: 'This order is already paid.' };
    }

    // Stock must still be available
    if (!order.isTestOrder) {
      for (const item of order.items) {
        const product = this.getProductById(item.productId);
        const variant = product?.variants.find((v) => v.id === item.variantId);
        const available = variant ? variant.stock ?? product!.stock : product?.stock ?? 0;
        if (!product || available < item.quantity) {
          return { success: false, error: `"${item.productName}" does not have enough stock any more.` };
        }
      }
      for (const item of order.items) {
        const product = this.getProductById(item.productId);
        if (!product) continue;
        const vIdx = product.variants.findIndex((v) => v.id === item.variantId);
        if (vIdx >= 0) {
          product.variants[vIdx].stock = Math.max(0, (product.variants[vIdx].stock || 0) - item.quantity);
        }
        product.stock = Math.max(0, (product.stock || 0) - item.quantity);
      }
    }

    const now = new Date().toISOString();
    order.paymentType = 'advance_cod';
    order.isFullPayment = false;
    order.remainingCodAmount = order.totalAmount;
    order.transactionId = undefined;
    order.advancePaymentMethod = undefined;
    order.paymentStatus = 'UNPAID';
    order.status = 'CONFIRMED';
    order.updatedAt = now;
    order.timeline.push({
      timestamp: now,
      status: 'CONVERTED_TO_COD',
      note: `Lead converted to Cash on Delivery. ৳${order.totalAmount.toLocaleString()} will be collected on delivery.`,
      actor,
    });
    this.logAudit('Lead Converted To COD', `Order ${order.orderNumber} confirmed as Cash on Delivery`);
    this.persist();
    return { success: true, order };
  }

  updateOrderStatus(
    orderNumber: string,
    newStatus: OrderStatus,
    note?: string,
    actor: string = 'Staff Admin',
    courierData?: { courierName?: string; courierTrackingCode?: string }
  ) {
    const order = this.getOrderByNumber(orderNumber);
    if (!order) return;

    const now = new Date().toISOString();
    order.status = newStatus;
    order.updatedAt = now;

    if (courierData) {
      if (courierData.courierName) order.courierName = courierData.courierName;
      if (courierData.courierTrackingCode) {
        order.courierTrackingCode = courierData.courierTrackingCode.trim().toUpperCase();
        order.dispatchedAt = now;
      }
    }

    if (newStatus === 'SHIPPED') {
      if (!order.dispatchedAt) order.dispatchedAt = now;
    } else if (newStatus === 'DELIVERED') {
      order.deliveredAt = now;
      order.paymentStatus = 'COD_COLLECTED';
    } else if (newStatus === 'CONFIRMED' || newStatus === 'PROCESSING') {
      if (order.paymentStatus === 'COD_COLLECTED') {
        order.paymentStatus = 'ADVANCE_VERIFIED';
      }
    }

    order.timeline.push({
      timestamp: now,
      status: newStatus,
      note:
        note ||
        `Order status updated to ${newStatus}${
          order.courierTrackingCode ? ` (Consignment ID: ${order.courierTrackingCode})` : ''
        }`,
      actor,
    });

    this.logAudit('Update Order Status', `Order ${order.orderNumber} changed to ${newStatus}`);
    this.persist();
  }

  dispatchOrder(
    orderNumber: string,
    courierName: string,
    trackingCode: string,
    note?: string
  ): boolean {
    const order = this.getOrderByNumber(orderNumber);
    if (!order) return false;

    const now = new Date().toISOString();
    order.status = 'SHIPPED';
    order.courierName = courierName;
    order.courierTrackingCode = trackingCode.trim().toUpperCase();
    order.dispatchedAt = now;
    order.updatedAt = now;

    order.timeline.push({
      timestamp: now,
      status: 'SHIPPED',
      note: note || `Handed over to ${courierName}. Consignment Tracking ID: ${order.courierTrackingCode}`,
      actor: 'Staff Admin',
    });

    this.logAudit('Dispatch Order', `Order ${order.orderNumber} dispatched via ${courierName} (${order.courierTrackingCode})`);
    this.persist();
    return true;
  }

  markOrderDelivered(orderNumber: string, note?: string): boolean {
    const order = this.getOrderByNumber(orderNumber);
    if (!order) return false;

    const now = new Date().toISOString();
    order.status = 'DELIVERED';
    order.paymentStatus = 'COD_COLLECTED';
    order.deliveredAt = now;
    order.updatedAt = now;

    order.timeline.push({
      timestamp: now,
      status: 'DELIVERED',
      note: note || `Parcel delivered to recipient doorstep. Cash on Delivery ৳${order.remainingCodAmount} collected in full.`,
      actor: 'Courier & Staff Admin',
    });

    this.logAudit('Order Delivered', `Order ${order.orderNumber} marked delivered. COD ৳${order.remainingCodAmount} collected.`);
    this.persist();
    return true;
  }

  deleteOrder(orderIdOrNumber: string): boolean {
    const clean = orderIdOrNumber ? orderIdOrNumber.trim().toUpperCase() : '';
    const order = this.orders.find(
      (o) => o.id === orderIdOrNumber || o.orderNumber.trim().toUpperCase() === clean
    );
    if (!order) return false;

    this.orders = this.orders.filter(
      (o) => o.id !== order.id && o.orderNumber.trim().toUpperCase() !== clean
    );
    this.logAudit('Delete Order', `Order ${order.orderNumber} (${order.customerName}) deleted permanently by admin`);
    this.persist();

    if (isSupabaseConfigured && supabase) {
      supabase.from('orders').delete().or(`id.eq.${order.id},order_number.eq.${clean}`).then(() => {});
    }

    return true;
  }

  // --- Hero Slides & Homepage ---
  getHeroSlides(): HeroSlide[] {
    return [...this.heroSlides].sort((a, b) => a.order - b.order);
  }

  saveHeroSlides(slides: HeroSlide[]) {
    this.heroSlides = slides;
    this.logAudit('Update Hero Slider', 'Updated homepage hero slides');
    this.persist();
  }

  // --- Site Settings & Marketing ---
  getSettings(): SiteSettings {
    const s = { ...this.settings };
    if (!s.supportEmail || s.supportEmail.includes('@hydee.com') || s.supportEmail === 'concierge@hydee.com') {
      s.supportEmail = 'support@hydee.shop';
    }
    return s;
  }

  updateSettings(newSettings: Partial<SiteSettings>) {
    this.settings = { ...this.settings, ...newSettings };
    if (!this.settings.supportEmail || this.settings.supportEmail.includes('@hydee.com')) {
      this.settings.supportEmail = 'support@hydee.shop';
    }
    this.logAudit('Update Site Settings', 'Updated store configuration');
    this.persist();

    if (isSupabaseConfigured && supabase) {
      supabase
        .from('site_settings')
        .upsert({
          id: 'global',
          data: this.settings,
          updated_at: new Date().toISOString(),
        })
        .then(() => {}, () => {});
    }
  }

  getPromoPopup(): PromotionalPopup {
    return { ...this.promoPopup };
  }

  updatePromoPopup(popup: PromotionalPopup) {
    this.promoPopup = popup;
    this.logAudit('Update Promotional Popup', 'Updated promotional modal configuration');
    this.persist();
  }

  // --- Coupon Codes & Campaigns ---
  getCoupons(): Coupon[] {
    return [...this.coupons];
  }

  getCouponById(id: string): Coupon | undefined {
    return this.coupons.find((c) => c.id === id);
  }

  saveCoupon(couponData: Partial<Coupon> & { code: string; discountValue: number }): Coupon {
    const cleanCode = couponData.code.trim().toUpperCase();
    if (!cleanCode) throw new Error('Coupon code is required.');

    const existingIndex = couponData.id
      ? this.coupons.findIndex((c) => c.id === couponData.id)
      : this.coupons.findIndex((c) => c.code.toUpperCase() === cleanCode);

    let saved: Coupon;
    if (existingIndex >= 0) {
      saved = {
        ...this.coupons[existingIndex],
        ...couponData,
        code: cleanCode,
      };
      this.coupons[existingIndex] = saved;
      this.logAudit('Update Coupon', `Updated coupon code: ${cleanCode}`);
    } else {
      saved = {
        id: `coup-${Date.now()}`,
        code: cleanCode,
        discountType: couponData.discountType || 'flat',
        discountValue: Number(couponData.discountValue) || 0,
        minOrderAmount: Number(couponData.minOrderAmount) || 0,
        maxDiscountAmount: couponData.maxDiscountAmount ? Number(couponData.maxDiscountAmount) : undefined,
        isActive: couponData.isActive !== false,
        usageCount: 0,
        description: couponData.description?.trim(),
      };
      this.coupons.unshift(saved);
      this.logAudit('Create Coupon', `Created coupon code: ${cleanCode}`);
    }

    this.persist();
    return saved;
  }

  deleteCoupon(id: string): boolean {
    const prevLen = this.coupons.length;
    this.coupons = this.coupons.filter((c) => c.id !== id);
    if (this.coupons.length !== prevLen) {
      this.logAudit('Delete Coupon', `Deleted coupon ${id}`);
      this.persist();
      return true;
    }
    return false;
  }

  toggleCouponStatus(id: string): boolean {
    const coupon = this.coupons.find((c) => c.id === id);
    if (coupon) {
      coupon.isActive = !coupon.isActive;
      this.logAudit('Toggle Coupon', `Coupon ${coupon.code} set to ${coupon.isActive ? 'Active' : 'Inactive'}`);
      this.persist();
      return true;
    }
    return false;
  }

  validateCoupon(
    code: string,
    subtotal: number
  ): { valid: boolean; discountAmount: number; coupon?: Coupon; error?: string } {
    if (!code || !code.trim()) {
      return { valid: false, discountAmount: 0, error: 'Please enter a coupon code.' };
    }
    const cleanCode = code.trim().toUpperCase();
    const coupon = this.coupons.find((c) => c.code.toUpperCase() === cleanCode);
    if (!coupon) {
      return { valid: false, discountAmount: 0, error: `Coupon "${cleanCode}" is invalid or expired.` };
    }
    if (!coupon.isActive) {
      return { valid: false, discountAmount: 0, error: `Coupon "${cleanCode}" is currently inactive.` };
    }
    if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) {
      return { valid: false, discountAmount: 0, error: `Coupon "${cleanCode}" has expired.` };
    }
    if (coupon.minOrderAmount > 0 && subtotal < coupon.minOrderAmount) {
      return {
        valid: false,
        discountAmount: 0,
        error: `Coupon "${cleanCode}" requires a minimum order of ৳${coupon.minOrderAmount.toLocaleString()}. (Current order: ৳${subtotal.toLocaleString()})`,
      };
    }

    let discountAmount = 0;
    if (coupon.discountType === 'percentage') {
      discountAmount = Math.round((subtotal * coupon.discountValue) / 100);
      if (coupon.maxDiscountAmount && coupon.maxDiscountAmount > 0) {
        discountAmount = Math.min(discountAmount, coupon.maxDiscountAmount);
      }
    } else {
      discountAmount = Math.min(coupon.discountValue, subtotal);
    }

    return { valid: true, discountAmount, coupon };
  }

  // Reset database to initial pristine state
  resetToDefault() {
    this.products = INITIAL_PRODUCTS;
    this.categories = INITIAL_CATEGORIES;
    this.orders = [];
    this.cart = [];
    this.zones = INITIAL_DELIVERY_ZONES;
    this.heroSlides = INITIAL_HERO_SLIDES;
    this.settings = INITIAL_SITE_SETTINGS;
    this.promoPopup = INITIAL_PROMO_POPUP;
    this.auditLogs = [];
    this.persist();
    this.logAudit('System Reset', 'Reset catalogue and orders to initial factory state');
  }

  exportDatabaseJson(): string {
    return JSON.stringify(
      {
        products: this.products,
        categories: this.categories,
        orders: this.orders,
        zones: this.zones,
        heroSlides: this.heroSlides,
        settings: this.settings,
        promoPopup: this.promoPopup,
        exportedAt: new Date().toISOString(),
      },
      null,
      2
    );
  }

  importDatabaseJson(jsonString: string): boolean {
    try {
      const data = JSON.parse(jsonString);
      if (data.products) this.products = data.products;
      if (data.categories) this.categories = data.categories;
      if (data.orders) this.orders = data.orders;
      if (data.zones) this.zones = data.zones;
      if (data.heroSlides) this.heroSlides = data.heroSlides;
      if (data.settings) this.settings = data.settings;
      if (data.promoPopup) this.promoPopup = data.promoPopup;
      this.persist();
      this.logAudit('Database Import', 'Imported data from external backup JSON');
      return true;
    } catch (e) {
      console.error('Import error:', e);
      return false;
    }
  }

  // Admin authentication state
  isAdminLoggedIn(): boolean {
    return localStorage.getItem(STORAGE_KEYS.ADMIN_AUTH) === 'true';
  }

  setAdminLoggedIn(val: boolean) {
    if (val) {
      localStorage.setItem(STORAGE_KEYS.ADMIN_AUTH, 'true');
      this.logAudit('Admin Login', 'Administrator signed into studio portal');
    } else {
      localStorage.removeItem(STORAGE_KEYS.ADMIN_AUTH);
      this.logAudit('Admin Logout', 'Administrator signed out');
    }
    this.notify();
  }
}

export const store = new StoreService();
