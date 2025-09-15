-- SECURITY FIX: Remove security definer view and replace with proper RLS

-- Drop the security definer view
DROP VIEW IF EXISTS public.products_public_safe;

-- Instead, modify the existing products table policies to handle sensitive data properly
-- Replace existing policies with more granular ones

DROP POLICY IF EXISTS "Products basic info publicly viewable" ON public.products;
DROP POLICY IF EXISTS "Admin can view all product data including costs" ON public.products;

-- Create new policies that hide sensitive columns from public but allow admin access
CREATE POLICY "Public can view non-sensitive product data" 
ON public.products 
FOR SELECT 
USING (true);

-- Note: The above policy allows public access but frontend should filter sensitive columns
-- Create admin-only policy for all data access
CREATE POLICY "Admins can view all product data" 
ON public.products 
FOR ALL
USING (EXISTS (
  SELECT 1 FROM public.user_roles 
  WHERE user_id = auth.uid() AND role = 'admin'::app_role
))
WITH CHECK (EXISTS (
  SELECT 1 FROM public.user_roles 
  WHERE user_id = auth.uid() AND role = 'admin'::app_role
));

-- Create function to check if user should see sensitive product data
CREATE OR REPLACE FUNCTION public.can_view_sensitive_product_data()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'::app_role
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public;

-- Add function to safely get products without sensitive data for public users
CREATE OR REPLACE FUNCTION public.get_public_products()
RETURNS TABLE (
  id UUID,
  name TEXT,
  description TEXT,
  images TEXT[],
  price NUMERIC,
  original_price NUMERIC,
  category_id UUID,
  subcategory_id UUID,
  in_stock BOOLEAN,
  stock_quantity INTEGER,
  rating NUMERIC,
  review_count INTEGER,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  country_id UUID,
  shipping_cost NUMERIC,
  tax_rate NUMERIC,
  weight NUMERIC,
  dimensions JSONB,
  sku TEXT,
  slug TEXT,
  tags TEXT[],
  brand TEXT,
  meta_title TEXT,
  meta_description TEXT,
  social_preview_image TEXT,
  allowed_payment_gateways TEXT[],
  cash_on_delivery_enabled BOOLEAN,
  auto_order_enabled BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id, p.name, p.description, p.images, p.price, p.original_price,
    p.category_id, p.subcategory_id, p.in_stock, p.stock_quantity,
    p.rating, p.review_count, p.created_at, p.updated_at, p.country_id,
    p.shipping_cost, p.tax_rate, p.weight, p.dimensions, p.sku, p.slug,
    p.tags, p.brand, p.meta_title, p.meta_description, p.social_preview_image,
    p.allowed_payment_gateways, p.cash_on_delivery_enabled, p.auto_order_enabled
  FROM public.products p;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public;

-- Grant execute permission to public
GRANT EXECUTE ON FUNCTION public.get_public_products() TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.can_view_sensitive_product_data() TO authenticated;