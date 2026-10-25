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

  init(pixelId?: string) {
    if (typeof window === 'undefined') return;

    if (pixelId && !(window as any).fbq) {
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

      (window as any).fbq('init', pixelId);
    }
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

    // Call browser fbq if available
    if (typeof window !== 'undefined' && (window as any).fbq) {
      (window as any).fbq('track', eventName, data, { eventID: eventId });
    }

    // Dispatch custom event for admin testing visualizer
    window.dispatchEvent(new CustomEvent('hydee_pixel_event', { detail: logEntry }));
  }

  trackPurchase(orderNumber: string, totalAmount: number, currency: string = 'BDT', itemsCount: number = 1) {
    // Prevent duplicate Purchase fires on reload
    const dedupKey = `purchase_${orderNumber}`;
    if (this.firedPurchases.has(dedupKey)) {
      console.warn(`[Meta Pixel] Deduplication prevented duplicate Purchase event for order: ${orderNumber}`);
      return;
    }
    this.firedPurchases.add(dedupKey);

    this.track('Purchase', {
      value: totalAmount,
      currency,
      num_items: itemsCount,
      content_type: 'product',
      order_id: orderNumber,
    }, `purch_${orderNumber}`);
  }

  getRecentEvents(): PixelEventPayload[] {
    return [...this.eventsLog];
  }

  clearLogs() {
    this.eventsLog = [];
  }
}

export const metaPixel = new MetaPixelService();
