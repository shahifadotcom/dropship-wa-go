-- Phase 1: Critical Vulnerabilities - Fix RLS Policies

-- 1.1 Fix Orders Table RLS Policies
-- Drop all existing policies first
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Anyone can view orders by order ID" ON public.orders;
  DROP POLICY IF EXISTS "Users can view their own orders" ON public.orders;
  DROP POLICY IF EXISTS "Admins can view all orders" ON public.orders;
  DROP POLICY IF EXISTS "Admins can update orders" ON public.orders;
END $$;

CREATE POLICY "Users can view their own orders" 
ON public.orders FOR SELECT
USING (auth.uid() = customer_id);

CREATE POLICY "Admins can view all orders"
ON public.orders FOR SELECT  
USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update orders"
ON public.orders FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- 1.2 Fix Advance Payments - Add admin view policy
DROP POLICY IF EXISTS "Admins can view all advance payments" ON public.advance_payments;

CREATE POLICY "Admins can view all advance payments"
ON public.advance_payments FOR SELECT
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- 1.3 Fix Products Table RLS Policies
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Allow product management for authenticated users" ON public.products;
  DROP POLICY IF EXISTS "Allow product updates for authenticated users" ON public.products;
  DROP POLICY IF EXISTS "Allow product deletion for authenticated users" ON public.products;
  DROP POLICY IF EXISTS "Admins can insert products" ON public.products;
  DROP POLICY IF EXISTS "Admins can update products" ON public.products;
  DROP POLICY IF EXISTS "Admins can delete products" ON public.products;
END $$;

CREATE POLICY "Admins can insert products"
ON public.products FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update products"  
ON public.products FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete products"
ON public.products FOR DELETE
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Phase 2: High-Priority Issues

-- 2.1 Protect Store Settings - Create public view
DROP VIEW IF EXISTS public.store_settings_public;

CREATE VIEW public.store_settings_public AS
SELECT 
  id,
  store_name,
  store_tagline,
  store_description,
  store_logo,
  favicon_url,
  currency,
  created_at,
  updated_at
FROM public.store_settings;

GRANT SELECT ON public.store_settings_public TO anon, authenticated;

DROP POLICY IF EXISTS "Public can view store settings" ON public.store_settings;
DROP POLICY IF EXISTS "Only admins can view full store settings" ON public.store_settings;

CREATE POLICY "Only admins can view full store settings"
ON public.store_settings FOR SELECT
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- 2.2 Protect AI Ad Campaigns
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Admin can view campaigns" ON public.ai_ad_campaigns;
  DROP POLICY IF EXISTS "System can manage campaigns" ON public.ai_ad_campaigns;
  DROP POLICY IF EXISTS "Admins can view all campaigns" ON public.ai_ad_campaigns;
  DROP POLICY IF EXISTS "Admins can manage campaigns" ON public.ai_ad_campaigns;
  DROP POLICY IF EXISTS "Service role can manage campaigns" ON public.ai_ad_campaigns;
END $$;

CREATE POLICY "Admins can view all campaigns"
ON public.ai_ad_campaigns FOR SELECT
USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can manage campaigns"  
ON public.ai_ad_campaigns FOR ALL
USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Service role can manage campaigns"
ON public.ai_ad_campaigns FOR ALL
USING (auth.role() = 'service_role');

-- Phase 3: Medium-Priority Hardening

-- 3.1 Implement OTP Rate Limiting
CREATE OR REPLACE FUNCTION public.check_otp_rate_limit(p_phone_number text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  recent_attempts INTEGER;
BEGIN
  SELECT COUNT(*) INTO recent_attempts
  FROM public.otp_verifications
  WHERE phone_number = p_phone_number
    AND created_at > (now() - interval '15 minutes');
  
  RETURN recent_attempts < 5;
END;
$function$;

-- 3.2 Add Security Audit Logging Triggers
DROP TRIGGER IF EXISTS audit_order_changes ON public.orders;
DROP TRIGGER IF EXISTS audit_product_changes ON public.products;

CREATE TRIGGER audit_order_changes
  AFTER UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.log_admin_operations();

CREATE TRIGGER audit_product_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.log_admin_operations();