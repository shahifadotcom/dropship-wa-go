-- Reviews approval system
-- Add status and moderation fields to product_reviews
ALTER TABLE public.product_reviews
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS approved_by UUID NULL,
  ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ NULL;

-- Index to speed up public fetches
CREATE INDEX IF NOT EXISTS idx_product_reviews_product_status
  ON public.product_reviews (product_id, status);

-- Drop old policy if it exists
DROP POLICY IF EXISTS "Anyone can read product reviews" ON public.product_reviews;

-- Allow public to read only approved reviews
CREATE POLICY "Anyone can read approved product reviews"
ON public.product_reviews
FOR SELECT
USING (status = 'approved');

-- Add admin manage policy for moderation (drop first to avoid conflicts)
DROP POLICY IF EXISTS "Admins can manage product reviews" ON public.product_reviews;

CREATE POLICY "Admins can manage product reviews"
ON public.product_reviews
FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- Remove OTP rate limit by dropping the function
DROP FUNCTION IF EXISTS public.check_otp_rate_limit(text) CASCADE;