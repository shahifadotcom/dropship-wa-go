-- Create sitemap cache table
CREATE TABLE public.sitemap_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  xml_content text NOT NULL,
  generated_at timestamp with time zone NOT NULL DEFAULT now(),
  products_count integer DEFAULT 0,
  categories_count integer DEFAULT 0
);

-- Enable RLS
ALTER TABLE public.sitemap_cache ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "Anyone can read sitemap cache"
  ON public.sitemap_cache FOR SELECT
  USING (true);

-- Admin can manage
CREATE POLICY "Admin can manage sitemap cache"
  ON public.sitemap_cache FOR ALL
  USING (EXISTS (
    SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'::app_role
  ));

-- Function to regenerate sitemap
CREATE OR REPLACE FUNCTION public.regenerate_sitemap()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  base_url TEXT;
  products_xml TEXT := '';
  categories_xml TEXT := '';
  full_xml TEXT;
  prod_count INTEGER := 0;
  cat_count INTEGER := 0;
BEGIN
  -- Get base URL from SEO settings
  SELECT COALESCE(canonical_url, 'https://shahifa.com') INTO base_url FROM seo_settings LIMIT 1;
  
  -- Generate categories XML
  SELECT 
    string_agg(
      E'  <url>\n    <loc>' || base_url || '/categories/' || slug || E'</loc>\n    <lastmod>' || 
      to_char(updated_at, 'YYYY-MM-DD') || E'</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.8</priority>\n  </url>',
      E'\n'
    ),
    COUNT(*)
  INTO categories_xml, cat_count
  FROM categories;
  
  -- Generate products XML
  SELECT 
    string_agg(
      E'  <url>\n    <loc>' || base_url || '/products/' || slug || E'</loc>\n    <lastmod>' || 
      to_char(updated_at, 'YYYY-MM-DD') || E'</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.7</priority>\n  </url>',
      E'\n'
    ),
    COUNT(*)
  INTO products_xml, prod_count
  FROM products
  WHERE in_stock = true AND slug IS NOT NULL;
  
  -- Build full sitemap
  full_xml := E'<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' ||
    E'  <!-- Homepage -->\n  <url>\n    <loc>' || base_url || E'</loc>\n    <lastmod>' || to_char(now(), 'YYYY-MM-DD') || E'</lastmod>\n    <changefreq>daily</changefreq>\n    <priority>1.0</priority>\n  </url>\n' ||
    E'  <!-- Shop -->\n  <url>\n    <loc>' || base_url || E'/shop</loc>\n    <lastmod>' || to_char(now(), 'YYYY-MM-DD') || E'</lastmod>\n    <changefreq>daily</changefreq>\n    <priority>0.9</priority>\n  </url>\n' ||
    E'  <!-- Categories -->\n' || COALESCE(categories_xml, '') || E'\n' ||
    E'  <!-- Products -->\n' || COALESCE(products_xml, '') || E'\n' ||
    E'  <!-- Static Pages -->\n  <url>\n    <loc>' || base_url || E'/auth</loc>\n    <lastmod>' || to_char(now(), 'YYYY-MM-DD') || E'</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>0.5</priority>\n  </url>\n' ||
    E'  <url>\n    <loc>' || base_url || E'/orders</loc>\n    <lastmod>' || to_char(now(), 'YYYY-MM-DD') || E'</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.6</priority>\n  </url>\n' ||
    E'  <url>\n    <loc>' || base_url || E'/blog</loc>\n    <lastmod>' || to_char(now(), 'YYYY-MM-DD') || E'</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.6</priority>\n  </url>\n' ||
    E'</urlset>';
  
  -- Delete old and insert new
  DELETE FROM sitemap_cache;
  INSERT INTO sitemap_cache (xml_content, products_count, categories_count)
  VALUES (full_xml, prod_count, cat_count);
  
  -- Update SEO settings timestamp
  UPDATE seo_settings SET sitemap_last_generated = now();
END;
$$;

-- Trigger function to call regenerate on changes
CREATE OR REPLACE FUNCTION public.trigger_sitemap_regeneration()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Use pg_notify for async regeneration (prevents blocking)
  PERFORM pg_notify('sitemap_update', 'regenerate');
  -- Also regenerate directly (small operation)
  PERFORM regenerate_sitemap();
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Create triggers on products table
CREATE TRIGGER products_sitemap_trigger
  AFTER INSERT OR UPDATE OR DELETE ON products
  FOR EACH STATEMENT
  EXECUTE FUNCTION trigger_sitemap_regeneration();

-- Create triggers on categories table  
CREATE TRIGGER categories_sitemap_trigger
  AFTER INSERT OR UPDATE OR DELETE ON categories
  FOR EACH STATEMENT
  EXECUTE FUNCTION trigger_sitemap_regeneration();

-- Generate initial sitemap
SELECT regenerate_sitemap();