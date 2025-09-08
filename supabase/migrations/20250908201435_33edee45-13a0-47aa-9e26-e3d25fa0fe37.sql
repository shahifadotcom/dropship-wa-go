-- Create table for Google services integration settings
CREATE TABLE IF NOT EXISTS public.google_services_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_name TEXT NOT NULL UNIQUE,
  client_id TEXT,
  client_secret TEXT,
  access_token TEXT,
  refresh_token TEXT,
  merchant_center_id TEXT,
  is_enabled BOOLEAN DEFAULT false,
  auth_scopes TEXT[],
  last_sync TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.google_services_config ENABLE ROW LEVEL SECURITY;

-- Create policy for admin access only
CREATE POLICY "Admin can manage Google services config"
ON public.google_services_config
FOR ALL
USING (true);

-- Create table for SEO and search engine settings
CREATE TABLE IF NOT EXISTS public.seo_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_title TEXT,
  site_description TEXT,
  site_keywords TEXT[],
  google_analytics_id TEXT,
  google_search_console_verified BOOLEAN DEFAULT false,
  bing_webmaster_verified BOOLEAN DEFAULT false,
  yandex_webmaster_verified BOOLEAN DEFAULT false,
  sitemap_enabled BOOLEAN DEFAULT true,
  sitemap_last_generated TIMESTAMP WITH TIME ZONE,
  robots_txt TEXT,
  canonical_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.seo_settings ENABLE ROW LEVEL SECURITY;

-- Create policy for admin access
CREATE POLICY "Admin can manage SEO settings"
ON public.seo_settings
FOR ALL
USING (true);

-- Insert default SEO settings
INSERT INTO public.seo_settings (
  site_title,
  site_description,
  robots_txt,
  canonical_url
) VALUES (
  'Your E-commerce Store',
  'Premium products with worldwide shipping',
  'User-agent: *
Allow: /
Disallow: /admin/
Disallow: /api/
Disallow: /auth/

Sitemap: /sitemap.xml',
  'https://yourstore.com'
) ON CONFLICT DO NOTHING;

-- Create trigger for updating updated_at
CREATE OR REPLACE FUNCTION update_seo_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_seo_settings_updated_at
  BEFORE UPDATE ON public.seo_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_seo_settings_updated_at();

CREATE TRIGGER update_google_services_config_updated_at
  BEFORE UPDATE ON public.google_services_config
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();