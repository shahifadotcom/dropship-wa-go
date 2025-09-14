-- Fix critical security vulnerability in vendors table
-- Issue: API credentials are accessible to unauthenticated users

-- Drop existing permissive policies and create restrictive ones
DROP POLICY IF EXISTS "Only admins can manage vendors" ON public.vendors;
DROP POLICY IF EXISTS "Only admins can view vendor credentials" ON public.vendors;

-- Create restrictive policies that deny all access by default
-- Only authenticated admin users can access vendor data
CREATE POLICY "Deny all access by default" 
ON public.vendors 
FOR ALL 
TO public 
USING (false) 
WITH CHECK (false);

-- Allow only authenticated admin users to view vendor data
CREATE POLICY "Authenticated admins can view vendors" 
ON public.vendors 
FOR SELECT 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 
    FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'::app_role
  )
);

-- Allow only authenticated admin users to insert vendor data
CREATE POLICY "Authenticated admins can insert vendors" 
ON public.vendors 
FOR INSERT 
TO authenticated 
WITH CHECK (
  EXISTS (
    SELECT 1 
    FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'::app_role
  )
);

-- Allow only authenticated admin users to update vendor data
CREATE POLICY "Authenticated admins can update vendors" 
ON public.vendors 
FOR UPDATE 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 
    FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'::app_role
  )
) 
WITH CHECK (
  EXISTS (
    SELECT 1 
    FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'::app_role
  )
);

-- Allow only authenticated admin users to delete vendor data
CREATE POLICY "Authenticated admins can delete vendors" 
ON public.vendors 
FOR DELETE 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 
    FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'::app_role
  )
);

-- Add comment to document the security fix
COMMENT ON TABLE public.vendors IS 'Contains sensitive API credentials - access restricted to authenticated admin users only';