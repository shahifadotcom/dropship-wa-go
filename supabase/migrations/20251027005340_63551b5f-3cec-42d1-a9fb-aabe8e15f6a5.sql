-- Allow admins to view all transaction verifications
CREATE POLICY "Admins can view all transaction verifications"
ON public.transaction_verifications
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'::app_role));