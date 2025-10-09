-- Add additional fields for Google OAuth connection tracking
ALTER TABLE public.google_services_config 
ADD COLUMN IF NOT EXISTS token_expiry TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS connected_email TEXT;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_google_services_service_name ON public.google_services_config(service_name);