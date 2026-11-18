
/**
 * HYDEE Meta Pixel + Conversions API
 * Supports existing App.tsx, CheckoutView.tsx and ThankYouView.tsx.
 */

declare global {
  interface Window {
    fbq?: (...args: any[]) => void;
    _fbq?: any;
    __hydeePixelBootId?: string;
    __hydeeBootPageViewSent?: boolean;
    __hydeeInitializedPixelIds?: string[];
  }
}

type MetaUserData = {
  em?: string;
  ph?: string;
  fn?: string;
  ln?: string;
  fbp?: string;
  fbc?: string;
  external_id?: string;
};

let activePixelId = '';

function createEventId(): string {
  return `hydee_${Date.now()}_${Math.random()
    .toString(36)
    .slice(2, 12)}`;
}

function loadPixel(): void {
  if (typeof window === 'undefined') return;
  if (window.fbq) return;

  const fbq: any = function (...args: any[]) {
    if (fbq.callMethod) {
      fbq.callMethod.apply(fbq, args);
    } else {
      fbq.queue.push(args);
    }
  };

  fbq.push = fbq;
  fbq.loaded = true;
  fbq.version = '2.0';
  fbq.queue = [];

  window.fbq = fbq;
  window._fbq = fbq;

  const script = document.createElement('script');
  script.async = true;
  script.src = 'https://connect.facebook.net/en_US/fbevents.js';

  document.head.appendChild(script);
}

function sendCAPI(
  eventName: string,
  customData: Record<string, any>,
  userData: MetaUserData,
  eventId: string
): void {
  if (typeof window === 'undefined') return;

  fetch('/api/meta-capi', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      eventName,
      eventSourceUrl: window.location.href,
      eventId,
      customData,
      userData,
    }),
  })
    .then(async (response) => {
      if (!response.ok) {
        const error = await response.text();
        console.error('HYDEE CAPI Error:', response.status, error);
      }
    })
    .catch((error) => {
      console.error('HYDEE CAPI Network Error:', error);
    });
}

export const metaPixel = {
  // Initialize Pixel using the ID saved in HYDEE admin settings.
  init(pixelId?: string): void {
    if (typeof window === 'undefined') return;

    const id = String(
      pixelId ||
      window.__hydeePixelBootId ||
      ''
    ).trim();

    if (!id) {
      console.warn('HYDEE: Meta Pixel ID is missing.');
      return;
    }

    activePixelId = id;

    loadPixel();

    const initialized =
      window.__hydeeInitializedPixelIds || [];

    // index.html may already have initialized this Pixel.
    if (window.__hydeePixelBootId === id) {
      window.__hydeeInitializedPixelIds = [
        ...new Set([...initialized, id]),
      ];
      return;
    }

    if (initialized.includes(id)) return;

    window.fbq?.('init', id);

    window.__hydeeInitializedPixelIds = [
      ...initialized,
      id,
    ];
  },

  // Track standard Meta events on browser and server.
  track(
    eventName: string,
    customData: Record<string, any> = {},
    userData: MetaUserData = {},
    eventId?: string
  ): void {
    if (typeof window === 'undefined') return;

    this.init(activePixelId);

    const id = eventId || createEventId();

    // Browser Pixel
    if (window.fbq) {
      window.fbq(
        'track',
        eventName,
        customData,
        { eventID: id }
      );
    }

    // Server Conversions API
    sendCAPI(eventName, customData, userData, id);
  },

  // Track a completed order.
  trackPurchase(
    orderNumber: string,
    value: number,
    currency: string = 'BDT',
    quantity: number = 1,
    items: Array<{
      id: string;
      quantity: number;
      price: number;
    }> = []
  ): void {
    if (typeof window === 'undefined' || !orderNumber) {
      return;
    }

    const storageKey = `hydee_purchase_${orderNumber}`;

    try {
      if (localStorage.getItem(storageKey)) {
        return;
      }

      // Prevent the same order from firing Purchase repeatedly.
      localStorage.setItem(storageKey, 'sent');
    } catch (error) {
      console.warn('HYDEE Purchase storage unavailable:', error);
    }

    const customData = {
      value: Number(value),
      currency,
      content_type: 'product',
      content_ids: items.map((item) => item.id),
      contents: items.map((item) => ({
        id: item.id,
        quantity: item.quantity,
        item_price: item.price,
      })),
      num_items: quantity,
      order_id: orderNumber,
    };

    // Stable event ID enables browser/server deduplication.
    const eventId = `purchase_${orderNumber}`;

    this.track(
      'Purchase',
      customData,
      {},
      eventId
    );
  },
};
