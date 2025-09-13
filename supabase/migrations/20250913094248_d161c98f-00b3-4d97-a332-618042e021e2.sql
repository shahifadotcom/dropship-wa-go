-- Fix critical security vulnerability - create public product view without sensitive pricing

-- Create a secure public view that excludes sensitive cost pricing data
CREATE OR REPLACE VIEW public.products_catalog AS
SELECT 
  id,
  name,
  description,
  price, -- Keep selling price visible
  images,
  category_id,
  subcategory_id,
  country_id,
  sku,
  stock_quantity,
  in_stock,
  rating,
  review_count,
  tags,
  brand,
  weight,
  dimensions,
  slug,
  meta_title,
  meta_description,
  social_preview_image,
  shipping_cost,
  tax_rate,
  cash_on_delivery_enabled,
  allowed_payment_gateways,
  created_at,
  updated_at
  -- Deliberately excluding: cost_price, original_price, vendor_id, auto_order_enabled
FROM public.products
WHERE in_stock = true; -- Only show available products to public

-- Grant public access to the catalog view
GRANT SELECT ON public.products_catalog TO anon;
GRANT SELECT ON public.products_catalog TO authenticated;

-- Add comment explaining the security measure
COMMENT ON VIEW public.products_catalog IS 'Public product catalog view that excludes sensitive pricing data (cost_price, original_price) to prevent competitor analysis';

-- Add audit logging for products catalog security implementation  
INSERT INTO public.security_audit_logs (user_id, action, table_name, ip_address, user_agent)
SELECT 
  auth.uid(),
  'SECURITY_CREATE_PRODUCTS_CATALOG_VIEW',
  'products_catalog',
  inet_client_addr()::text,
  current_setting('request.headers', true)::json->>'user-agent'
WHERE auth.uid() IS NOT NULL;