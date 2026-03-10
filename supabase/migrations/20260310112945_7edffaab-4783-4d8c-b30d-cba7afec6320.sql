
CREATE TABLE public.label_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_type text NOT NULL,
  label_name text NOT NULL,
  component text NOT NULL,
  content_template text NOT NULL,
  quantity integer NOT NULL DEFAULT 1,
  sort_order integer NOT NULL DEFAULT 0,
  is_conditional boolean NOT NULL DEFAULT false,
  condition_field text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.label_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can insert label_templates" ON public.label_templates FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update label_templates" ON public.label_templates FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete label_templates" ON public.label_templates FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Authenticated can read label_templates" ON public.label_templates FOR SELECT TO authenticated USING (true);
