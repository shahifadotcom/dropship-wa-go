import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useLocation } from 'react-router-dom';

// Track events to all platforms via server-side
export const trackEvent = async (
  eventName: string,
  eventData: any = {},
  value?: number
) => {
  try {
    const sessionId = sessionStorage.getItem('session_id') || 
      `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    if (!sessionStorage.getItem('session_id')) {
      sessionStorage.setItem('session_id', sessionId);
    }

    await supabase.functions.invoke('track-event', {
      body: {
        event_name: eventName,
        event_data: eventData,
        value: value,
        session_id: sessionId,
      },
    });
  } catch (error) {
    console.error('Error tracking event:', error);
  }
};

export default function PixelTracker() {
  const location = useLocation();

  useEffect(() => {
    // Track page views
    trackEvent('PageView', {
      page: location.pathname,
      title: document.title,
    });
  }, [location]);

  return null;
}

// Export helper functions for common events
export const trackViewContent = (product: any) => {
  trackEvent('ViewContent', {
    content_type: 'product',
    content_id: product.id,
    content_name: product.name,
    content_category: product.category_id,
  }, product.price);
};

export const trackAddToCart = (product: any, quantity: number = 1) => {
  trackEvent('AddToCart', {
    content_type: 'product',
    content_id: product.id,
    content_name: product.name,
    quantity: quantity,
  }, product.price * quantity);
};

export const trackInitiateCheckout = (items: any[], total: number) => {
  trackEvent('InitiateCheckout', {
    num_items: items.length,
    contents: items.map(item => ({
      id: item.id,
      quantity: item.quantity,
    })),
  }, total);
};

export const trackPurchase = (orderId: string, items: any[], total: number) => {
  trackEvent('Purchase', {
    order_id: orderId,
    num_items: items.length,
    contents: items.map(item => ({
      id: item.product_id,
      quantity: item.quantity,
    })),
  }, total);
};

export const trackSearch = (searchQuery: string) => {
  trackEvent('Search', {
    search_string: searchQuery,
  });
};
