-- Fix critical security vulnerability in whatsapp_config table
-- Remove the overly permissive policy that allows public access
DROP POLICY IF EXISTS "Admin can manage WhatsApp config" ON public.whatsapp_config;

-- Keep only the secure admin-restricted policy
-- The policy "Admin can manage whatsapp config" with proper role checking should remain

-- Add audit logging for WhatsApp configuration access
INSERT INTO public.security_audit_logs (user_id, action, table_name, ip_address, user_agent)
SELECT 
  auth.uid(),
  'POLICY_UPDATE',
  'whatsapp_config',
  inet_client_addr()::text,
  current_setting('request.headers', true)::json->>'user-agent'
WHERE auth.uid() IS NOT NULL;