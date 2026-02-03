-- Fix RLS for advance_payments table
-- Drop existing overly permissive policies if any
DROP POLICY IF EXISTS "Allow public read access" ON public.advance_payments;
DROP POLICY IF EXISTS "Allow public insert" ON public.advance_payments;
DROP POLICY IF EXISTS "Allow public update" ON public.advance_payments;
DROP POLICY IF EXISTS "Allow public delete" ON public.advance_payments;
DROP POLICY IF EXISTS "Allow authenticated read" ON public.advance_payments;
DROP POLICY IF EXISTS "Allow authenticated insert" ON public.advance_payments;

-- Enable RLS if not already enabled
ALTER TABLE public.advance_payments ENABLE ROW LEVEL SECURITY;

-- Create secure policies for advance_payments
-- Users can view their own payments through order ownership
CREATE POLICY "Users can view own payments via orders"
ON public.advance_payments
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.orders
    WHERE orders.id = advance_payments.order_id
    AND orders.customer_id = auth.uid()
  )
);

-- Admins can view all payments
CREATE POLICY "Admins can view all payments"
ON public.advance_payments
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Only admins can insert/update/delete payments
CREATE POLICY "Admins can insert payments"
ON public.advance_payments
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Admins can update payments"
ON public.advance_payments
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Admins can delete payments"
ON public.advance_payments
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Fix RLS for profiles table - ensure no anonymous access
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Anyone can view profiles" ON public.profiles;

-- Only allow users to view their own profile
CREATE POLICY "Users can view own profile"
ON public.profiles
FOR SELECT
USING (auth.uid() = id);

-- Admins can view all profiles
CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);