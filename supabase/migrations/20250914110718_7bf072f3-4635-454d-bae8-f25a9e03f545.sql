-- Create secure credentials storage table
CREATE TABLE public.cj_credentials (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  connection_id UUID NOT NULL UNIQUE,
  client_secret TEXT NOT NULL,
  access_token TEXT,
  refresh_token TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on credentials table
ALTER TABLE public.cj_credentials ENABLE ROW LEVEL SECURITY;

-- Only allow service role access to credentials (edge functions only)
CREATE POLICY "Only service role can access credentials"
ON public.cj_credentials
FOR ALL
USING (auth.role() = 'service_role');

-- Remove sensitive fields from public access in connections table
-- Update RLS policies to exclude sensitive credential fields
DROP POLICY IF EXISTS "Users can view their own CJ connections" ON public.cj_dropshipping_connections;

CREATE POLICY "Users can view their own CJ connections"
ON public.cj_dropshipping_connections
FOR SELECT
USING (auth.uid() = user_id);

-- Create a secure view for user-accessible connection data (excluding credentials)
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

-- Enable RLS on the safe view
ALTER VIEW public.cj_connections_safe SET (security_invoker = true);

-- Migrate existing credentials to secure table
INSERT INTO public.cj_credentials (connection_id, client_secret, access_token, refresh_token)
SELECT id, client_secret, access_token, refresh_token 
FROM public.cj_dropshipping_connections
WHERE client_secret IS NOT NULL;

-- Remove sensitive columns from connections table
ALTER TABLE public.cj_dropshipping_connections 
DROP COLUMN client_secret,
DROP COLUMN access_token,
DROP COLUMN refresh_token;

-- Create function for secure credential access (service role only)
CREATE OR REPLACE FUNCTION public.get_cj_credentials(connection_id UUID)
RETURNS TABLE(
  client_secret TEXT,
  access_token TEXT,
  refresh_token TEXT
)
LANGUAGE SQL
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT c.client_secret, c.access_token, c.refresh_token
  FROM cj_credentials c
  WHERE c.connection_id = $1;
$$;

-- Only allow service role to execute this function
REVOKE EXECUTE ON FUNCTION public.get_cj_credentials FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_cj_credentials TO service_role;

-- Create function to update credentials securely
CREATE OR REPLACE FUNCTION public.update_cj_credentials(
  connection_id UUID,
  new_access_token TEXT DEFAULT NULL,
  new_refresh_token TEXT DEFAULT NULL
)
RETURNS BOOLEAN
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

-- Only allow service role to execute this function
REVOKE EXECUTE ON FUNCTION public.update_cj_credentials FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.update_cj_credentials TO service_role;