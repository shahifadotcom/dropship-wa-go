-- Add admin_whatsapp field to store_settings if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'store_settings' 
    AND column_name = 'admin_whatsapp'
  ) THEN
    ALTER TABLE public.store_settings ADD COLUMN admin_whatsapp TEXT;
  END IF;
END $$;

-- Add comment
COMMENT ON COLUMN public.store_settings.admin_whatsapp IS 'Admin WhatsApp number for receiving notifications (e.g., low stock alerts)';
