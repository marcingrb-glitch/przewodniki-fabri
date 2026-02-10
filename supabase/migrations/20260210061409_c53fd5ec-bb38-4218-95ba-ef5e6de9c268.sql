
CREATE TABLE public.variant_images (
  shortcode TEXT NOT NULL PRIMARY KEY,
  image_url TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.variant_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read variant_images"
ON public.variant_images
FOR SELECT
TO authenticated
USING (true);
