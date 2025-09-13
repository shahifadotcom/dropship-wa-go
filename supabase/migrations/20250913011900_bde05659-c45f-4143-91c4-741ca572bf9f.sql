-- Fix critical security vulnerability in google_services_config table
-- Remove existing overly permissive policies
DROP POLICY IF EXISTS "Admin can manage Google services" ON public.google_services_config;
DROP POLICY IF EXISTS "Admin can manage Google services config" ON public.google_services_config;

-- Create proper admin-only RLS policies
CREATE POLICY "Only admins can manage Google services config"
ON public.google_services_config
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

-- Add audit logging for sensitive config access
CREATE TABLE IF NOT EXISTS public.security_audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  action text NOT NULL,
  table_name text NOT NULL,
  timestamp timestamp with time zone DEFAULT now(),
  ip_address text,
  user_agent text
);

-- Enable RLS on audit logs
ALTER TABLE public.security_audit_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
CREATE POLICY "Only admins can view audit logs"
ON public.security_audit_logs
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

-- System can insert audit logs
CREATE POLICY "System can insert audit logs"
ON public.security_audit_logs
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);