import { useEffect } from 'react';
import { useStoreSettings } from '@/hooks/useStoreSettings';

/**
 * Component that dynamically updates the favicon based on store settings
 */
export const FaviconUpdater = () => {
  const { settings } = useStoreSettings();

  useEffect(() => {
    if (settings?.favicon_url) {
      // Find existing favicon link element
      let link: HTMLLinkElement | null = document.querySelector("link[rel~='icon']");
      
      if (!link) {
        // Create new link element if it doesn't exist
        link = document.createElement('link');
        link.rel = 'icon';
        document.head.appendChild(link);
      }
      
      // Update the href to the new favicon
      link.href = settings.favicon_url;
    }
  }, [settings?.favicon_url]);

  return null; // This component doesn't render anything
};
