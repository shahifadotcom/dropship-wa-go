-- Add SELECT policy for admins to view all product reviews including pending ones
CREATE POLICY "Admins can view all product reviews"
ON public.product_reviews
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'::app_role
  )
);