-- Phase 1: Add balance tracking to payment gateways and transaction verifications

-- Add balance field to payment_gateways
ALTER TABLE public.payment_gateways 
ADD COLUMN IF NOT EXISTS balance numeric DEFAULT 0;

-- Add balance verification fields to transaction_verifications
ALTER TABLE public.transaction_verifications 
ADD COLUMN IF NOT EXISTS amount_sent numeric,
ADD COLUMN IF NOT EXISTS old_balance numeric,
ADD COLUMN IF NOT EXISTS new_balance numeric,
ADD COLUMN IF NOT EXISTS balance_verified boolean DEFAULT false;

-- Add balance verification fields to sms_transactions
ALTER TABLE public.sms_transactions 
ADD COLUMN IF NOT EXISTS new_balance numeric;

COMMENT ON COLUMN public.payment_gateways.balance IS 'Current available balance in this payment gateway wallet';
COMMENT ON COLUMN public.transaction_verifications.amount_sent IS 'Amount sent by customer';
COMMENT ON COLUMN public.transaction_verifications.old_balance IS 'Gateway balance before transaction';
COMMENT ON COLUMN public.transaction_verifications.new_balance IS 'Gateway balance after transaction (from SMS)';
COMMENT ON COLUMN public.transaction_verifications.balance_verified IS 'Whether balance calculation matches (old_balance + amount = new_balance)';