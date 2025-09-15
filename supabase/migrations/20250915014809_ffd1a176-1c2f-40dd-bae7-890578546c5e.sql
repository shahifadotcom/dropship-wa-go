-- CRITICAL SECURITY FIXES - Phase 2: Enhanced Protection

-- 1. Create view that excludes sensitive product data for public access
CREATE OR REPLACE VIEW public.products_public_safe AS
SELECT 
  id, name, description, images, price, original_price, category_id, 
  subcategory_id, in_stock, stock_quantity, rating, review_count, 
  created_at, updated_at, country_id, shipping_cost, tax_rate, 
  weight, dimensions, sku, slug, tags, brand, meta_title, 
  meta_description, social_preview_image, allowed_payment_gateways,
  cash_on_delivery_enabled, auto_order_enabled
FROM public.products;

-- Grant public access to safe view
GRANT SELECT ON public.products_public_safe TO authenticated, anon;

-- 2. Fix SEO settings RLS - Remove public read access
DROP POLICY IF EXISTS "Public read: basic SEO information" ON public.seo_settings;

CREATE POLICY "Admin only: read SEO settings" 
ON public.seo_settings 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.user_roles 
  WHERE user_id = auth.uid() AND role = 'admin'::app_role
));

-- 3. Create security validation function for critical operations
CREATE OR REPLACE FUNCTION public.validate_admin_access()
RETURNS BOOLEAN AS $$
BEGIN
  -- Check if current user is admin
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'::app_role
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public;

-- 4. Add constraint to prevent self-role modification
CREATE OR REPLACE FUNCTION public.prevent_self_role_modification()
RETURNS TRIGGER AS $$
BEGIN
  -- Prevent users from modifying their own admin role
  IF (TG_OP = 'DELETE' OR TG_OP = 'UPDATE') AND 
     OLD.user_id = auth.uid() AND 
     OLD.role = 'admin'::app_role THEN
    RAISE EXCEPTION 'Users cannot modify their own admin role';
  END IF;
  
  -- For inserts, ensure only admins can assign admin roles
  IF TG_OP = 'INSERT' AND NEW.role = 'admin'::app_role THEN
    IF NOT public.validate_admin_access() THEN
      RAISE EXCEPTION 'Only existing admins can assign admin roles';
    END IF;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Add trigger to enforce role modification rules
DROP TRIGGER IF EXISTS prevent_self_role_modification ON public.user_roles;
CREATE TRIGGER prevent_self_role_modification
  BEFORE INSERT OR UPDATE OR DELETE ON public.user_roles
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_self_role_modification();

-- 5. Strengthen address data protection
DROP POLICY IF EXISTS "Users can view their own addresses" ON public.addresses;
CREATE POLICY "Users can view their own addresses" 
ON public.addresses 
FOR SELECT 
USING (auth.uid() = user_id AND auth.uid() IS NOT NULL);

-- 6. Add validation for OTP verification table
CREATE OR REPLACE FUNCTION public.validate_otp_access()
RETURNS TRIGGER AS $$
BEGIN
  -- Limit OTP verifications to 5 active per phone number
  IF TG_OP = 'INSERT' THEN
    PERFORM 1 FROM public.otp_verifications 
    WHERE phone_number = NEW.phone_number 
      AND is_verified = false 
      AND expires_at > now()
    HAVING COUNT(*) >= 5;
    
    IF FOUND THEN
      RAISE EXCEPTION 'Too many active OTP verifications for this phone number';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS validate_otp_access ON public.otp_verifications;
CREATE TRIGGER validate_otp_access
  BEFORE INSERT ON public.otp_verifications
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_otp_access();

-- 7. Add IP-based access logging for admin operations
CREATE OR REPLACE FUNCTION public.log_admin_operations()
RETURNS TRIGGER AS $$
DECLARE
  client_ip TEXT;
BEGIN
  -- Get client IP from headers
  BEGIN
    client_ip := current_setting('request.headers', true)::json->>'x-forwarded-for';
  EXCEPTION
    WHEN OTHERS THEN
      client_ip := 'unknown';
  END;
  
  -- Log all admin operations
  INSERT INTO public.security_audit_logs (
    user_id,
    action,
    table_name,
    ip_address,
    user_agent
  ) VALUES (
    auth.uid(),
    TG_OP || ' on ' || TG_TABLE_NAME,
    TG_TABLE_NAME,
    client_ip,
    current_setting('request.headers', true)::json->>'user-agent'
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Add admin operation logging to sensitive tables
DROP TRIGGER IF EXISTS log_admin_ops_oauth ON public.oauth_clients;
CREATE TRIGGER log_admin_ops_oauth
  AFTER INSERT OR UPDATE OR DELETE ON public.oauth_clients
  FOR EACH ROW
  EXECUTE FUNCTION public.log_admin_operations();

DROP TRIGGER IF EXISTS log_admin_ops_google ON public.google_services_config;
CREATE TRIGGER log_admin_ops_google
  AFTER INSERT OR UPDATE OR DELETE ON public.google_services_config
  FOR EACH ROW
  EXECUTE FUNCTION public.log_admin_operations();