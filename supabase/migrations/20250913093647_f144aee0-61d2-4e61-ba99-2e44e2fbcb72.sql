-- Fix critical security vulnerability in vendors table
-- Remove public access to sensitive vendor API credentials
DROP POLICY IF EXISTS "Admin can manage vendors" ON public.vendors;

-- Create secure policy for admin-only access to vendor credentials
CREATE POLICY "Only admins can view vendor credentials"
ON public.vendors
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

-- Create secure policy for admin-only management of vendors
CREATE POLICY "Only admins can manage vendors"
ON public.vendors
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

-- Add audit logging for vendor security update
INSERT INTO public.security_audit_logs (user_id, action, table_name, ip_address, user_agent)
SELECT 
  auth.uid(),
  'SECURITY_UPDATE_VENDORS_TABLE',
  'vendors',
  inet_client_addr()::text,
  current_setting('request.headers', true)::json->>'user-agent'
WHERE auth.uid() IS NOT NULL;