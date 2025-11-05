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
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading sitemap...</p>
        </div>
      </div>
    );
  }

  // Render XML content as text
  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Sitemap XML</h1>
          <a 
            href="https://mofwljpreecqqxkilywh.supabase.co/functions/v1/generate-sitemap"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            View Raw XML
          </a>
        </div>
        <pre 
          className="bg-muted p-4 rounded-lg overflow-x-auto text-xs"
          style={{ 
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word'
          }}
        >
          {sitemapXML}
        </pre>
      </div>
    </div>
  );
}
