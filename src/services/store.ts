import {
  AuditLog,
  CartItem,
  Category,
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
  INITIAL_CATEGORIES,
  INITIAL_DELIVERY_ZONES,
  INITIAL_HERO_SLIDES,
  INITIAL_PRODUCTS,
  INITIAL_PROMO_POPUP,
  INITIAL_SITE_SETTINGS,
} from './mockData';

const STORAGE_KEYS = {
  PRODUCTS: 'hydee_products_v4',
  CATEGORIES: 'hydee_categories_v4',
  ORDERS: 'hydee_orders_v2',
  CART: 'hydee_cart_v2',
  ZONES: 'hydee_zones_v2',
  HERO: 'hydee_hero_v3',
  SETTINGS: 'hydee_settings_v2',
  PROMO: 'hydee_promo_v2',
  LOGS: 'hydee_logs_v2',
  ADMIN_AUTH: 'hydee_admin_authenticated',
};

class StoreService {
  private products: Product[] = [];
  private categories: Category[] = [];
  private orders: Order[] = [];
  private cart: CartItem[] = [];
  private zones: DeliveryZone[] = [];
  private heroSlides: HeroSlide[] = [];
  private settings: SiteSettings = INITIAL_SITE_SETTINGS;
  private promoPopup: PromotionalPopup = INITIAL_PROMO_POPUP;
  private auditLogs: AuditLog[] = [];
  private listeners: Set<() => void> = new Set();

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage() {
    try {
      const storedProds = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
      this.products = storedProds ? JSON.parse(storedProds) : INITIAL_PRODUCTS;

      const storedCats = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
      this.categories = storedCats ? JSON.parse(storedCats) : INITIAL_CATEGORIES;

      const storedOrders = localStorage.getItem(STORAGE_KEYS.ORDERS);
      this.orders = storedOrders ? JSON.parse(storedOrders) : [];

      const storedCart = localStorage.getItem(STORAGE_KEYS.CART);
      this.cart = storedCart ? JSON.parse(storedCart) : [];

      const storedZones = localStorage.getItem(STORAGE_KEYS.ZONES);
      this.zones = storedZones ? JSON.parse(storedZones) : INITIAL_DELIVERY_ZONES;

      const storedHero = localStorage.getItem(STORAGE_KEYS.HERO);
      this.heroSlides = storedHero ? JSON.parse(storedHero) : INITIAL_HERO_SLIDES;

      const storedSettings = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      this.settings = storedSettings ? { ...INITIAL_SITE_SETTINGS, ...JSON.parse(storedSettings) } : INITIAL_SITE_SETTINGS;

      const storedPromo = localStorage.getItem(STORAGE_KEYS.PROMO);
      this.promoPopup = storedPromo ? JSON.parse(storedPromo) : INITIAL_PROMO_POPUP;

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
    }
  }

  private persist() {
    try {
      localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(this.products));
      localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(this.categories));
      localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(this.orders));
      localStorage.setItem(STORAGE_KEYS.CART, JSON.stringify(this.cart));
      localStorage.setItem(STORAGE_KEYS.ZONES, JSON.stringify(this.zones));
      localStorage.setItem(STORAGE_KEYS.HERO, JSON.stringify(this.heroSlides));
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(this.settings));
      localStorage.setItem(STORAGE_KEYS.PROMO, JSON.stringify(this.promoPopup));
      localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(this.auditLogs));
    } catch (e) {
      console.error('Error persisting state:', e);
    }
    this.notify();
  }

  subscribe(listener: () => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
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

  getProductBySlug(slug: string): Product | undefined {
    return this.products.find((p) => p.slug === slug);
  }

  getHangerProducts(): Product[] {
    return this.products.filter((p) => !p.isArchived && p.isHangerFeatured);
  }

  getBestSellingProducts(): Product[] {
    return this.products.filter((p) => !p.isArchived && p.isBestSeller);
  }

  getSimilarProducts(product: Product, limit: number = 4): Product[] {
    // If manual recommendations are configured
    if (product.manualRecommendationIds && product.manualRecommendationIds.length > 0) {
      const recs = this.products.filter(
        (p) => !p.isArchived && p.id !== product.id && product.manualRecommendationIds?.includes(p.id)
      );
      if (recs.length > 0) return recs.slice(0, limit);
    }

    // Default: category match + tag match
    return this.products
      .filter((p) => !p.isArchived && p.id !== product.id && (p.categorySlug === product.categorySlug || p.tags.some((t) => product.tags.includes(t))))
      .slice(0, limit);
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
    return saved;
  }

  deleteProduct(id: string) {
    const product = this.getProductById(id);
    if (!product) return;
    this.products = this.products.filter((p) => p.id !== id);
    this.logAudit('Delete Product', `Deleted product: ${product.name} (${product.sku})`);
    this.persist();
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

  // --- Categories ---
  getCategories(): Category[] {
    return [...this.categories].sort((a, b) => a.displayOrder - b.displayOrder);
  }

  getCategoryBySlug(slug: string): Category | undefined {
    return this.categories.find((c) => c.slug === slug);
  }

  saveCategory(category: Partial<Category> & { name: string; imageUrl: string }): Category {
    if (category.id) {
      const idx = this.categories.findIndex((c) => c.id === category.id);
      if (idx === -1) throw new Error('Category not found');
      this.categories[idx] = { ...this.categories[idx], ...category };
      this.logAudit('Update Category', `Updated category: ${category.name}`);
      this.persist();
      return this.categories[idx];
    } else {
      const slug = category.slug || category.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      const newCat: Category = {
        id: `cat-${Date.now()}`,
        name: category.name,
        slug,
        description: category.description || '',
        imageUrl: category.imageUrl,
        displayOrder: this.categories.length + 1,
      };
      this.categories.push(newCat);
      this.logAudit('Create Category', `Created category: ${newCat.name}`);
      this.persist();
      return newCat;
    }
  }

  deleteCategory(id: string) {
    const cat = this.categories.find((c) => c.id === id);
    if (!cat) return;
    this.categories = this.categories.filter((c) => c.id !== id);
    this.logAudit('Delete Category', `Deleted category: ${cat.name}`);
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
    if (payload.discountCode?.toUpperCase() === 'HYDEE1000' && subtotal >= 5000) {
      discountAmount = 1000;
    } else if (payload.discountCode?.toUpperCase() === 'PRIVILEGE10') {
      discountAmount = Math.round(subtotal * 0.1);
    }

    const advanceDeliveryFee = zone.advanceFee;
    const totalAmount = Math.max(0, subtotal + advanceDeliveryFee - discountAmount);
    const remainingCodAmount = totalAmount - advanceDeliveryFee;

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
      status: 'PENDING_ADVANCE',
      paymentStatus: 'UNPAID',
      isTestOrder: Boolean(payload.isTestOrder),
      courierName: zone.name.includes('Inside') ? 'Pathao' : 'Steadfast',
      createdAt: now,
      updatedAt: now,
      timeline: [
        {
          timestamp: now,
          status: 'ORDER_INITIATED',
          note: `Order initiated. Required advance delivery payment: ৳${advanceDeliveryFee}`,
          actor: 'Customer',
        },
      ],
    };

    this.orders.unshift(newOrder);
    this.persist();
    return { success: true, order: newOrder };
  }

  // Payment Verification Callback (Only marks confirmed when verified)
  verifyAdvancePayment(
    orderNumber: string,
    method: 'bkash' | 'nagad' | 'rocket' | 'card' | 'manual_deposit',
    transactionId: string,
    verifiedBy: string = 'Payment Gateway Callback'
  ): { success: boolean; order?: Order; error?: string } {
    const order = this.getOrderByNumber(orderNumber);
    if (!order) return { success: false, error: 'Order not found.' };

    if (order.paymentStatus === 'ADVANCE_VERIFIED') {
      return { success: false, error: 'Advance payment for this order was already confirmed previously (duplicate prevented).' };
    }

    if (!transactionId.trim()) {
      return { success: false, error: 'Transaction ID / reference number is required.' };
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
    order.paymentStatus = 'ADVANCE_VERIFIED';
    order.advancePaymentMethod = method;
    order.transactionId = transactionId.trim().toUpperCase();
    order.verifiedAt = now;
    order.updatedAt = now;
    order.courierTrackingCode = `${order.courierName?.toUpperCase() || 'STDF'}-${Math.floor(100000 + Math.random() * 900000)}`;

    order.timeline.push({
      timestamp: now,
      status: 'ADVANCE_PAID_CONFIRMED',
      note: `Verified advance delivery payment of ৳${order.advanceDeliveryFee} via ${method.toUpperCase()} (TrxID: ${order.transactionId}). COD balance due on delivery: ৳${order.remainingCodAmount}`,
      actor: verifiedBy,
    });

    this.logAudit(
      'Verify Advance Payment',
      `Confirmed advance ৳${order.advanceDeliveryFee} for order ${order.orderNumber} (TrxID: ${order.transactionId})`
    );

    this.persist();
    return { success: true, order };
  }

  updateOrderStatus(orderNumber: string, newStatus: OrderStatus, note?: string, actor: string = 'Staff Admin') {
    const order = this.getOrderByNumber(orderNumber);
    if (!order) return;

    order.status = newStatus;
    order.updatedAt = new Date().toISOString();
    order.timeline.push({
      timestamp: new Date().toISOString(),
      status: newStatus,
      note: note || `Order status updated to ${newStatus}`,
      actor,
    });

    this.logAudit('Update Order Status', `Order ${order.orderNumber} changed to ${newStatus}`);
    this.persist();
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
    return { ...this.settings };
  }

  updateSettings(newSettings: Partial<SiteSettings>) {
    this.settings = { ...this.settings, ...newSettings };
    this.logAudit('Update Site Settings', 'Updated store configuration');
    this.persist();
  }

  getPromoPopup(): PromotionalPopup {
    return { ...this.promoPopup };
  }

  updatePromoPopup(popup: PromotionalPopup) {
    this.promoPopup = popup;
    this.logAudit('Update Promotional Popup', 'Updated promotional modal configuration');
    this.persist();
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
