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

  // Subscribe to store updates
  useEffect(() => {
    const unsubscribe = store.subscribe(() => {
      setCartItems(store.getCart());
    });
    return () => {
      unsubscribe();
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

  const handleBuyNow = (product: Product, variantId?: string, quantity: number = 1, customUnitPrice?: number) => {
    const selectedVariant = product.variants.find((v) => v.id === variantId) || product.variants[0];
    const price = customUnitPrice !== undefined ? customUnitPrice : (selectedVariant.price || product.price);
    const buyItem: CartItem = {
      productId: product.id,
      variantId: selectedVariant.id,
      name: product.name,
      slug: product.slug,
      imageUrl: product.images[0],
      size: selectedVariant.size,
      color: selectedVariant.color,
      price,
      quantity,
      maxStock: selectedVariant.stock || product.stock,
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

    // 4. Product Detail Page: /products/:slug
    if (currentPath.startsWith('/products/')) {
      const slug = currentPath.replace('/products/', '');
      return (
        <ProductDetailView
          slug={slug}
          onNavigate={navigate}
          onAddToCart={handleAddToCart}
          onBuyNow={handleBuyNow}
        />
      );
    }

    // 5. Complete products catalog: /products
    if (currentPath === '/products') {
      return (
        <CategoryView
          onNavigate={navigate}
          onSelectProduct={(slug) => navigate(`/products/${slug}`)}
          onAddToCart={handleAddToCart}
          onBuyNow={handleBuyNow}
        />
      );
    }

    // 6. Category Page: /categories/:slug
    if (currentPath.startsWith('/categories/')) {
      const slug = currentPath.replace('/categories/', '');
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

    // 7. Track Order: /track-order
    if (currentPath === '/track-order') {
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
    if (currentPath === '/legal/deposit') {
      return <LegalView policyType="deposit" onNavigate={navigate} />;
    }
    if (currentPath === '/legal/privacy' || currentPath === '/privacy-policy') {
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
