-- Fix security definer view warning by recreating without SECURITY DEFINER
DROP VIEW IF EXISTS public.store_settings_public CASCADE;

CREATE VIEW public.store_settings_public 
WITH (security_invoker = true)
AS
SELECT 
  id,
  store_name,
  store_tagline,
  store_description,
  store_logo,
  favicon_url,
  currency,
  created_at,
  updated_at
FROM public.store_settings;

GRANT SELECT ON public.store_settings_public TO anon, authenticated;

-- Fix function search_path warnings for existing functions
-- Update update_updated_at_column function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

-- Update handle_new_user function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
  INSERT INTO public.profiles (id, email, first_name, last_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'first_name', NEW.raw_user_meta_data->>'last_name');
  RETURN NEW;
END;
$function$;