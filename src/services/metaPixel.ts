// Meta Pixel & Conversions API (CAPI) Complete Service

declare global {
  interface Window {
    fbq?: (...args: any[]) => void;
    _fbq?: any;
  }
}

export const META_PIXEL_ID = import.meta.env.VITE_META_PIXEL_ID || '';

// Helper to send event to both Browser Pixel and Vercel CAPI Serverless Function
const sendDualEvent = async (
  eventName: string,
  customData: Record<string, any> = {},
  userData: { em?: string; ph?: string; fn?: string; ln?: string } = {}
) => {
  const eventId = `evt_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

  // 1. Browser Pixel Track
  if (typeof window !== 'undefined' && window.fbq) {
    window.fbq('track', eventName, customData, { eventID: eventId });
  }

  // 2. Server CAPI Track
  try {
    await fetch('/api/meta-capi', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        eventName,
        eventSourceUrl: typeof window !== 'undefined' ? window.location.href : '',
        userData,
        customData,
        eventId,
      }),
    });
  } catch (error) {
    console.error(`Meta CAPI error (${eventName}):`, error);
  }
};

// Initialize Meta Pixel
export const initMetaPixel = (pixelId?: string): void => {
  const activePixelId = pixelId || META_PIXEL_ID;
  if (!activePixelId || typeof window === 'undefined') return;
  if (window.fbq) return;

  (function (f: any, b: any, e: any, v: any, n?: any, t?: any, s?: any) {
    if (f.fbq) return;
    n = f.fbq = function (...args: any[]) {
      n.callMethod ? n.callMethod.apply(n, args) : n.queue.push(args);
    };
    if (!f._fbq) f._fbq = n;
    n.push = n;
    n.loaded = !0;
    n.version = '2.0';
    n.queue = [];
    t = b.createElement(e);
    t.async = !0;
    t.src = v;
    s = b.getElementsByTagName(e)[0];
    if (s && s.parentNode) {
      s.parentNode.insertBefore(t, s);
    }
  })(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');

  if (window.fbq) {
    window.fbq('init', activePixelId);
  }
};

// Standard Event Exports (Matching all existing imports across the app)
export const trackPageView = (): void => {
  sendDualEvent('PageView');
};

export const trackViewContent = (product: {
  id: string;
  name: string;
  price: number;
  category?: string;
}): void => {
  sendDualEvent('ViewContent', {
    content_ids: [product.id],
    content_name: product.name,
    content_type: 'product',
    content_category: product.category || 'Fashion',
    value: product.price,
    currency: 'BDT',
  });
};

export const trackAddToCart = (product: {
  id: string;
  name: string;
  price: number;
  quantity?: number;
}): void => {
  sendDualEvent('AddToCart', {
    content_ids: [product.id],
    content_name: product.name,
    content_type: 'product',
    value: product.price * (product.quantity || 1),
    currency: 'BDT',
  });
};

export const trackInitiateCheckout = (
  items: Array<{ id: string; quantity: number; price: number }>,
  totalValue: number
): void => {
  sendDualEvent('InitiateCheckout', {
    content_ids: items.map((i) => i.id),
    content_type: 'product',
    num_items: items.reduce((sum, i) => sum + i.quantity, 0),
    value: totalValue,
    currency: 'BDT',
  });
};

export const trackPurchase = (order: {
  orderId: string;
  items: Array<{ id: string; quantity: number; price: number }>;
  totalValue: number;
  customerEmail?: string;
  customerPhone?: string;
  customerName?: string;
}): void => {
  const nameParts = (order.customerName || '').trim().split(' ');
  const fn = nameParts[0] || '';
  const ln = nameParts.slice(1).join(' ') || '';

  sendDualEvent(
    'Purchase',
    {
      content_ids: order.items.map((i) => i.id),
      content_type: 'product',
      num_items: order.items.reduce((sum, i) => sum + i.quantity, 0),
      value: order.totalValue,
      currency: 'BDT',
      order_id: order.orderId,
    },
    {
      em: order.customerEmail,
      ph: order.customerPhone,
      fn,
      ln,
    }
  );
};

export const trackMetaEvent = sendDualEvent;
