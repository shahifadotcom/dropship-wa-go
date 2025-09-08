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

-- Create policies with unique names
DO $$
BEGIN
    -- Google services config policies
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'google_services_config' 
        AND policyname = 'Admin can manage Google services'
    ) THEN
        CREATE POLICY "Admin can manage Google services"
        ON public.google_services_config
        FOR ALL
        USING (true);
    END IF;

    -- SEO settings policies
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'seo_settings' 
        AND policyname = 'Admin can manage SEO config'
    ) THEN
        CREATE POLICY "Admin can manage SEO config"
        ON public.seo_settings
        FOR ALL
        USING (true);
    END IF;
END
$$;