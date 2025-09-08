-- Add RLS policies for product management
-- Allow authenticated users to insert products (admin functionality)
CREATE POLICY "Allow product management for authenticated users" 
ON public.products 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

-- Allow authenticated users to update products (admin functionality)  
CREATE POLICY "Allow product updates for authenticated users"
ON public.products
FOR UPDATE 
USING (auth.uid() IS NOT NULL);

-- Allow authenticated users to delete products (admin functionality)
CREATE POLICY "Allow product deletion for authenticated users"
ON public.products
FOR DELETE
USING (auth.uid() IS NOT NULL);