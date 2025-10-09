-- Fix store_settings RLS: Allow public read, admin-only write
DROP POLICY IF EXISTS "Admin only: read store settings" ON public.store_settings;
DROP POLICY IF EXISTS "Admin only: manage store settings" ON public.store_settings;

-- Allow public to read store settings (needed for storefront)
CREATE POLICY "Public can view store settings"
ON public.store_settings
FOR SELECT
USING (true);

-- Only admins can modify store settings
CREATE POLICY "Admins can manage store settings"
ON public.store_settings
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'::app_role
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'::app_role
  )
);

-- Ensure products table has proper public read access
DROP POLICY IF EXISTS "Products are viewable by everyone" ON public.products;

CREATE POLICY "Public can view products"
ON public.products
FOR SELECT
USING (true);