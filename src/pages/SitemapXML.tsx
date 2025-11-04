import { useEffect, useState } from 'react';

export default function SitemapXML() {
  const [sitemapXML, setSitemapXML] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSitemap = async () => {
      try {
        const response = await fetch(
          'https://mofwljpreecqqxkilywh.supabase.co/functions/v1/generate-sitemap'
        );
        
        if (!response.ok) {
          throw new Error('Failed to fetch sitemap');
        }
        
        const xmlText = await response.text();
        setSitemapXML(xmlText);
      } catch (error) {
        console.error('Error fetching sitemap:', error);
        setSitemapXML('<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>');
      } finally {
        setLoading(false);
      }
    };

    fetchSitemap();
  }, []);

  useEffect(() => {
    // Set proper content type for XML
    if (!loading && sitemapXML) {
      const meta = document.createElement('meta');
      meta.httpEquiv = 'Content-Type';
      meta.content = 'application/xml; charset=utf-8';
      document.head.appendChild(meta);
      
      // Set the entire page's content type
      document.documentElement.setAttribute('xmlns', 'http://www.w3.org/1999/xhtml');
      
      return () => {
        document.head.removeChild(meta);
        document.documentElement.removeAttribute('xmlns');
      };
    }
  }, [loading, sitemapXML]);

  if (loading) {
    return null;
  }

  // Render raw XML without any HTML wrapper
  return (
    <pre 
      style={{ 
        margin: 0, 
        padding: 0, 
        whiteSpace: 'pre', 
        fontFamily: 'monospace',
        fontSize: '12px',
        lineHeight: '1.5'
      }}
      dangerouslySetInnerHTML={{ __html: sitemapXML }}
    />
  );
}
