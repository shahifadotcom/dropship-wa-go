-- Ensure cj_credentials table exists with correct structure
CREATE TABLE IF NOT EXISTS public.cj_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  connection_id UUID NOT NULL UNIQUE REFERENCES public.cj_dropshipping_connections(id) ON DELETE CASCADE,
  client_secret TEXT NOT NULL,
  access_token TEXT,
  refresh_token TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.cj_credentials ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Service role can manage all credentials" ON public.cj_credentials;

-- Allow service role full access (needed for RPC functions)
CREATE POLICY "Service role can manage all credentials"
  ON public.cj_credentials
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Recreate store_cj_credentials function with better error handling
CREATE OR REPLACE FUNCTION public.store_cj_credentials(
  connection_id uuid, 
  client_secret text,
  access_token text DEFAULT NULL,
  refresh_token text DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO cj_credentials (connection_id, client_secret, access_token, refresh_token)
  VALUES (connection_id, client_secret, access_token, refresh_token)
  ON CONFLICT (connection_id) 
  DO UPDATE SET 
    client_secret = EXCLUDED.client_secret,
    access_token = COALESCE(EXCLUDED.access_token, cj_credentials.access_token),
    refresh_token = COALESCE(EXCLUDED.refresh_token, cj_credentials.refresh_token),
    updated_at = now();
  
  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    RAISE LOG 'Error storing CJ credentials: %', SQLERRM;
    RETURN FALSE;
END;
$$;

-- Update the has_credentials trigger to set the flag correctly
CREATE OR REPLACE FUNCTION public.sync_cj_has_credentials()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    UPDATE cj_dropshipping_connections
    SET has_credentials = true
    WHERE id = NEW.connection_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE cj_dropshipping_connections
    SET has_credentials = false
    WHERE id = OLD.connection_id;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS sync_cj_has_credentials_trigger ON public.cj_credentials;
CREATE TRIGGER sync_cj_has_credentials_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.cj_credentials
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_cj_has_credentials();