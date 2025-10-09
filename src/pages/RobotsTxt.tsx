import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export default function RobotsTxt() {
  const [robotsTxt, setRobotsTxt] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRobotsTxt();
  }, []);

  const loadRobotsTxt = async () => {
    try {
      const { data: seoSettings } = await supabase
        .from('seo_settings')
        .select('robots_txt, canonical_url')
        .single();

      const baseUrl = seoSettings?.canonical_url || window.location.origin;

      const defaultRobots = `User-agent: *
Allow: /

Disallow: /admin/
Disallow: /auth/callback
Disallow: /dashboard
Disallow: /profile
Disallow: /orders
Disallow: /checkout

Sitemap: ${baseUrl}/sitemap.xml`;

      setRobotsTxt(seoSettings?.robots_txt || defaultRobots);
      setLoading(false);
    } catch (error) {
      console.error('Error loading robots.txt:', error);
      setRobotsTxt('User-agent: *\nAllow: /');
      setLoading(false);
    }
  };

  if (loading) {
    return <div>Loading robots.txt...</div>;
  }

  return (
    <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'monospace', fontSize: '12px', margin: 0 }}>
      {robotsTxt}
    </pre>
  );
}
