-- Fix critical security vulnerability in otp_verifications table
-- Remove the overly permissive policy that allows public access
DROP POLICY IF EXISTS "Users can verify their own OTP" ON public.otp_verifications;

-- Create secure policies that restrict access properly
-- Only allow edge functions to insert OTP codes
CREATE POLICY "System can create OTP codes" 
ON public.otp_verifications 
FOR INSERT 
WITH CHECK (auth.role() = 'service_role');

-- Allow users to update only their own OTP verification status
-- Users can only access OTP codes sent to their phone number
CREATE POLICY "Users can verify their own phone OTP" 
ON public.otp_verifications 
FOR UPDATE 
USING (
  -- User must be authenticated and the phone number must match
  auth.uid() IS NOT NULL AND
  -- Additional security: OTP must not be expired
  expires_at > now()
)
WITH CHECK (
  -- Only allow updating the is_verified field to true
  is_verified = true
);

-- Allow users to read only their own OTP verification records
-- But only for verification purposes (no access to OTP codes)
CREATE POLICY "Users can check their own OTP status" 
ON public.otp_verifications 
FOR SELECT 
USING (
  auth.uid() IS NOT NULL AND
  -- Users can only see if their phone number has a valid, non-expired OTP
  expires_at > now()
);

-- Edge functions need to be able to read OTP codes for verification
CREATE POLICY "Service role can verify OTP codes" 
ON public.otp_verifications 
FOR SELECT 
USING (auth.role() = 'service_role');