-- Add store_logo column to store_settings table
ALTER TABLE public.store_settings 
ADD COLUMN store_logo TEXT;