
-- 1. Create junction table series_automats
CREATE TABLE public.series_automats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  series_id uuid NOT NULL REFERENCES public.series(id) ON DELETE CASCADE,
  automat_code text NOT NULL,
  has_seat_legs boolean NOT NULL DEFAULT false,
  seat_leg_height_cm numeric DEFAULT 0,
  seat_leg_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  UNIQUE(series_id, automat_code)
);

-- 2. Enable RLS
ALTER TABLE public.series_automats ENABLE ROW LEVEL SECURITY;

-- 3. RLS policies
CREATE POLICY "Admins can insert series_automats" ON public.series_automats FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update series_automats" ON public.series_automats FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete series_automats" ON public.series_automats FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Authenticated can read series_automats" ON public.series_automats FOR SELECT TO authenticated USING (true);

-- 4. Migrate existing data from automats to series_automats
INSERT INTO public.series_automats (series_id, automat_code, has_seat_legs, seat_leg_height_cm, seat_leg_count)
SELECT series_id, code, has_seat_legs, COALESCE(seat_leg_height_cm, 0), COALESCE(seat_leg_count, 0) FROM public.automats;

-- 5. Deduplicate automats (keep oldest per code)
DELETE FROM public.automats a USING public.automats b WHERE a.code = b.code AND a.created_at > b.created_at;

-- 6. Drop series-specific columns from automats
ALTER TABLE public.automats DROP CONSTRAINT IF EXISTS automats_series_id_fkey;
ALTER TABLE public.automats DROP COLUMN series_id;
ALTER TABLE public.automats DROP COLUMN has_seat_legs;
ALTER TABLE public.automats DROP COLUMN seat_leg_height_cm;
ALTER TABLE public.automats DROP COLUMN seat_leg_count;

-- 7. Add unique constraint on code
ALTER TABLE public.automats ADD CONSTRAINT automats_code_unique UNIQUE (code);

-- 8. FK from series_automats to automats
ALTER TABLE public.series_automats ADD CONSTRAINT series_automats_automat_code_fkey FOREIGN KEY (automat_code) REFERENCES public.automats(code);
