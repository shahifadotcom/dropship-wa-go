import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const GoogleAnalytics = () => {
  useEffect(() => {
    const loadGA = async () => {
      try {
        const { data: seoSettings } = await supabase
          .from('seo_settings')
          .select('google_analytics_id')
          .maybeSingle();

        if (seoSettings?.google_analytics_id) {
          const gaId = seoSettings.google_analytics_id;
          
          // Check if script already loaded
          if (document.querySelector(`script[src*="${gaId}"]`)) {
            return;
          }

          // Load Google Analytics script
          const script1 = document.createElement('script');
          script1.async = true;
          script1.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`;
          document.head.appendChild(script1);

          // Initialize Google Analytics
          const script2 = document.createElement('script');
          script2.innerHTML = `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${gaId}');
          `;
          document.head.appendChild(script2);

          console.log('Google Analytics loaded:', gaId);
        }
      } catch (error) {
        console.error('Error loading Google Analytics:', error);
      }
    };

    loadGA();
  }, []);

  return null;
};
