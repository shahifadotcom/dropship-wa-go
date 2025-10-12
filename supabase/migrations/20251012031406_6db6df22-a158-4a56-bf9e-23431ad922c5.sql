-- Phase 1: Binance Pay Manual Verification with Admin WhatsApp Notifications
-- Update binance_config table to support manual verification
ALTER TABLE binance_config ADD COLUMN IF NOT EXISTS verification_mode text DEFAULT 'manual' CHECK (verification_mode IN ('auto', 'manual'));
ALTER TABLE binance_config ADD COLUMN IF NOT EXISTS admin_whatsapp text;

-- Phase 7: Review Image Upload
-- Create storage bucket for review images
INSERT INTO storage.buckets (id, name, public)
VALUES ('review-images', 'review-images', true)
ON CONFLICT (id) DO NOTHING;

-- Add review_images column to product_reviews table
ALTER TABLE product_reviews ADD COLUMN IF NOT EXISTS review_images text[] DEFAULT '{}';

-- Create RLS policies for review images storage
CREATE POLICY "Anyone can view review images"
ON storage.objects FOR SELECT
USING (bucket_id = 'review-images');

CREATE POLICY "Authenticated users can upload review images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'review-images' AND
  auth.uid() IS NOT NULL
);

CREATE POLICY "Users can update their own review images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'review-images' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own review images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'review-images' AND
  auth.uid()::text = (storage.foldername(name))[1]
);