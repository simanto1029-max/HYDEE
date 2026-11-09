import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { BottomNavBar } from './components/BottomNavBar';
import { FloatingConcierge } from './components/FloatingConcierge';
import { CartDrawer } from './components/CartDrawer';
import { SearchModal } from './components/SearchModal';
import { PromotionalPopup } from './components/PromotionalPopup';
import { HomeView } from './views/HomeView';
import { CategoryView } from './views/CategoryView';
import { ProductDetailView } from './views/ProductDetailView';
import { CheckoutView } from './views/CheckoutView';
import { ThankYouView } from './views/ThankYouView';
import { TrackOrderView } from './views/TrackOrderView';
import { LookbookView } from './views/LookbookView';
import { CraftsmanshipView } from './views/CraftsmanshipView';
import { LegalView } from './views/LegalView';
import { AdminPortal } from './views/admin/AdminPortal';
import { store } from './services/store';
import { metaPixel } from './services/metaPixel';
import { CartItem, Product } from './types';

export default function App() {
  const [currentPath, setCurrentPath] = useState<string>(window.location.pathname || '/');
  const [cartItems, setCartItems] = useState<CartItem[]>(store.getCart());
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [directBuyItem, setDirectBuyItem] = useState<CartItem | null>(null);
  const [isInitialLoading, setIsInitialLoading] = useState<boolean>(!store.getHasInitialSyncCompleted());

  // Subscribe to store updates & initial sync completion
  useEffect(() => {
    const handleStoreChange = () => {
      setCartItems(store.getCart());
      if (store.getHasInitialSyncCompleted()) {
        setIsInitialLoading(false);
      }
    };
    const unsubscribe = store.subscribe(handleStoreChange);

    // Failsafe timeout to smoothly dismiss loader after max 1.2s
    const timeout = setTimeout(() => {
      setIsInitialLoading(false);
    }, 1200);

    return () => {
      unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  // Initialize Meta Pixel & URL listener
  useEffect(() => {
    const settings = store.getSettings();
    metaPixel.init(settings.metaPixelId);

    const handlePopState = () => {
      setCurrentPath(window.location.pathname || '/');
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Track PageView on route transition
  useEffect(() => {
    metaPixel.track('PageView', { path: currentPath });
    window.scrollTo(0, 0);
  }, [currentPath]);

  const navigate = (path: string) => {
    window.history.pushState({}, '', path);
    setCurrentPath(path);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAddToCart = (product: Product, variantId?: string, quantity: number = 1, customUnitPrice?: number) => {
    store.addToCart(product, variantId, quantity, customUnitPrice);
    setIsCartOpen(true);

    const effectivePrice = customUnitPrice !== undefined ? customUnitPrice : product.price;
    metaPixel.track('AddToCart', {
      content_name: product.name,
      content_ids: [product.id, product.sku],
      content_type: 'product',
      value: effectivePrice * quantity,
      currency: 'BDT',
    });
  };

  const handleBuyNow = (
    product: Product,
    variantId?: string,
    quantity: number = 1,
    customUnitPrice?: number,
    isFreeShipping?: boolean
  ) => {
    const selectedVariant = product.variants.find((v) => v.id === variantId) || product.variants[0];
    const price = customUnitPrice !== undefined ? customUnitPrice : (selectedVariant?.price || product.price);
    const buyItem: CartItem = {
      productId: product.id,
      variantId: selectedVariant?.id || `v-${product.id}`,
      name: product.name,
      slug: product.slug,
      imageUrl: product.images[0],
      size: selectedVariant?.size || 'Free Size',
      color: selectedVariant?.color || 'Default',
      price,
      quantity,
      maxStock: selectedVariant?.stock || product.stock,
      freeShipping: isFreeShipping,
    };
    setDirectBuyItem(buyItem);
    navigate('/checkout');
  };

  // Route Dispatcher
  const renderCurrentView = () => {
    // 1. Admin Portal
    if (currentPath.startsWith('/admin')) {
      return (
        <AdminPortal
          onNavigateHome={() => navigate('/')}
          onNavigateToProduct={(slug) => navigate(`/products/${slug}`)}
        />
      );
    }

    // 2. Thank You page
    if (currentPath.startsWith('/thank-you')) {
      const urlParams = new URLSearchParams(window.location.search);
      const orderNumber = urlParams.get('order') || '';
      return <ThankYouView orderNumber={orderNumber} onNavigate={navigate} />;
    }

    // 3. Checkout
    if (currentPath === '/checkout') {
      return (
        <CheckoutView
          items={cartItems}
          directBuyItem={directBuyItem}
          onNavigate={navigate}
          onOrderConfirmed={() => setDirectBuyItem(null)}
          onClearCart={() => store.clearCart()}
        />
      );
    }

    // 4. Product Detail Page: /products/:slug or /product/:slug
    if (currentPath.startsWith('/products/') || currentPath.startsWith('/product/')) {
      const slug = currentPath.replace(/^\/(products|product)\//, '');
      return (
        <ProductDetailView
          slug={slug}
          onNavigate={navigate}
          onAddToCart={handleAddToCart}
          onBuyNow={handleBuyNow}
        />
      );
    }

    // 5. Complete products catalog: /products, /shop, /catalog
    if (currentPath === '/products' || currentPath === '/shop' || currentPath === '/catalog') {
      return (
        <CategoryView
          onNavigate={navigate}
          onSelectProduct={(slug) => navigate(`/products/${slug}`)}
          onAddToCart={handleAddToCart}
          onBuyNow={handleBuyNow}
        />
      );
    }

    // 6. Category Page: /categories/:slug or /category/:slug
    if (currentPath.startsWith('/categories/') || currentPath.startsWith('/category/')) {
      const slug = currentPath.replace(/^\/(categories|category)\//, '');
      return (
        <CategoryView
          categorySlug={slug}
          onNavigate={navigate}
          onSelectProduct={(slug) => navigate(`/products/${slug}`)}
          onAddToCart={handleAddToCart}
          onBuyNow={handleBuyNow}
        />
      );
    }

    // 6b. All Categories: /categories, /collections
    if (currentPath === '/categories' || currentPath === '/collections') {
      return (
        <CategoryView
          onNavigate={navigate}
          onSelectProduct={(slug) => navigate(`/products/${slug}`)}
          onAddToCart={handleAddToCart}
          onBuyNow={handleBuyNow}
        />
      );
    }

    // 7. Track Order: /track-order or /track
    if (currentPath === '/track-order' || currentPath === '/track') {
      return <TrackOrderView onNavigate={navigate} />;
    }

    // 8. Capsules / Lookbook: /capsules or /lookbook
    if (currentPath === '/capsules' || currentPath === '/lookbook') {
      return <LookbookView onNavigate={navigate} />;
    }

    // 9. Craftsmanship: /craftsmanship
    if (currentPath === '/craftsmanship') {
      return <CraftsmanshipView onNavigate={navigate} />;
    }

    // 10. Legal policies
    if (currentPath === '/legal/deposit' || currentPath === '/advance-courier-policy' || currentPath === '/deposit-policy') {
      return <LegalView policyType="deposit" onNavigate={navigate} />;
    }
    if (currentPath === '/legal/privacy' || currentPath === '/privacy-policy' || currentPath === '/privacy') {
      return <LegalView policyType="privacy" onNavigate={navigate} />;
    }
    if (currentPath === '/legal/terms' || currentPath === '/terms' || currentPath === '/terms-and-conditions') {
      return <LegalView policyType="terms" onNavigate={navigate} />;
    }

    // Default: Homepage
    return (
      <HomeView
        onNavigate={navigate}
        onSelectProduct={(slug) => navigate(`/products/${slug}`)}
        onSelectCategory={(slug) => navigate(`/categories/${slug}`)}
        onAddToCart={handleAddToCart}
        onBuyNow={handleBuyNow}
      />
    );
  };

  const isAdminView = currentPath.startsWith('/admin');

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF9F7] text-neutral-900 selection:bg-[#800000] selection:text-white pb-16 md:pb-0">
      {/* Luxury Initial Sync / Refresh Overlay (prevents any visual price jumps) */}
      {isInitialLoading && !isAdminView && (
        <div className="fixed inset-0 z-100 flex flex-col items-center justify-center bg-white/95 backdrop-blur-xs transition-opacity duration-300">
          <div className="text-center space-y-4 px-6 max-w-sm">
            <img
              src="/assets/aistudio/hydee_wordmark_transparent.png"
              alt="HYDEE"
              className="h-10 sm:h-12 w-auto mx-auto object-contain"
            />
            <div className="space-y-1">
              <span className="text-[10px] uppercase tracking-widest text-[#800000] font-bold block">
                Atelier Women Collection · Tangail
              </span>
              <p className="text-xs text-neutral-500 font-medium">
                Loading bespoke collections...
              </p>
            </div>
            {/* Elegant indeterminate progress bar */}
            <div className="w-48 h-1 bg-neutral-200 rounded-full mx-auto overflow-hidden relative">
              <div className="absolute top-0 bottom-0 left-0 bg-[#800000] w-1/2 rounded-full animate-pulse" />
            </div>
          </div>
        </div>
      )}

      {/* Header only for public store views */}
      {!isAdminView && (
        <Header
          currentPath={currentPath}
          onNavigate={navigate}
          onOpenCart={() => setIsCartOpen(true)}
          onOpenSearch={() => setIsSearchOpen(true)}
          cartCount={cartItems.reduce((acc, i) => acc + i.quantity, 0)}
        />
      )}

      {/* Main Content Area */}
      <main className="flex-1">{renderCurrentView()}</main>

      {/* Footer only for public store views */}
      {!isAdminView && <Footer onNavigate={navigate} />}

      {/* Fixed Bottom Navigation Bar (Search | Shop | Home | Checkout | Track) */}
      {!isAdminView && (
        <BottomNavBar
          currentPath={currentPath}
          onNavigate={navigate}
          onOpenSearch={() => setIsSearchOpen(true)}
          cartCount={cartItems.reduce((acc, i) => acc + i.quantity, 0)}
        />
      )}

      {/* Floating VIP Stylist Concierge Widget (Hidden on checkout for clean mobile view) */}
      {!isAdminView && currentPath !== '/checkout' && <FloatingConcierge />}

      {/* Slide-over Cart Drawer */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={cartItems}
        onUpdateQuantity={(prodId, varId, qty) =>
          store.updateCartQuantity(prodId, varId, qty)
        }
        onRemoveItem={(prodId, varId) => store.removeFromCart(prodId, varId)}
        onProceedToCheckout={() => {
          setDirectBuyItem(null);
          navigate('/checkout');
        }}
      />

      {/* Luxury Search Overlay */}
      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSelectProduct={(slug) => navigate(`/products/${slug}`)}
      />

      {/* Global Promotional Popup */}
      {!isAdminView && <PromotionalPopup onNavigate={navigate} />}
    </div>
  );
}
