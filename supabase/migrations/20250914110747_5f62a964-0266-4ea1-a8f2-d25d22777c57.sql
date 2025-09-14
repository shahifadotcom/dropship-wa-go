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

-- Create function to safely store credentials when creating connections
CREATE OR REPLACE FUNCTION public.store_cj_credentials(
  connection_id UUID,
  client_secret TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO cj_credentials (connection_id, client_secret)
  VALUES (connection_id, client_secret)
  ON CONFLICT (connection_id) 
  DO UPDATE SET client_secret = EXCLUDED.client_secret, updated_at = now();
  
  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    RETURN FALSE;
END;
$$;

-- Only allow service role to execute this function
REVOKE EXECUTE ON FUNCTION public.store_cj_credentials FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.store_cj_credentials TO service_role;