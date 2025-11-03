-- Allow public read access to store settings for guest users to see logo, etc.
CREATE POLICY "Public can view store settings"
  ON public.store_settings
  FOR SELECT
  USING (true);