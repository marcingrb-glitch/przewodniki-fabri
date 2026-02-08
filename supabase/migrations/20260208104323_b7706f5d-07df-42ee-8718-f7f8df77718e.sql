-- Constraint: kod nie może być bazowym kodem siedziska + suffix A/B/C (wykończenie)
-- SD01N, SD02N, SD03, SD04 + A/B/C to błąd, ale SD01ND, SD02ND to poprawne kody typu
ALTER TABLE public.seats_pufa ADD CONSTRAINT check_no_finish_suffix 
CHECK (code !~ '^SD\d{2}[NW]?[ABC]$');