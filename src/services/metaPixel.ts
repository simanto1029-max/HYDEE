/***
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
  ct?: string;
  st?: string;
  country?: string;
};

// Event log shown in Admin > Promotional & Pixel
export type PixelEventPayload = {
  eventName: string;
  eventId: string;
  data?: Record<string, any>;
  timestamp: string;
};

const eventLog: PixelEventPayload[] = [];

function logEvent(eventName: string, data: Record<string, any>, eventId: string): void {
  eventLog.unshift({
    eventName,
    eventId,
    data,
    timestamp: new Date().toLocaleTimeString(),
  });
  if (eventLog.length > 50) eventLog.length = 50;
  try {
    window.dispatchEvent(new Event('hydee_pixel_event'));
  } catch {
    // ignore
  }
}

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

function readCookie(name: string): string | undefined {
  try {
    const m = document.cookie.match(new RegExp(`(?:^|;\\s*)${name}=([^;]+)`));
    return m ? decodeURIComponent(m[1]) : undefined;
  } catch {
    return undefined;
  }
}

// Anonymous visitor id (kept in this browser) so Meta can match the visitor's events together
function getVisitorId(): string | undefined {
  try {
    let id = localStorage.getItem('hydee_visitor_id');
    if (!id) {
      id = `v_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
      localStorage.setItem('hydee_visitor_id', id);
    }
    return id;
  } catch {
    return undefined;
  }
}

// Customer details saved when an order is placed (used to improve matching for the next events)
function getSavedCustomer(): MetaUserData {
  try {
    const raw = localStorage.getItem('hydee_pixel_customer');
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

// Everything the server (Conversions API) needs to recognise the person behind the event
function buildUserData(extra: MetaUserData): MetaUserData {
  const base: MetaUserData = {
    fbp: readCookie('_fbp'),
    fbc: readCookie('_fbc'),
    external_id: getVisitorId(),
    ...getSavedCustomer(),
    ...extra,
  };
  Object.keys(base).forEach((k) => {
    if (!(base as any)[k]) delete (base as any)[k];
  });
  return base;
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

    logEvent(eventName, customData, id);

    // Browser Pixel
    if (window.fbq) {
      window.fbq(
        'track',
        eventName,
        customData,
        { eventID: id }
      );
    }

    // Server Conversions API (with Facebook cookies, visitor id and saved customer details)
    sendCAPI(eventName, customData, buildUserData(userData), id);
  },

  // ---- Used only by the admin "Promotional & Pixel" page ----
  getRecentEvents(): PixelEventPayload[] {
    return [...eventLog];
  },

  clearLogs(): void {
    eventLog.length = 0;
  },

  getConnectionStatus() {
    const entries: any[] =
      typeof performance !== 'undefined' && performance.getEntriesByType
        ? (performance.getEntriesByType('resource') as any[])
        : [];
    const scriptEntry = entries.find((e) => String(e.name).includes('connect.facebook.net') && String(e.name).includes('fbevents'));
    const trackingRequests = entries.filter(
      (e) => /facebook\.com\/tr/.test(String(e.name))
    );
    const bootId = typeof window !== 'undefined' ? window.__hydeePixelBootId : undefined;

    return {
      snippetInPage: Boolean(bootId) || (typeof document !== 'undefined' && !!document.querySelector('script[src*="fbevents.js"]')),
      bootPixelId: bootId ? String(bootId) : '',
      scriptRequestSeen: Boolean(scriptEntry),
      scriptHttpStatus: scriptEntry && scriptEntry.responseStatus ? Number(scriptEntry.responseStatus) : 0,
      trackingRequestsSeen: trackingRequests.length,
      scriptLoaded: typeof window !== 'undefined' && Boolean(window.fbq && (window.fbq as any).callMethod),
      pixelsInitialized: (typeof window !== 'undefined' && window.__hydeeInitializedPixelIds) || [],
    };
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
    }> = [],
    customer?: { name?: string; phone?: string; district?: string; division?: string }
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

    // Customer details for Meta matching (the server hashes them before sending)
    const userData: MetaUserData = {};
    if (customer) {
      const nameParts = String(customer.name || '').trim().split(/\s+/).filter(Boolean);
      if (customer.phone) userData.ph = customer.phone;
      if (nameParts[0]) userData.fn = nameParts[0];
      if (nameParts.length > 1) userData.ln = nameParts.slice(1).join(' ');
      if (customer.district) userData.ct = customer.district;
      if (customer.division) userData.st = customer.division;
      userData.country = 'bd';
      try {
        localStorage.setItem('hydee_pixel_customer', JSON.stringify(userData));
      } catch {
        // ignore
      }
    }

    this.track(
      'Purchase',
      customData,
      userData,
      eventId
    );
  },
};
