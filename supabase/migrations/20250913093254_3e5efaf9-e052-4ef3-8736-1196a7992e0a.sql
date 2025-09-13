-- Fix critical security vulnerability in payment_gateways table
-- Remove public access to sensitive payment gateway information
DROP POLICY IF EXISTS "Payment gateways are viewable by everyone" ON public.payment_gateways;

-- Create secure policy for authenticated users only
CREATE POLICY "Authenticated users can view active payment gateways"
ON public.payment_gateways
FOR SELECT
TO authenticated
USING (is_active = true);

-- Update admin policy to be more explicit
DROP POLICY IF EXISTS "Admins can manage payment gateways" ON public.payment_gateways;

CREATE POLICY "Only admins can manage payment gateways"
ON public.payment_gateways
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

-- Add audit logging for payment gateway security update
INSERT INTO public.security_audit_logs (user_id, action, table_name, ip_address, user_agent)
SELECT 
  auth.uid(),
  'SECURITY_UPDATE_PAYMENT_GATEWAYS',
  'payment_gateways',
  inet_client_addr()::text,
  current_setting('request.headers', true)::json->>'user-agent'
WHERE auth.uid() IS NOT NULL;