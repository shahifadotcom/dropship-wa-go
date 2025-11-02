-- Allow public read access to active Binance Pay configuration for guest checkout
CREATE POLICY "Public can view active Binance config"
  ON public.binance_config
  FOR SELECT
  USING (is_active = true);