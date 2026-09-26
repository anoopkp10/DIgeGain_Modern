// Google Analytics (GA4) Custom Event Tracking Helper

declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
    dataLayer?: any[];
  }
}

export function trackEvent(eventName: string, params?: Record<string, any>) {
  if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
    window.gtag('event', eventName, params);
  }
}

export function trackConversion(type: 'whatsapp_click' | 'contact_form_submit' | 'chat_message' | 'portfolio_view', details?: Record<string, any>) {
  trackEvent(type, {
    event_category: 'engagement',
    ...details,
  });
}
