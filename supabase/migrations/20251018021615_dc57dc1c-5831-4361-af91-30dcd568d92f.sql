-- Create security definer function to get public store settings
CREATE OR REPLACE FUNCTION public.get_public_store_settings()
RETURNS TABLE (
  id uuid,
  store_name text,
  store_logo text,
  favicon_url text,
  store_tagline text,
  store_description text,
  currency text,
  created_at timestamp with time zone,
  updated_at timestamp with time zone
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    id,
    store_name,
    store_logo,
    favicon_url,
    store_tagline,
    store_description,
    currency,
    created_at,
    updated_at
  FROM public.store_settings
  ORDER BY created_at DESC
  LIMIT 1;
$$;