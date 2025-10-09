-- Phase 1: Critical Security Fixes

-- 1. Add user_id to virtual_trial_sessions for proper ownership tracking
ALTER TABLE public.virtual_trial_sessions 
ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- 2. Drop existing overly permissive policies on store_settings
DROP POLICY IF EXISTS "Public can view store settings" ON public.store_settings;

-- 3. Fix advance_payments - users should only see their own
DROP POLICY IF EXISTS "Users can view their own advance payments" ON public.advance_payments;
CREATE POLICY "Users can view their own advance payments" ON public.advance_payments
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM orders 
    WHERE orders.id = advance_payments.order_id 
    AND orders.customer_id = auth.uid()
  )
);

-- 4. Fix virtual_trial_sessions - require user ownership
DROP POLICY IF EXISTS "Users can create virtual trial sessions" ON public.virtual_trial_sessions;
DROP POLICY IF EXISTS "Users can view virtual trial sessions" ON public.virtual_trial_sessions;

CREATE POLICY "Users can create their own virtual trial sessions" ON public.virtual_trial_sessions
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own virtual trial sessions" ON public.virtual_trial_sessions
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all virtual trial sessions" ON public.virtual_trial_sessions
FOR SELECT 
USING (public.has_role(auth.uid(), 'admin'));

-- 5. Add OTP rate limiting table
CREATE TABLE IF NOT EXISTS public.otp_rate_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_number text NOT NULL,
  window_start timestamp with time zone NOT NULL DEFAULT now(),
  attempt_count integer NOT NULL DEFAULT 1,
  last_attempt timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(phone_number, window_start)
);

ALTER TABLE public.otp_rate_limits ENABLE ROW LEVEL SECURITY;

-- Only service role can manage rate limits
CREATE POLICY "Service role can manage rate limits" ON public.otp_rate_limits
FOR ALL 
USING (auth.role() = 'service_role');

-- Function to check and update rate limits (max 5 attempts per hour)
CREATE OR REPLACE FUNCTION public.check_otp_rate_limit(p_phone_number text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_window timestamp with time zone;
  attempts integer;
BEGIN
  current_window := date_trunc('hour', now());
  
  -- Get current attempts in this window
  SELECT attempt_count INTO attempts
  FROM otp_rate_limits
  WHERE phone_number = p_phone_number 
    AND window_start = current_window;
  
  IF attempts IS NULL THEN
    -- First attempt in this window
    INSERT INTO otp_rate_limits (phone_number, window_start, attempt_count, last_attempt)
    VALUES (p_phone_number, current_window, 1, now());
    RETURN true;
  ELSIF attempts >= 5 THEN
    -- Rate limit exceeded
    RETURN false;
  ELSE
    -- Increment attempt count
    UPDATE otp_rate_limits
    SET attempt_count = attempt_count + 1,
        last_attempt = now()
    WHERE phone_number = p_phone_number 
      AND window_start = current_window;
    RETURN true;
  END IF;
END;
$$;

-- 6. Add SMS transaction authentication tracking
ALTER TABLE public.sms_transactions 
ADD COLUMN IF NOT EXISTS verified_source boolean DEFAULT false;

-- 7. Ensure user_roles has proper constraints
ALTER TABLE public.user_roles
DROP CONSTRAINT IF EXISTS user_roles_user_id_role_key;

ALTER TABLE public.user_roles
ADD CONSTRAINT user_roles_user_id_role_key UNIQUE (user_id, role);

-- 8. Add trigger to prevent direct role modifications
CREATE OR REPLACE FUNCTION public.prevent_direct_role_modification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only allow modifications through the assign_user_role function
  -- Check if the current user is calling through the function
  IF current_setting('role_assignment.in_progress', true) != 'true' THEN
    RAISE EXCEPTION 'Direct modifications to user_roles are not allowed. Use assign_user_role() function instead.';
  END IF;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_role_assignment_method ON public.user_roles;
CREATE TRIGGER enforce_role_assignment_method
  BEFORE INSERT OR UPDATE OR DELETE ON public.user_roles
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_direct_role_modification();

-- 9. Update assign_user_role to set the flag
CREATE OR REPLACE FUNCTION public.assign_user_role(target_user_id uuid, new_role app_role)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_user_is_admin BOOLEAN := FALSE;
BEGIN
  -- Check if current user is admin
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'::app_role
  ) INTO current_user_is_admin;
  
  IF NOT current_user_is_admin THEN
    RAISE EXCEPTION 'Only administrators can assign roles';
  END IF;
  
  -- Prevent users from removing their own admin role
  IF target_user_id = auth.uid() AND new_role != 'admin'::app_role THEN
    RAISE EXCEPTION 'Cannot remove your own admin role';
  END IF;
  
  -- Set flag to allow the modification
  PERFORM set_config('role_assignment.in_progress', 'true', true);
  
  -- Insert or update the role
  INSERT INTO public.user_roles (user_id, role, assigned_by)
  VALUES (target_user_id, new_role, auth.uid())
  ON CONFLICT (user_id, role) 
  DO UPDATE SET assigned_at = now(), assigned_by = auth.uid();
  
  -- Reset flag
  PERFORM set_config('role_assignment.in_progress', 'false', true);
  
  RETURN TRUE;
END;
$$;

-- 10. Add payment verification balance tracking
ALTER TABLE public.transaction_verifications
ADD COLUMN IF NOT EXISTS gateway_balance_before numeric,
ADD COLUMN IF NOT EXISTS gateway_balance_after numeric;