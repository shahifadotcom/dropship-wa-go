-- Fix critical security vulnerability in store_settings table
-- Drop all existing policies first
DROP POLICY IF EXISTS "Admin can manage store settings" ON public.store_settings;
DROP POLICY IF EXISTS "Only admins can view store settings" ON public.store_settings;
DROP POLICY IF EXISTS "Only admins can manage store settings" ON public.store_settings;

-- Create secure policy for admin-only access to store settings
CREATE POLICY "Only admins can access store settings"
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
  'SECURITY_UPDATE_STORE_SETTINGS_TABLE',
  'store_settings',
  inet_client_addr()::text,
  current_setting('request.headers', true)::json->>'user-agent'
WHERE auth.uid() IS NOT NULL;