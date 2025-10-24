-- Add country_id to storefront_sliders for country-specific sliders
ALTER TABLE public.storefront_sliders 
ADD COLUMN country_id UUID REFERENCES public.countries(id);

-- Add index for better query performance
CREATE INDEX idx_storefront_sliders_country ON public.storefront_sliders(country_id);

-- Add phone_number to profiles for customer tracking
ALTER TABLE public.profiles 
ADD COLUMN phone_number TEXT;