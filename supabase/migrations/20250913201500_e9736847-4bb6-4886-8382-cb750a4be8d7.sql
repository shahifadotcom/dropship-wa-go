-- Add missing oauth_state column to cj_dropshipping_connections
ALTER TABLE public.cj_dropshipping_connections 
ADD COLUMN oauth_state TEXT;