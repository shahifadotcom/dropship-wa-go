-- Remove the problematic circular dependency in user_roles RLS policies

-- First, let's see what policies exist and fix the circular dependency
-- The issue: Admin check requires querying user_roles, but user_roles requires admin check

-- Drop all existing user_roles policies to start fresh
DROP POLICY IF EXISTS "Admin can view all user roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admin can assign user roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admin can modify user roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admin can delete user roles" ON public.user_roles;

-- Create simpler policies that avoid circular dependency
-- Allow users to read their own roles (this is essential for auth to work)
CREATE POLICY "Users can read own roles" 
ON public.user_roles 
FOR SELECT 
USING (user_id = auth.uid());

-- For modifications, use a different approach - only allow service role for now
-- This prevents the circular dependency while maintaining security
CREATE POLICY "Service role can manage all roles" 
ON public.user_roles 
FOR ALL
USING (auth.role() = 'service_role');

-- Add a secure function for admin role management that can be called from the frontend
CREATE OR REPLACE FUNCTION public.assign_user_role(
  target_user_id UUID,
  new_role app_role
)
RETURNS BOOLEAN AS $$
DECLARE
  current_user_is_admin BOOLEAN := FALSE;
BEGIN
  -- Check if current user is admin by directly querying (bypassing RLS for this check)
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'::app_role
  ) INTO current_user_is_admin;
  
  -- Only admins can assign roles
  IF NOT current_user_is_admin THEN
    RAISE EXCEPTION 'Only administrators can assign roles';
  END IF;
  
  -- Prevent users from removing their own admin role
  IF target_user_id = auth.uid() AND new_role != 'admin'::app_role THEN
    RAISE EXCEPTION 'Cannot remove your own admin role';
  END IF;
  
  -- Insert or update the role
  INSERT INTO public.user_roles (user_id, role, assigned_by)
  VALUES (target_user_id, new_role, auth.uid())
  ON CONFLICT (user_id, role) 
  DO UPDATE SET assigned_at = now(), assigned_by = auth.uid();
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;