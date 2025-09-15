-- Fix RLS policy circular dependency for user roles

-- Drop the overly restrictive policy that prevents users from seeing their own roles
DROP POLICY IF EXISTS "Admin can view all user roles" ON public.user_roles;

-- Create new policies that allow users to view their own roles but restrict modifications
CREATE POLICY "Users can view their own roles" 
ON public.user_roles 
FOR SELECT 
USING (user_id = auth.uid());

-- Admins can view all roles
CREATE POLICY "Admins can view all user roles" 
ON public.user_roles 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.user_roles ur2 
  WHERE ur2.user_id = auth.uid() AND ur2.role = 'admin'::app_role
));

-- Update the role modification policies to be more specific
-- Keep the existing admin-only policies for INSERT, UPDATE, DELETE unchanged

-- Add debugging function to help troubleshoot role issues
CREATE OR REPLACE FUNCTION public.debug_user_roles(target_user_id UUID DEFAULT NULL)
RETURNS TABLE (
  user_id UUID,
  role app_role,
  assigned_at TIMESTAMPTZ,
  current_user_id UUID,
  is_admin BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ur.user_id,
    ur.role,
    ur.assigned_at,
    auth.uid() as current_user_id,
    EXISTS (
      SELECT 1 FROM public.user_roles ur2 
      WHERE ur2.user_id = auth.uid() AND ur2.role = 'admin'::app_role
    ) as is_admin
  FROM public.user_roles ur
  WHERE (target_user_id IS NULL OR ur.user_id = target_user_id)
    AND (ur.user_id = auth.uid() OR EXISTS (
      SELECT 1 FROM public.user_roles ur2 
      WHERE ur2.user_id = auth.uid() AND ur2.role = 'admin'::app_role
    ));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;