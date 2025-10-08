-- Phase 6: Add admin WhatsApp number to store settings
ALTER TABLE public.store_settings 
ADD COLUMN IF NOT EXISTS admin_whatsapp text;