-- Fix security definer view issue
DROP VIEW IF EXISTS public.cj_connections_safe;

-- Create the view without security definer setting
CREATE VIEW public.cj_connections_safe AS
SELECT 
  id,
  user_id,
  domain,
  client_id,
  is_active,
  last_sync_at,
  token_expires_at,
  oauth_state,
  created_at,
  updated_at,
  -- Indicate if credentials exist without exposing them
  CASE WHEN EXISTS (SELECT 1 FROM cj_credentials WHERE connection_id = cj_dropshipping_connections.id) 
       THEN true ELSE false END as has_credentials
FROM public.cj_dropshipping_connections;

-- Enable RLS on the view the proper way
ALTER VIEW public.cj_connections_safe SET (security_barrier = true);

-- Create RLS policy for the safe view
CREATE POLICY "Users can view their own safe connections"
ON public.cj_connections_safe
FOR SELECT
USING (auth.uid() = user_id);