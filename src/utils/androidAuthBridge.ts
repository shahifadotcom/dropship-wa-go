/**
 * Android Authentication Bridge
 * Synchronizes Supabase auth state with Android native storage
 */

import { supabase } from '@/integrations/supabase/client';

declare global {
  interface Window {
    Android?: {
      storeAuthToken: (accessToken: string, refreshToken: string) => void;
      clearAuthToken: () => void;
    };
  }
}

/**
 * Initialize Android auth synchronization
 * Call this after user authentication to sync tokens with Android
 */
export const initializeAndroidAuth = () => {
  if (!window.Android) {
    console.log('Not running in Android WebView');
    return;
  }

  console.log('Initializing Android auth bridge');

  // Listen for auth state changes
  supabase.auth.onAuthStateChange((event, session) => {
    console.log('Auth state changed:', event);

    if (event === 'SIGNED_IN' && session) {
      // Store tokens in Android
      const accessToken = session.access_token;
      const refreshToken = session.refresh_token;
      
      console.log('Storing auth tokens in Android');
      window.Android?.storeAuthToken(accessToken, refreshToken);
    } else if (event === 'SIGNED_OUT') {
      // Clear tokens from Android
      console.log('Clearing auth tokens from Android');
      window.Android?.clearAuthToken();
    }
  });

  // Check for existing session and sync
  supabase.auth.getSession().then(({ data: { session } }) => {
    if (session) {
      console.log('Syncing existing session with Android');
      window.Android?.storeAuthToken(
        session.access_token,
        session.refresh_token
      );
    }
  });
};

/**
 * Check if running in Android WebView
 */
export const isAndroidWebView = (): boolean => {
  return typeof window !== 'undefined' && !!window.Android;
};
