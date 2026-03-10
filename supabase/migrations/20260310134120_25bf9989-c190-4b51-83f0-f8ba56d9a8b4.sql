
CREATE TABLE public.label_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  left_zone_fields jsonb DEFAULT '["series.code","series.name","series.collection"]'::jsonb,
  header_template text DEFAULT '{TYPE} | Zam: {ORDER}',
  left_zone_width numeric DEFAULT 16,
  series_code_size numeric DEFAULT 18,
  series_name_size numeric DEFAULT 9,
  series_collection_size numeric DEFAULT 7,
  content_max_size numeric DEFAULT 14,
  content_min_size numeric DEFAULT 7,
  updated_at timestamptz DEFAULT now()
);

INSERT INTO public.label_settings DEFAULT VALUES;

ALTER TABLE public.label_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read label_settings"
ON public.label_settings FOR SELECT TO authenticated
USING (true);

CREATE POLICY "Admins can update label_settings"
ON public.label_settings FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert label_settings"
ON public.label_settings FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
