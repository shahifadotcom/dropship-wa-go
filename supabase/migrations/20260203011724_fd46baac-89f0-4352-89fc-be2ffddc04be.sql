-- FIX: Products table exposes sensitive business data (cost_price, vendor_id)
-- The admin policy already exists, so just revoke direct table access for non-admins

-- Revoke direct table SELECT from anon and authenticated roles
-- This forces non-admin users to use the secure views instead
REVOKE SELECT ON public.products FROM anon;
REVOKE SELECT ON public.products FROM authenticated;

-- Grant SELECT on the secure views that exclude sensitive columns
GRANT SELECT ON public.products_catalog TO anon, authenticated;
GRANT SELECT ON public.products_public TO anon, authenticated;

-- Re-grant SELECT to service_role for edge functions
GRANT SELECT ON public.products TO service_role;