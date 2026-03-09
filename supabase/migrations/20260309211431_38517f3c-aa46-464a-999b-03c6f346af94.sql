CREATE TABLE public.sewing_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  series_id UUID NOT NULL REFERENCES public.series(id) ON DELETE CASCADE,
  component_type TEXT NOT NULL,
  component_code TEXT NOT NULL,
  variant_name TEXT NOT NULL,
  models TEXT[] NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.sewing_variants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read sewing_variants" ON public.sewing_variants FOR SELECT USING (true);
CREATE POLICY "Authenticated can insert sewing_variants" ON public.sewing_variants FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update sewing_variants" ON public.sewing_variants FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Admins can delete sewing_variants" ON public.sewing_variants FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));

ALTER TABLE public.backrests DROP COLUMN IF EXISTS sewing_notes;