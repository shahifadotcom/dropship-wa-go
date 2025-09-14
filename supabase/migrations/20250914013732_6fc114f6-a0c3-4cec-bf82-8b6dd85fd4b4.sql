-- Fix the OAuth client generation function
CREATE OR REPLACE FUNCTION public.generate_oauth_client(
  p_name TEXT,
  p_description TEXT DEFAULT NULL,
  p_redirect_uris TEXT[] DEFAULT '{}',
  p_scopes TEXT[] DEFAULT '{}'
)
RETURNS TABLE(client_id TEXT, client_secret TEXT, id UUID)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_client_id TEXT;
  new_client_secret TEXT;
  new_id UUID;
BEGIN
  -- Generate secure client ID and secret using available PostgreSQL functions
  new_client_id := 'oauth_' || replace(gen_random_uuid()::text, '-', '');
  new_client_secret := encode(decode(replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', ''), 'hex'), 'base64');
  
  -- Insert the new OAuth client
  INSERT INTO public.oauth_clients (
    client_id, 
    client_secret, 
    name, 
    description, 
    redirect_uris, 
    scopes,
    created_by
  )
  VALUES (
    new_client_id,
    new_client_secret,
    p_name,
    p_description,
    p_redirect_uris,
    p_scopes,
    auth.uid()
  )
  RETURNING oauth_clients.id INTO new_id;
  
  RETURN QUERY SELECT new_client_id, new_client_secret, new_id;
END;
$$;