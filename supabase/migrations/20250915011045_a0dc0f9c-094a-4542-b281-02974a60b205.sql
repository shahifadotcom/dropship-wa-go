-- Security Fix Migration: Address Critical Vulnerabilities (Fixed)
-- This migration implements comprehensive security fixes for identified vulnerabilities

-- 1. SECURE API CREDENTIALS TABLES
-- Fix google_services_config table - restrict to admin users only
DROP POLICY IF EXISTS "Only admins can manage Google services config" ON public.google_services_config;
DROP POLICY IF EXISTS "Admin only: manage Google services config" ON public.google_services_config;

CREATE POLICY "Admin only: manage Google services config"
ON public.google_services_config
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

-- Explicitly deny anonymous access to google_services_config
DROP POLICY IF EXISTS "Deny anonymous access to Google services config" ON public.google_services_config;
CREATE POLICY "Deny anonymous access to Google services config"
ON public.google_services_config
FOR ALL
TO anon
USING (false)
WITH CHECK (false);

-- Fix oauth_clients table - restrict to admin users only  
DROP POLICY IF EXISTS "Only admins can manage OAuth clients" ON public.oauth_clients;
DROP POLICY IF EXISTS "Admin only: manage OAuth clients" ON public.oauth_clients;

CREATE POLICY "Admin only: manage OAuth clients"
ON public.oauth_clients
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

-- Explicitly deny anonymous access to oauth_clients
DROP POLICY IF EXISTS "Deny anonymous access to OAuth clients" ON public.oauth_clients;
CREATE POLICY "Deny anonymous access to OAuth clients"
ON public.oauth_clients
FOR ALL
TO anon
USING (false)
WITH CHECK (false);

-- 2. SECURE ADMINISTRATIVE CONFIGURATION TABLES
-- Fix store_settings table - ensure admin-only access
DROP POLICY IF EXISTS "Only admins can access store settings" ON public.store_settings;
DROP POLICY IF EXISTS "Admin only: manage store settings" ON public.store_settings;

CREATE POLICY "Admin only: manage store settings"
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

-- Allow public read access to basic store info for storefront display
DROP POLICY IF EXISTS "Public read: basic store information" ON public.store_settings;
CREATE POLICY "Public read: basic store information"
ON public.store_settings
FOR SELECT
TO anon
USING (true);

-- Fix seo_settings table - restrict admin access properly
DROP POLICY IF EXISTS "Admin can manage SEO config" ON public.seo_settings;
DROP POLICY IF EXISTS "Admin can manage SEO settings" ON public.seo_settings;
DROP POLICY IF EXISTS "Admin only: manage SEO settings" ON public.seo_settings;

CREATE POLICY "Admin only: manage SEO settings"
ON public.seo_settings
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

-- Allow public read access to basic SEO info for meta tags
DROP POLICY IF EXISTS "Public read: basic SEO information" ON public.seo_settings;
CREATE POLICY "Public read: basic SEO information"
ON public.seo_settings
FOR SELECT
TO anon
USING (true);

-- 3. STRENGTHEN DATABASE FUNCTIONS SECURITY
-- Update existing functions to include secure search_path settings

-- Update has_role function
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Update get_user_roles function
CREATE OR REPLACE FUNCTION public.get_user_roles(_user_id uuid)
RETURNS TABLE(role app_role)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT ur.role
  FROM public.user_roles ur
  WHERE ur.user_id = _user_id
$$;

-- 4. ADDITIONAL SECURITY IMPROVEMENTS

-- Ensure saved_payment_methods table has proper admin oversight
DROP POLICY IF EXISTS "Admin can view all payment methods" ON public.saved_payment_methods;
CREATE POLICY "Admin can view all payment methods"
ON public.saved_payment_methods
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'::app_role
  )
);

-- Add security audit trigger for sensitive operations
CREATE OR REPLACE FUNCTION public.audit_sensitive_operations()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Log access to sensitive tables
  INSERT INTO public.security_audit_logs (
    user_id,
    action,
    table_name,
    ip_address,
    user_agent
  ) VALUES (
    auth.uid(),
    TG_OP,
    TG_TABLE_NAME,
    current_setting('request.headers', true)::json->>'x-forwarded-for',
    current_setting('request.headers', true)::json->>'user-agent'
  );
  
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$;

-- Apply audit trigger to sensitive tables
DROP TRIGGER IF EXISTS audit_google_services ON public.google_services_config;
CREATE TRIGGER audit_google_services
  AFTER INSERT OR UPDATE OR DELETE ON public.google_services_config
  FOR EACH ROW EXECUTE FUNCTION public.audit_sensitive_operations();

DROP TRIGGER IF EXISTS audit_oauth_clients ON public.oauth_clients;
CREATE TRIGGER audit_oauth_clients
  AFTER INSERT OR UPDATE OR DELETE ON public.oauth_clients
  FOR EACH ROW EXECUTE FUNCTION public.audit_sensitive_operations();

-- Add comments documenting security measures
COMMENT ON POLICY "Admin only: manage Google services config" ON public.google_services_config IS 
'Security: Restricts Google API credentials access to admin users only to prevent credential exposure';

COMMENT ON POLICY "Admin only: manage OAuth clients" ON public.oauth_clients IS 
'Security: Restricts OAuth client credentials access to admin users only to prevent credential exposure';

COMMENT ON POLICY "Admin only: manage store settings" ON public.store_settings IS 
'Security: Restricts store configuration access to admin users while allowing public read for storefront display';

COMMENT ON POLICY "Admin only: manage SEO settings" ON public.seo_settings IS 
'Security: Restricts SEO configuration access to admin users while allowing public read for meta tags';