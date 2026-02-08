
-- Add default_finish column to tables that don't have it yet
ALTER TABLE public.backrests ADD COLUMN IF NOT EXISTS default_finish text;
ALTER TABLE public.sides ADD COLUMN IF NOT EXISTS default_finish text;
ALTER TABLE public.pillows ADD COLUMN IF NOT EXISTS default_finish text;

-- Create the sync function
CREATE OR REPLACE FUNCTION public.sync_default_finish()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.allowed_finishes IS NOT NULL AND array_length(NEW.allowed_finishes, 1) = 1 THEN
    NEW.default_finish := NEW.allowed_finishes[1];
  ELSE
    NEW.default_finish := NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Apply trigger to all 4 tables
CREATE TRIGGER sync_default_finish_seats_sofa
BEFORE INSERT OR UPDATE ON public.seats_sofa
FOR EACH ROW EXECUTE FUNCTION public.sync_default_finish();

CREATE TRIGGER sync_default_finish_backrests
BEFORE INSERT OR UPDATE ON public.backrests
FOR EACH ROW EXECUTE FUNCTION public.sync_default_finish();

CREATE TRIGGER sync_default_finish_sides
BEFORE INSERT OR UPDATE ON public.sides
FOR EACH ROW EXECUTE FUNCTION public.sync_default_finish();

CREATE TRIGGER sync_default_finish_pillows
BEFORE INSERT OR UPDATE ON public.pillows
FOR EACH ROW EXECUTE FUNCTION public.sync_default_finish();
