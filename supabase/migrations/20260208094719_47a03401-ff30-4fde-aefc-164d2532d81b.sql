
-- 1. SERIES
CREATE TABLE public.series (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  collection TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.series ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read series" ON public.series FOR SELECT USING (true);
CREATE POLICY "Anyone can insert series" ON public.series FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update series" ON public.series FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete series" ON public.series FOR DELETE USING (true);

-- 2. FABRICS
CREATE TABLE public.fabrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  price_group INTEGER NOT NULL DEFAULT 1,
  colors JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.fabrics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read fabrics" ON public.fabrics FOR SELECT USING (true);
CREATE POLICY "Anyone can insert fabrics" ON public.fabrics FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update fabrics" ON public.fabrics FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete fabrics" ON public.fabrics FOR DELETE USING (true);

-- 3. CHESTS
CREATE TABLE public.chests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  leg_height_cm NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.chests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read chests" ON public.chests FOR SELECT USING (true);
CREATE POLICY "Anyone can insert chests" ON public.chests FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update chests" ON public.chests FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete chests" ON public.chests FOR DELETE USING (true);

-- 4. AUTOMATS
CREATE TABLE public.automats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  type TEXT,
  has_seat_legs BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.automats ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read automats" ON public.automats FOR SELECT USING (true);
CREATE POLICY "Anyone can insert automats" ON public.automats FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update automats" ON public.automats FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete automats" ON public.automats FOR DELETE USING (true);

-- 5. PILLOWS
CREATE TABLE public.pillows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.pillows ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read pillows" ON public.pillows FOR SELECT USING (true);
CREATE POLICY "Anyone can insert pillows" ON public.pillows FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update pillows" ON public.pillows FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete pillows" ON public.pillows FOR DELETE USING (true);

-- 6. JASKIS
CREATE TABLE public.jaskis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.jaskis ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read jaskis" ON public.jaskis FOR SELECT USING (true);
CREATE POLICY "Anyone can insert jaskis" ON public.jaskis FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update jaskis" ON public.jaskis FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete jaskis" ON public.jaskis FOR DELETE USING (true);

-- 7. WALEKS
CREATE TABLE public.waleks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.waleks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read waleks" ON public.waleks FOR SELECT USING (true);
CREATE POLICY "Anyone can insert waleks" ON public.waleks FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update waleks" ON public.waleks FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete waleks" ON public.waleks FOR DELETE USING (true);

-- 8. FINISHES
CREATE TABLE public.finishes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.finishes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read finishes" ON public.finishes FOR SELECT USING (true);
CREATE POLICY "Anyone can insert finishes" ON public.finishes FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update finishes" ON public.finishes FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete finishes" ON public.finishes FOR DELETE USING (true);

-- 9. SEATS_SOFA (series-specific)
CREATE TABLE public.seats_sofa (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  series_id UUID NOT NULL REFERENCES public.series(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  type TEXT,
  frame TEXT,
  foam TEXT,
  front TEXT,
  center_strip BOOLEAN NOT NULL DEFAULT false,
  default_finish TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(series_id, code)
);
ALTER TABLE public.seats_sofa ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read seats_sofa" ON public.seats_sofa FOR SELECT USING (true);
CREATE POLICY "Anyone can insert seats_sofa" ON public.seats_sofa FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update seats_sofa" ON public.seats_sofa FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete seats_sofa" ON public.seats_sofa FOR DELETE USING (true);

-- 10. SEATS_PUFA (series-specific)
CREATE TABLE public.seats_pufa (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  series_id UUID NOT NULL REFERENCES public.series(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  front_back TEXT,
  sides TEXT,
  base_foam TEXT,
  box_height TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(series_id, code)
);
ALTER TABLE public.seats_pufa ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read seats_pufa" ON public.seats_pufa FOR SELECT USING (true);
CREATE POLICY "Anyone can insert seats_pufa" ON public.seats_pufa FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update seats_pufa" ON public.seats_pufa FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete seats_pufa" ON public.seats_pufa FOR DELETE USING (true);

-- 11. BACKRESTS (series-specific)
CREATE TABLE public.backrests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  series_id UUID NOT NULL REFERENCES public.series(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  height_cm TEXT,
  frame TEXT,
  foam TEXT,
  top TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(series_id, code)
);
ALTER TABLE public.backrests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read backrests" ON public.backrests FOR SELECT USING (true);
CREATE POLICY "Anyone can insert backrests" ON public.backrests FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update backrests" ON public.backrests FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete backrests" ON public.backrests FOR DELETE USING (true);

-- 12. SIDES (series-specific)
CREATE TABLE public.sides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  series_id UUID NOT NULL REFERENCES public.series(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  frame TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(series_id, code)
);
ALTER TABLE public.sides ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read sides" ON public.sides FOR SELECT USING (true);
CREATE POLICY "Anyone can insert sides" ON public.sides FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update sides" ON public.sides FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete sides" ON public.sides FOR DELETE USING (true);

-- 13. LEGS (series-specific)
CREATE TABLE public.legs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  series_id UUID NOT NULL REFERENCES public.series(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  material TEXT,
  colors JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(series_id, code)
);
ALTER TABLE public.legs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read legs" ON public.legs FOR SELECT USING (true);
CREATE POLICY "Anyone can insert legs" ON public.legs FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update legs" ON public.legs FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete legs" ON public.legs FOR DELETE USING (true);

-- 14. EXTRAS (series-specific)
CREATE TABLE public.extras (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  series_id UUID NOT NULL REFERENCES public.series(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  type TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(series_id, code)
);
ALTER TABLE public.extras ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read extras" ON public.extras FOR SELECT USING (true);
CREATE POLICY "Anyone can insert extras" ON public.extras FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update extras" ON public.extras FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete extras" ON public.extras FOR DELETE USING (true);
