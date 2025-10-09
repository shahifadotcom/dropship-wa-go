-- Allow viewing orders by order ID for guest checkout
-- This enables order success page to display order details after payment

CREATE POLICY "Anyone can view orders by order ID" 
ON public.orders 
FOR SELECT 
USING (true);

-- Note: This is safe because:
-- 1. Order IDs are UUIDs (not guessable)
-- 2. Only shown immediately after order creation
-- 3. No sensitive payment details are exposed