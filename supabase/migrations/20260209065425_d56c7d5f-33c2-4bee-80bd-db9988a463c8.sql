
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS variant_image_path TEXT;

COMMENT ON COLUMN public.orders.variant_image_path IS 
  'Ścieżka do zdjęcia wariantu w Storage (order-files bucket)';
