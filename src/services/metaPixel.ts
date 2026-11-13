// Official Meta Pixel & Conversion Event Engine with deduplication & test inspector

export interface PixelEventPayload {
  eventName: 'PageView' | 'ViewContent' | 'AddToCart' | 'InitiateCheckout' | 'Purchase';
  eventId: string;
  data?: Record<string, any>;
  timestamp: string;
  isTestMode: boolean;
}

class MetaPixelService {
  private eventsLog: PixelEventPayload[] = [];
  private firedPurchases = new Set<string>(); // Order-based deduplication
  private initializedId: string | null = null;
  private pending: { eventName: string; data?: Record<string, any>; eventId: string }[] = [];

  constructor() {
    // index.html already started the Pixel (official base code): events can be sent straight away
    if (typeof window !== 'undefined' && (window as any).__hydeePixelBootId) {
      this.initializedId = String((window as any).__hydeePixelBootId);
    }
  }

  // Safe to call many times (page start, after settings arrive from Supabase, after admin saves).
  init(pixelId?: string) {
    if (typeof window === 'undefined') return;

    const id = String(pixelId || '').replace(/\D/g, '');
    if (!id) return;

    // Same Pixel as the one in index.html: nothing to start again, only send what was waiting
    if (this.initializedId === id || (window as any).__hydeePixelBootId === id) {
      this.initializedId = id;
      const waiting = this.pending.splice(0, this.pending.length);
      waiting.forEach((e) => (window as any).fbq('track', e.eventName, e.data, { eventID: e.eventId }));
      return;
    }

    if (!(window as any).fbq) {
      /* eslint-disable */
      (function(f: any, b: any, e: any, v: any, n?: any, t?: any, s?: any) {
        if (f.fbq) return;
        n = f.fbq = function() {
          n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
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
        s.parentNode.insertBefore(t, s);
      })(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');
      /* eslint-enable */

    }

    (window as any).fbq('init', id);
    this.initializedId = id;

    // Send everything that happened before the Pixel ID was known (e.g. the first PageView)
    const queued = this.pending.splice(0, this.pending.length);
    queued.forEach((e) => (window as any).fbq('track', e.eventName, e.data, { eventID: e.eventId }));
  }

  track(eventName: PixelEventPayload['eventName'], data?: Record<string, any>, customEventId?: string) {
    const eventId = customEventId || `evt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const isTestMode = Boolean(localStorage.getItem('hydee_pixel_test_mode') === 'true');

    const logEntry: PixelEventPayload = {
      eventName,
      eventId,
      data,
      timestamp: new Date().toLocaleTimeString(),
      isTestMode,
    };

    this.eventsLog.unshift(logEntry);
    if (this.eventsLog.length > 50) this.eventsLog.pop();

    // index.html already sent the PageView of the very first page load: do not count it twice
    if (eventName === 'PageView' && typeof window !== 'undefined' && (window as any).__hydeeBootPageViewSent) {
      (window as any).__hydeeBootPageViewSent = false;
      window.dispatchEvent(new CustomEvent('hydee_pixel_event', { detail: logEntry }));
      return;
    }

    // Call browser fbq if the Pixel is ready; otherwise keep the event until the Pixel ID arrives
    if (typeof window !== 'undefined' && (window as any).fbq && this.initializedId) {
      (window as any).fbq('track', eventName, data, { eventID: eventId });
    } else if (this.pending.length < 30) {
      this.pending.push({ eventName, data, eventId });
    }

    // Dispatch custom event for admin testing visualizer
    window.dispatchEvent(new CustomEvent('hydee_pixel_event', { detail: logEntry }));
  }

  // One Purchase event per order, even if the customer reloads the thank-you page or opens it again later.
  trackPurchase(
    orderNumber: string,
    totalAmount: number,
    currency: string = 'BDT',
    itemsCount: number = 1,
    items: { id: string; quantity: number; price: number }[] = []
  ) {
    const dedupKey = `purchase_${orderNumber}`;
    let alreadySent = this.firedPurchases.has(dedupKey);
    try {
      const stored: string[] = JSON.parse(localStorage.getItem('hydee_purchase_events_sent') || '[]');
      if (stored.includes(dedupKey)) alreadySent = true;
    } catch (e) {}

    if (alreadySent) {
      console.warn(`[Meta Pixel] Purchase for order ${orderNumber} was already sent, skipping duplicate.`);
      return;
    }
    this.firedPurchases.add(dedupKey);
    try {
      const stored: string[] = JSON.parse(localStorage.getItem('hydee_purchase_events_sent') || '[]');
      stored.push(dedupKey);
      localStorage.setItem('hydee_purchase_events_sent', JSON.stringify(stored.slice(-200)));
    } catch (e) {}

    this.track(
      'Purchase',
      {
        value: totalAmount,
        currency,
        num_items: itemsCount,
        content_type: 'product',
        content_ids: items.map((i) => i.id),
        contents: items.map((i) => ({ id: i.id, quantity: i.quantity, item_price: i.price })),
        order_id: orderNumber,
      },
      `purch_${orderNumber}`
    );
  }

  // Used by the admin "Check connection" button
  getConnectionStatus() {
    const w: any = typeof window !== 'undefined' ? window : {};
    const fbq = w.fbq;
    let pixelsInitialized: string[] = [];
    try {
      const state = fbq && typeof fbq.getState === 'function' ? fbq.getState() : null;
      if (state && Array.isArray(state.pixels)) pixelsInitialized = state.pixels.map((p: any) => String(p.id));
    } catch (e) {}
    // What the BROWSER really did on the network (works even when we cannot see Facebook's side)
    let scriptRequestSeen = false;
    let scriptHttpStatus: number | null = null;
    let trackingRequestsSeen = 0;
    try {
      const entries: any[] = (typeof performance !== 'undefined' && performance.getEntriesByType('resource')) || [];
      const lib = entries.find((e) => /connect\.facebook\.net\/.*fbevents\.js/.test(e.name));
      scriptRequestSeen = Boolean(lib);
      scriptHttpStatus = lib && typeof lib.responseStatus === 'number' && lib.responseStatus > 0 ? lib.responseStatus : null;
      trackingRequestsSeen = entries.filter((e) => /facebook\.com\/tr[\/?]/.test(e.name)).length;
    } catch (e) {}

    return {
      scriptRequestSeen,
      scriptHttpStatus,
      trackingRequestsSeen,
      snippetInPage: Boolean(w.__hydeePixelBootId),
      bootPixelId: w.__hydeePixelBootId ? String(w.__hydeePixelBootId) : null,
      activePixelId: this.initializedId,
      fbqExists: typeof fbq === 'function',
      // the real Facebook script replaces the small starter function: if this is false the script did not load
      scriptLoaded: Boolean(fbq && typeof fbq.callMethod === 'function'),
      pixelsInitialized,
      eventsSeenByThisPage: this.eventsLog.length,
    };
  }

  getRecentEvents(): PixelEventPayload[] {
    return [...this.eventsLog];
  }

  clearLogs() {
    this.eventsLog = [];
  }
}

export const metaPixel = new MetaPixelService();
