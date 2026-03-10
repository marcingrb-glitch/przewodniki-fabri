
CREATE TABLE public.guide_sections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_type text NOT NULL,
  series_id uuid REFERENCES public.series(id) ON DELETE CASCADE,
  section_name text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  is_conditional boolean NOT NULL DEFAULT false,
  condition_field text,
  columns jsonb NOT NULL DEFAULT '[]'::jsonb,
  enabled boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.guide_sections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can insert guide_sections" ON public.guide_sections FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update guide_sections" ON public.guide_sections FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete guide_sections" ON public.guide_sections FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Authenticated can read guide_sections" ON public.guide_sections FOR SELECT TO authenticated USING (true);
