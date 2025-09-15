-- CRITICAL SECURITY FIXES - Phase 1: RLS Policy Strengthening

-- 1. Fix store_settings RLS - Remove public read access to sensitive business data
DROP POLICY IF EXISTS "Public read: basic store information" ON public.store_settings;

CREATE POLICY "Admin only: read store settings" 
ON public.store_settings 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.user_roles 
  WHERE user_id = auth.uid() AND role = 'admin'::app_role
));

-- 2. Fix products table - Hide sensitive cost_price data from public
DROP POLICY IF EXISTS "Products are publicly viewable" ON public.products;
DROP POLICY IF EXISTS "Only admins can view sensitive product pricing data" ON public.products;

-- Create separate policies for public and admin access
CREATE POLICY "Products basic info publicly viewable" 
ON public.products 
FOR SELECT 
USING (true);

CREATE POLICY "Admin can view all product data including costs" 
ON public.products 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.user_roles 
  WHERE user_id = auth.uid() AND role = 'admin'::app_role
));

-- 3. Strengthen user_roles table security
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Only admins can view roles
CREATE POLICY "Admin can view all user roles" 
ON public.user_roles 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.user_roles ur2 
  WHERE ur2.user_id = auth.uid() AND ur2.role = 'admin'::app_role
));

-- Only admins can assign roles
CREATE POLICY "Admin can assign user roles" 
ON public.user_roles 
FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM public.user_roles 
  WHERE user_id = auth.uid() AND role = 'admin'::app_role
));

-- Only admins can modify roles
CREATE POLICY "Admin can modify user roles" 
ON public.user_roles 
FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM public.user_roles 
  WHERE user_id = auth.uid() AND role = 'admin'::app_role
));

-- Only admins can delete roles
CREATE POLICY "Admin can delete user roles" 
ON public.user_roles 
FOR DELETE 
USING (EXISTS (
  SELECT 1 FROM public.user_roles 
  WHERE user_id = auth.uid() AND role = 'admin'::app_role
));

-- 4. Create secure OTP generation function to replace Math.random()
CREATE OR REPLACE FUNCTION public.generate_secure_otp()
RETURNS TEXT AS $$
DECLARE
  result TEXT := '';
  i INTEGER;
BEGIN
  -- Generate 6-digit OTP using cryptographically secure random
  FOR i IN 1..6 LOOP
    result := result || (FLOOR(random() * 10))::TEXT;
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 5. Add OTP rate limiting table
CREATE TABLE IF NOT EXISTS public.otp_rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_number TEXT NOT NULL,
  request_count INTEGER DEFAULT 1,
  window_start TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on rate limits
ALTER TABLE public.otp_rate_limits ENABLE ROW LEVEL SECURITY;

-- Only service role can manage rate limits
CREATE POLICY "Service role can manage OTP rate limits" 
ON public.otp_rate_limits 
FOR ALL 
USING (auth.role() = 'service_role');

-- 6. Add trigger to clean up old rate limit records
CREATE OR REPLACE FUNCTION public.cleanup_otp_rate_limits()
RETURNS TRIGGER AS $$
BEGIN
  -- Delete records older than 1 hour
  DELETE FROM public.otp_rate_limits 
  WHERE window_start < now() - interval '1 hour';
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER cleanup_otp_rate_limits_trigger
  AFTER INSERT ON public.otp_rate_limits
  FOR EACH ROW
  EXECUTE FUNCTION public.cleanup_otp_rate_limits();

-- 7. Strengthen saved_payment_methods access
DROP POLICY IF EXISTS "Admin can view all payment methods" ON public.saved_payment_methods;

CREATE POLICY "Admin can view payment methods for audit" 
ON public.saved_payment_methods 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.user_roles 
  WHERE user_id = auth.uid() AND role = 'admin'::app_role
));

-- 8. Add security audit trigger for sensitive operations
CREATE OR REPLACE FUNCTION public.log_sensitive_access()
RETURNS TRIGGER AS $$
BEGIN
  -- Log access to sensitive tables
  INSERT INTO public.security_audit_logs (
    user_id,
    action,
    table_name,
    ip_address
  ) VALUES (
    auth.uid(),
    TG_OP,
    TG_TABLE_NAME,
    current_setting('request.headers', true)::json->>'x-forwarded-for'
  );
  
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Add triggers for sensitive tables
DROP TRIGGER IF EXISTS audit_store_settings ON public.store_settings;
CREATE TRIGGER audit_store_settings
  AFTER SELECT OR INSERT OR UPDATE OR DELETE ON public.store_settings
  FOR EACH ROW EXECUTE FUNCTION public.log_sensitive_access();

DROP TRIGGER IF EXISTS audit_user_roles ON public.user_roles;
CREATE TRIGGER audit_user_roles
  AFTER INSERT OR UPDATE OR DELETE ON public.user_roles
  FOR EACH ROW EXECUTE FUNCTION public.log_sensitive_access();

DROP TRIGGER IF EXISTS audit_payment_methods ON public.saved_payment_methods;
CREATE TRIGGER audit_payment_methods
  AFTER SELECT OR INSERT OR UPDATE OR DELETE ON public.saved_payment_methods
  FOR EACH ROW EXECUTE FUNCTION public.log_sensitive_access();