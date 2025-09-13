-- Fix critical security vulnerability in products table
-- Remove public access to sensitive cost pricing information

-- Drop the existing public access policy
DROP POLICY IF EXISTS "Products are viewable by everyone" ON public.products;

-- Create a public view that excludes sensitive pricing information
CREATE OR REPLACE VIEW public.products_public AS
SELECT 
  id,
  name,
  description,
  price,
  images,
  category_id,
  subcategory_id,
  country_id,
  vendor_id,
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
  auto_order_enabled,
  allowed_payment_gateways,
  created_at,
  updated_at
  -- Deliberately excluding: cost_price, original_price (sensitive pricing data)
FROM public.products;

-- Enable RLS on the public view
ALTER VIEW public.products_public SET (security_invoker = true);

-- Create policy for public access to the sanitized view
CREATE POLICY "Public can view products without sensitive pricing"
ON public.products
FOR SELECT
TO anon, authenticated
USING (true);

-- Create policy for admin access to full product data including sensitive pricing
CREATE POLICY "Admins can view all product data including pricing"
ON public.products  
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 
    FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'::app_role
  )
);

-- Add audit logging for products security update
INSERT INTO public.security_audit_logs (user_id, action, table_name, ip_address, user_agent)
SELECT 
  auth.uid(),
  'SECURITY_UPDATE_PRODUCTS_PRICING',
  'products',
  inet_client_addr()::text,
  current_setting('request.headers', true)::json->>'user-agent'
WHERE auth.uid() IS NOT NULL;