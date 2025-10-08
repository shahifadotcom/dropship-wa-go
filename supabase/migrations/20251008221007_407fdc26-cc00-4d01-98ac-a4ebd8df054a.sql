-- Add policy to allow public read access to store settings
CREATE POLICY "Public can view store settings"
ON public.store_settings
FOR SELECT
TO public
USING (true);