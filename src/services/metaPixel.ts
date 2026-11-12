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

  // Safe to call many times (page start, after settings arrive from Supabase, after admin saves).
  init(pixelId?: string) {
    if (typeof window === 'undefined') return;

    const id = String(pixelId || '').replace(/\D/g, '');
    if (!id || this.initializedId === id) return;

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

  getRecentEvents(): PixelEventPayload[] {
    return [...this.eventsLog];
  }

  clearLogs() {
    this.eventsLog = [];
  }
}

export const metaPixel = new MetaPixelService();
