-- Add unique constraint on platform column for ad_platforms table
ALTER TABLE public.ad_platforms 
ADD CONSTRAINT ad_platforms_platform_key UNIQUE (platform);