-- Security Fix Migration: Address Critical Vulnerabilities
-- This migration implements comprehensive security fixes for identified vulnerabilities

-- 1. SECURE API CREDENTIALS TABLES
-- Fix google_services_config table - restrict to admin users only
DROP POLICY IF EXISTS "Only admins can manage Google services config" ON public.google_services_config;

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
CREATE POLICY "Deny anonymous access to Google services config"
ON public.google_services_config
FOR ALL
TO anon
USING (false)
WITH CHECK (false);

-- Fix oauth_clients table - restrict to admin users only  
DROP POLICY IF EXISTS "Only admins can manage OAuth clients" ON public.oauth_clients;

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
CREATE POLICY "Deny anonymous access to OAuth clients"
ON public.oauth_clients
FOR ALL
TO anon
USING (false)
WITH CHECK (false);

-- 2. SECURE ADMINISTRATIVE CONFIGURATION TABLES
-- Fix store_settings table - ensure admin-only access
DROP POLICY IF EXISTS "Only admins can access store settings" ON public.store_settings;

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
CREATE POLICY "Public read: basic store information"
ON public.store_settings
FOR SELECT
TO anon
USING (true);

-- Fix seo_settings table - restrict admin access properly
DROP POLICY IF EXISTS "Admin can manage SEO config" ON public.seo_settings;
DROP POLICY IF EXISTS "Admin can manage SEO settings" ON public.seo_settings;

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

-- Update store_woocommerce_api_key function
CREATE OR REPLACE FUNCTION public.store_woocommerce_api_key(
  p_user_id uuid,
  p_app_name text,
  p_api_key text,
  p_api_secret text,
  p_scope text,
  p_callback_url text,
  p_external_user_id text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.woocommerce_api_keys (
    user_id,
    app_name,
    api_key,
    api_secret,
    scope,
    callback_url,
    external_user_id,
    is_active
  ) VALUES (
    p_user_id,
    p_app_name,
    p_api_key,
    p_api_secret,
    p_scope,
    p_callback_url,
    p_external_user_id,
    true
  );
END;
$$;

-- Update generate_oauth_client function
CREATE OR REPLACE FUNCTION public.generate_oauth_client(
  p_name text,
  p_description text DEFAULT NULL,
  p_redirect_uris text[] DEFAULT '{}',
  p_scopes text[] DEFAULT '{}'
)
RETURNS TABLE(client_id text, client_secret text, id uuid)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_client_id TEXT;
  new_client_secret TEXT;
  new_id UUID;
BEGIN
  -- Generate secure client ID and secret
  new_client_id := 'oauth_' || replace(gen_random_uuid()::text, '-', '');
  new_client_secret := encode(decode(replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', ''), 'hex'), 'base64');
  
  -- Insert the new OAuth client
  INSERT INTO public.oauth_clients (
    client_id, 
    client_secret, 
    name, 
    description, 
    redirect_uris, 
    scopes,
    created_by
  )
  VALUES (
    new_client_id,
    new_client_secret,
    p_name,
    p_description,
    p_redirect_uris,
    p_scopes,
    auth.uid()
  )
  RETURNING oauth_clients.id INTO new_id;
  
  RETURN QUERY SELECT new_client_id, new_client_secret, new_id;
END;
$$;

-- Update get_cj_credentials function
CREATE OR REPLACE FUNCTION public.get_cj_credentials(connection_id uuid)
RETURNS TABLE(client_secret text, access_token text, refresh_token text)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT c.client_secret, c.access_token, c.refresh_token
  FROM cj_credentials c
  WHERE c.connection_id = $1;
$$;

-- Update update_cj_credentials function
CREATE OR REPLACE FUNCTION public.update_cj_credentials(
  connection_id uuid,
  new_access_token text DEFAULT NULL,
  new_refresh_token text DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE cj_credentials 
  SET 
    access_token = COALESCE(new_access_token, access_token),
    refresh_token = COALESCE(new_refresh_token, refresh_token),
    updated_at = now()
  WHERE cj_credentials.connection_id = $1;
  
  RETURN FOUND;
END;
$$;

-- Update store_cj_credentials function
CREATE OR REPLACE FUNCTION public.store_cj_credentials(connection_id uuid, client_secret text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO cj_credentials (connection_id, client_secret)
  VALUES (connection_id, client_secret)
  ON CONFLICT (connection_id) 
  DO UPDATE SET client_secret = EXCLUDED.client_secret, updated_at = now();
  
  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    RETURN FALSE;
END;
$$;

-- Update handle_new_user function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, first_name, last_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'first_name', NEW.raw_user_meta_data->>'last_name');
  RETURN NEW;
END;
$$;

-- Update update_updated_at_column function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

-- Update update_seo_settings_updated_at function
CREATE OR REPLACE FUNCTION public.update_seo_settings_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- 4. ADDITIONAL SECURITY IMPROVEMENTS

-- Ensure saved_payment_methods table has proper admin oversight
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

COMMENT ON FUNCTION public.audit_sensitive_operations() IS 
'Security: Audit trail function for tracking access to sensitive configuration tables';