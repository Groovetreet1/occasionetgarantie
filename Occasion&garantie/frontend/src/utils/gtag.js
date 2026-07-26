// Google Ads & Analytics Tracking Utility
// Remplace GOOGLE_ADS_ID par ton ID de conversion Google Ads (ex: AW-123456789)
// Remplace GA4_ID par ton ID de mesure Google Analytics 4 (ex: G-XXXXXXXXXX)

const GOOGLE_ADS_ID = import.meta.env.VITE_GOOGLE_ADS_ID || 'AW-879979551';
const GA4_ID = import.meta.env.VITE_GA4_ID || '';

export function initGtag() {
  if (typeof window.gtag !== 'function') {
    window.dataLayer = window.dataLayer || [];
    function gtag(){window.dataLayer.push(arguments);}
    window.gtag = gtag;
    gtag('js', new Date());
    if (GOOGLE_ADS_ID) gtag('config', GOOGLE_ADS_ID);
    if (GA4_ID) gtag('config', GA4_ID);
  }
}

// ---------- Google Ads conversions ----------

export function trackSignup() {
  if (GOOGLE_ADS_ID && window.gtag) {
    window.gtag('event', 'conversion', {
      send_to: `${GOOGLE_ADS_ID}/SIGNUP`,
      event_callback: () => console.log('✅ Signup conversion sent'),
    });
  }
}

export function trackPurchase({ value, currency = 'MAD', transactionId, items = [] }) {
  if (GOOGLE_ADS_ID && window.gtag) {
    window.gtag('event', 'purchase', {
      send_to: `${GOOGLE_ADS_ID}/PURCHASE`,
      value,
      currency,
      transaction_id: transactionId,
      items,
      event_callback: () => console.log('✅ Purchase conversion sent'),
    });
    if (GA4_ID) {
      window.gtag('event', 'purchase', {
        value,
        currency,
        transaction_id: transactionId,
        items,
      });
    }
  }
}

export function trackContact() {
  if (GOOGLE_ADS_ID && window.gtag) {
    window.gtag('event', 'conversion', {
      send_to: `${GOOGLE_ADS_ID}/CONTACT`,
      event_callback: () => console.log('✅ Contact conversion sent'),
    });
  }
}

export function trackSubmitProduct({ value = 0 }) {
  if (GOOGLE_ADS_ID && window.gtag) {
    window.gtag('event', 'conversion', {
      send_to: `${GOOGLE_ADS_ID}/SUBMIT_PRODUCT`,
      value,
      currency: 'MAD',
      event_callback: () => console.log('✅ Submit product conversion sent'),
    });
  }
}

// ---------- Remarketing & standard events ----------

export function trackPageView(path) {
  if (GA4_ID && window.gtag) {
    window.gtag('event', 'page_view', { page_path: path });
  }
}

export function trackViewItem({ id, name, category, price, brand }) {
  if (window.gtag) {
    window.gtag('event', 'view_item', {
      currency: 'MAD',
      value: price,
      items: [{ item_id: id, item_name: name, item_category: category, price, item_brand: brand }],
    });
  }
}

export function trackAddToCart({ id, name, price, quantity = 1 }) {
  if (window.gtag) {
    window.gtag('event', 'add_to_cart', {
      currency: 'MAD',
      value: price * quantity,
      items: [{ item_id: id, item_name: name, price, quantity }],
    });
  }
}

export function trackSearch(term) {
  if (window.gtag) {
    window.gtag('event', 'search', { search_term: term });
  }
}
