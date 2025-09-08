-- Add SEO and additional cost fields to products table
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS meta_title TEXT,
ADD COLUMN IF NOT EXISTS meta_description TEXT,
ADD COLUMN IF NOT EXISTS social_preview_image TEXT,
ADD COLUMN IF NOT EXISTS cost_price NUMERIC,
ADD COLUMN IF NOT EXISTS shipping_cost NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS tax_rate NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS weight NUMERIC,
ADD COLUMN IF NOT EXISTS dimensions JSONB,
ADD COLUMN IF NOT EXISTS slug TEXT;

-- Create unique index on slug for SEO-friendly URLs
CREATE UNIQUE INDEX IF NOT EXISTS idx_products_slug ON public.products(slug);

-- Create storage bucket for product images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for product images
DO $$
BEGIN
    -- Policy for public viewing of product images
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'objects' 
        AND policyname = 'Product images are publicly accessible'
    ) THEN
        CREATE POLICY "Product images are publicly accessible" 
        ON storage.objects 
        FOR SELECT 
        USING (bucket_id = 'product-images');
    END IF;

    -- Policy for admin uploads
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'objects' 
        AND policyname = 'Admins can upload product images'
    ) THEN
        CREATE POLICY "Admins can upload product images" 
        ON storage.objects 
        FOR INSERT 
        WITH CHECK (bucket_id = 'product-images');
    END IF;

    -- Policy for admin updates
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'objects' 
        AND policyname = 'Admins can update product images'
    ) THEN
        CREATE POLICY "Admins can update product images" 
        ON storage.objects 
        FOR UPDATE 
        USING (bucket_id = 'product-images');
    END IF;

    -- Policy for admin deletes
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'objects' 
        AND policyname = 'Admins can delete product images'
    ) THEN
        CREATE POLICY "Admins can delete product images" 
        ON storage.objects 
        FOR DELETE 
        USING (bucket_id = 'product-images');
    END IF;
END
$$;