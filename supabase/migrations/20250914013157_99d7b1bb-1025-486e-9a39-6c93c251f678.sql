-- Create OAuth clients table for managing API credentials
CREATE TABLE public.oauth_clients (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id TEXT NOT NULL UNIQUE,
  client_secret TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  redirect_uris TEXT[] DEFAULT '{}',
  scopes TEXT[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.oauth_clients ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Only admins can manage OAuth clients"
ON public.oauth_clients
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Create function to generate client credentials
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
  -- Generate secure client ID and secret
  new_client_id := 'oauth_' || encode(gen_random_bytes(16), 'hex');
  new_client_secret := encode(gen_random_bytes(32), 'base64');
  
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

-- Create trigger for updating timestamps
CREATE TRIGGER update_oauth_clients_updated_at
  BEFORE UPDATE ON public.oauth_clients
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();