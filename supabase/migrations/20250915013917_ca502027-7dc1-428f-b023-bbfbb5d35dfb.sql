-- Create table for storefront image slider
CREATE TABLE public.storefront_sliders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  subtitle TEXT,
  image_url TEXT NOT NULL,
  link_url TEXT,
  button_text TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.storefront_sliders ENABLE ROW LEVEL SECURITY;

-- Create policies for storefront sliders
CREATE POLICY "Admin can manage storefront sliders" 
ON public.storefront_sliders 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Storefront sliders are publicly viewable" 
ON public.storefront_sliders 
FOR SELECT 
USING (is_active = true);

-- Create trigger for updated_at
CREATE TRIGGER update_storefront_sliders_updated_at
BEFORE UPDATE ON public.storefront_sliders
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();