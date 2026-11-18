// Meta Pixel & Conversions API Service

declare global {
  interface Window {
    fbq: (...args: any[]) => void;
    _fbq: any;
  }
}

export const META_PIXEL_ID = import.meta.env.VITE_META_PIXEL_ID || '';

// Initialize Meta Pixel in Browser
export const initMetaPixel = () => {
  if (!META_PIXEL_ID) return;
  
  if (window.fbq) return;

  (function (f: any, b: any, e: any, v: any, n?: any, t?: any, s?: any) {
    if (f.fbq) return;
    n = f.fbq = function () {
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

  window.fbq('init', META_PIXEL_ID);
  window.fbq('track', 'PageView');
};

// Send Event to Browser Pixel and Server CAPI simultaneously
export const trackMetaEvent = async (
  eventName: string,
  customData: Record<string, any> = {},
  userData: { em?: string; ph?: string; fn?: string; ln?: string } = {}
) => {
  const eventId = `evt_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

  // 1. Browser Pixel Track
  if (typeof window !== 'undefined' && window.fbq) {
    window.fbq('track', eventName, customData, { eventID: eventId });
  }

  // 2. Server CAPI Track (Vercel Serverless Function)
  try {
    await fetch('/api/meta-capi', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        eventName,
        eventSourceUrl: window.location.href,
        userData,
        customData,
        eventId,
      }),
    });
  } catch (error) {
    console.error('Error sending CAPI event:', error);
  }
};
