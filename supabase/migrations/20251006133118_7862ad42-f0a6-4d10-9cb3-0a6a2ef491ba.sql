-- Add support for multiple Gemini API keys
ALTER TABLE virtual_trial_config 
ADD COLUMN IF NOT EXISTS api_keys jsonb DEFAULT '[]'::jsonb;

COMMENT ON COLUMN virtual_trial_config.api_keys IS 'Array of Gemini API keys for load balancing and fallback';