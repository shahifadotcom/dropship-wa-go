-- Fix the regenerate_sitemap function to use WHERE clause (required by safeupdate extension)
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
  
  -- Delete old cache entries (with WHERE clause for safeupdate compatibility)
  DELETE FROM sitemap_cache WHERE id IS NOT NULL;
  
  -- Insert new sitemap
  INSERT INTO sitemap_cache (xml_content, products_count, categories_count)
  VALUES (full_xml, prod_count, cat_count);
  
  -- Update SEO settings timestamp
  UPDATE seo_settings SET sitemap_last_generated = now() WHERE id IS NOT NULL;
END;
$$;