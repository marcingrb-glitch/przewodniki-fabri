
-- Series: seat leg defaults
ALTER TABLE public.series ADD COLUMN seat_leg_default boolean DEFAULT false;
ALTER TABLE public.series ADD COLUMN seat_leg_height_cm numeric DEFAULT NULL;
ALTER TABLE public.series ADD COLUMN seat_leg_count integer DEFAULT NULL;

-- Automats: seat leg dimensions
ALTER TABLE public.automats ADD COLUMN seat_leg_height_cm numeric DEFAULT 0;
ALTER TABLE public.automats ADD COLUMN seat_leg_count integer DEFAULT 0;
