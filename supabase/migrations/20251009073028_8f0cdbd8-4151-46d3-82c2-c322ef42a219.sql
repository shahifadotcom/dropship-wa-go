-- Add favicon_url column to store_settings table
ALTER TABLE store_settings ADD COLUMN IF NOT EXISTS favicon_url TEXT;