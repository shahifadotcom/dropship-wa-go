-- Create trigger to auto-sync store_settings to store_settings_public
CREATE OR REPLACE FUNCTION public.sync_store_settings_public()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Upsert to store_settings_public view (sync public fields)
  INSERT INTO public.store_settings_public (
    id, 
    store_name, 
    store_logo, 
    favicon_url, 
    store_tagline, 
    store_description, 
    currency,
    created_at,
    updated_at
  ) VALUES (
    NEW.id,
    NEW.store_name,
    NEW.store_logo,
    NEW.favicon_url,
    NEW.store_tagline,
    NEW.store_description,
    NEW.currency,
    NEW.created_at,
    NEW.updated_at
  )
  ON CONFLICT (id) DO UPDATE SET
    store_name = EXCLUDED.store_name,
    store_logo = EXCLUDED.store_logo,
    favicon_url = EXCLUDED.favicon_url,
    store_tagline = EXCLUDED.store_tagline,
    store_description = EXCLUDED.store_description,
    currency = EXCLUDED.currency,
    updated_at = EXCLUDED.updated_at;
  
  RETURN NEW;
END;
$$;

-- Drop trigger if it exists
DROP TRIGGER IF EXISTS sync_store_settings_trigger ON public.store_settings;

-- Create trigger on store_settings insert/update
CREATE TRIGGER sync_store_settings_trigger
AFTER INSERT OR UPDATE ON public.store_settings
FOR EACH ROW
EXECUTE FUNCTION public.sync_store_settings_public();