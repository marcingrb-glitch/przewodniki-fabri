
-- 1. Tabela reguł parsowania SKU per seria
CREATE TABLE public.sku_parse_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  series_id UUID NOT NULL REFERENCES public.series(id) ON DELETE CASCADE,
  component_type TEXT NOT NULL,
  zero_padded BOOLEAN DEFAULT TRUE,
  code_format TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(series_id, component_type)
);

-- 2. Tabela wyjątków boczków per seria
CREATE TABLE public.side_exceptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  series_id UUID NOT NULL REFERENCES public.series(id) ON DELETE CASCADE,
  original_code TEXT NOT NULL,
  mapped_code TEXT NOT NULL,
  description TEXT,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(series_id, original_code)
);

-- 3. Tabela typów siedzisk
CREATE TABLE public.seat_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. RLS — sku_parse_rules
ALTER TABLE public.sku_parse_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read sku_parse_rules"
  ON public.sku_parse_rules FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Admins can insert sku_parse_rules"
  ON public.sku_parse_rules FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update sku_parse_rules"
  ON public.sku_parse_rules FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete sku_parse_rules"
  ON public.sku_parse_rules FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- 5. RLS — side_exceptions
ALTER TABLE public.side_exceptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read side_exceptions"
  ON public.side_exceptions FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Admins can insert side_exceptions"
  ON public.side_exceptions FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update side_exceptions"
  ON public.side_exceptions FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete side_exceptions"
  ON public.side_exceptions FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- 6. RLS — seat_types
ALTER TABLE public.seat_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read seat_types"
  ON public.seat_types FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Admins can insert seat_types"
  ON public.seat_types FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update seat_types"
  ON public.seat_types FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete seat_types"
  ON public.seat_types FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- 7. Dane początkowe — wyjątki boczków S1
INSERT INTO public.side_exceptions (series_id, original_code, mapped_code, description)
SELECT s.id, 'B6WD', 'B6WC', 'Wyjątek legacy Shopify - boczek Iga A Wąska'
FROM public.series s WHERE s.code = 'S1';

INSERT INTO public.side_exceptions (series_id, original_code, mapped_code, description)
SELECT s.id, 'B6D', 'B6C', 'Wyjątek legacy Shopify - boczek Iga A'
FROM public.series s WHERE s.code = 'S1';

-- 8. Dane początkowe — typy siedzisk
INSERT INTO public.seat_types (code, name) VALUES
  ('N', 'Niskie'),
  ('ND', 'Niskie dzielone'),
  ('NB', 'Niskie oba półwałki'),
  ('W', 'Wysokie'),
  ('D', 'Zwykły'),
  ('', 'Standardowe');

-- 9. Reguły parsowania S1
INSERT INTO public.sku_parse_rules (series_id, component_type, zero_padded, notes)
SELECT s.id, 'seat', true, 'S1: SD01N, SD02ND - kody z zerem wiodącym'
FROM public.series s WHERE s.code = 'S1';

-- 10. Reguły parsowania S2
INSERT INTO public.sku_parse_rules (series_id, component_type, zero_padded, notes)
SELECT s.id, 'seat', false, 'S2: SD1, SD1D, SD4B - kompaktowe kody bez zera'
FROM public.series s WHERE s.code = 'S2';
