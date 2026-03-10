CREATE TABLE public.guide_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  font_size_header numeric DEFAULT 11,
  font_size_table numeric DEFAULT 9,
  table_row_height numeric DEFAULT 8,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.guide_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read guide_settings" ON public.guide_settings FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can update guide_settings" ON public.guide_settings FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can insert guide_settings" ON public.guide_settings FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

INSERT INTO public.guide_settings (font_size_header, font_size_table, table_row_height) VALUES (11, 9, 8);