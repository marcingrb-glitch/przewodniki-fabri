-- =============================================
-- ETAP 1: Nowe tabele dla specyfikacji produktów
-- =============================================

-- 1. product_foams
CREATE TABLE public.product_foams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  series_id UUID NOT NULL REFERENCES public.series(id) ON DELETE CASCADE,
  seat_code TEXT NOT NULL,
  component TEXT NOT NULL,
  position_number INTEGER DEFAULT 1,
  name TEXT,
  height NUMERIC,
  width NUMERIC,
  length NUMERIC,
  material TEXT,
  quantity INTEGER DEFAULT 1,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.product_foams ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read product_foams" ON public.product_foams FOR SELECT USING (true);
CREATE POLICY "Authenticated can insert product_foams" ON public.product_foams FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update product_foams" ON public.product_foams FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Admins can delete product_foams" ON public.product_foams FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));

-- 2. seat_side_compatibility
CREATE TABLE public.seat_side_compatibility (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  series_id UUID NOT NULL REFERENCES public.series(id) ON DELETE CASCADE,
  seat_code TEXT NOT NULL,
  side_code TEXT NOT NULL,
  compatible BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(series_id, seat_code, side_code)
);

ALTER TABLE public.seat_side_compatibility ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read seat_side_compatibility" ON public.seat_side_compatibility FOR SELECT USING (true);
CREATE POLICY "Admins can insert seat_side_compatibility" ON public.seat_side_compatibility FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update seat_side_compatibility" ON public.seat_side_compatibility FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete seat_side_compatibility" ON public.seat_side_compatibility FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));

-- 3. series_config
CREATE TABLE public.series_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  series_id UUID NOT NULL REFERENCES public.series(id) ON DELETE CASCADE UNIQUE,
  default_spring TEXT DEFAULT 'B',
  spring_exceptions JSONB DEFAULT '[]'::jsonb,
  fixed_backrest TEXT,
  fixed_chest TEXT,
  fixed_automat TEXT,
  seat_leg_type TEXT DEFAULT 'from_sku',
  seat_leg_height_cm NUMERIC,
  pufa_leg_type TEXT DEFAULT 'from_sku',
  pufa_leg_height_cm NUMERIC DEFAULT 15,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.series_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read series_config" ON public.series_config FOR SELECT USING (true);
CREATE POLICY "Admins can insert series_config" ON public.series_config FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update series_config" ON public.series_config FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete series_config" ON public.series_config FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));

-- 4. seat_pillow_mapping
CREATE TABLE public.seat_pillow_mapping (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  series_id UUID NOT NULL REFERENCES public.series(id) ON DELETE CASCADE,
  seat_code TEXT NOT NULL,
  pillow_code TEXT NOT NULL,
  pillow_finish TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(series_id, seat_code)
);

ALTER TABLE public.seat_pillow_mapping ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read seat_pillow_mapping" ON public.seat_pillow_mapping FOR SELECT USING (true);
CREATE POLICY "Admins can insert seat_pillow_mapping" ON public.seat_pillow_mapping FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update seat_pillow_mapping" ON public.seat_pillow_mapping FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete seat_pillow_mapping" ON public.seat_pillow_mapping FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));

-- 5. Nowe kolumny w seats_sofa
ALTER TABLE public.seats_sofa ADD COLUMN IF NOT EXISTS model_name TEXT;
ALTER TABLE public.seats_sofa ADD COLUMN IF NOT EXISTS frame_modification TEXT;
ALTER TABLE public.seats_sofa ADD COLUMN IF NOT EXISTS spring_type TEXT DEFAULT 'B';