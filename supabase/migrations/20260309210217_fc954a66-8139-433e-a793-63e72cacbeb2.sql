ALTER TABLE public.pillows ADD COLUMN IF NOT EXISTS construction_type TEXT;
ALTER TABLE public.backrests ADD COLUMN IF NOT EXISTS spring_type TEXT;
ALTER TABLE public.backrests ADD COLUMN IF NOT EXISTS sewing_notes TEXT;