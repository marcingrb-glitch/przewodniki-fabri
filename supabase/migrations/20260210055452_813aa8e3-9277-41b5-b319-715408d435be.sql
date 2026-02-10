
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS variant_image_url TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS mimeeq_shortcode TEXT;
