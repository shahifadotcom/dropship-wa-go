-- Add missing RLS policies for ip_ranges table to allow admin management
CREATE POLICY "Admin can manage IP ranges" 
ON public.ip_ranges 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
) 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);