-- Ensure RLS is enabled on payment_gateways
ALTER TABLE public.payment_gateways ENABLE ROW LEVEL SECURITY;

-- Allow anonymous (unauthenticated) users to view active payment gateways
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'payment_gateways' 
      AND policyname = 'Public can view active payment gateways'
  ) THEN
    CREATE POLICY "Public can view active payment gateways"
    ON public.payment_gateways
    FOR SELECT
    TO anon
    USING (is_active = true);
  END IF;
END$$;
