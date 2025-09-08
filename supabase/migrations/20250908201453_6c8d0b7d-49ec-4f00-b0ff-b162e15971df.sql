-- Fix security warning: set search_path for function
DROP FUNCTION IF EXISTS update_seo_settings_updated_at();

CREATE OR REPLACE FUNCTION update_seo_settings_updated_at()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;