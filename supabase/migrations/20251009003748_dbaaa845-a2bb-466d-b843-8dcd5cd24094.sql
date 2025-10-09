-- Add missing payment_method column to orders to fix edge function insert errors
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS payment_method text;