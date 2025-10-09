-- Update the OTP rate limit check function to allow unlimited attempts
CREATE OR REPLACE FUNCTION public.check_otp_rate_limit(p_phone_number text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Always return true to allow unlimited OTP attempts
  RETURN true;
END;
$function$;