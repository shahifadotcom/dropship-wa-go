-- Add verification_mode to binance_config for manual/auto selection
ALTER TABLE public.binance_config
  ADD COLUMN IF NOT EXISTS verification_mode TEXT NOT NULL DEFAULT 'manual';

-- Add comment for clarity
COMMENT ON COLUMN public.binance_config.verification_mode IS 'Payment verification mode: manual (show ID and ask for transaction) or auto (API verification)';