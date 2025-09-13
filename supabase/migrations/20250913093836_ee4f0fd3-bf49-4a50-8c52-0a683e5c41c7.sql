-- Fix critical security vulnerability in store_settings table
-- Remove public access to sensitive business contact information
DROP POLICY IF EXISTS "Admin can manage store settings" ON public.store_settings;

-- Create secure policy for admin-only viewing of store settings
CREATE POLICY "Only admins can view store settings"
ON public.store_settings
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

-- Create secure policy for admin-only management of store settings
CREATE POLICY "Only admins can manage store settings"
ON public.store_settings
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 
    FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'::app_role
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 
    FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'::app_role
  )
);

-- Add audit logging for store settings security update
INSERT INTO public.security_audit_logs (user_id, action, table_name, ip_address, user_agent)
SELECT 
  auth.uid(),
  'SECURITY_UPDATE_STORE_SETTINGS',
  'store_settings',
  inet_client_addr()::text,
  current_setting('request.headers', true)::json->>'user-agent'
WHERE auth.uid() IS NOT NULL;