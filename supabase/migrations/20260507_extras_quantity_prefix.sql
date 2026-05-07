-- 2XFT support: opcjonalny prefix \d+X przed kodem extra (np. 2XFT = 2 fotele).
-- Capture group 1 = prefix ilości (np. "2X"), group 2 = kod (PF|PFO|FT).
UPDATE sku_segments
SET regex_pattern = '^(\d+X)?(PF|PFO|FT)$',
    capture_groups = '{"code": 2, "quantity": 1}'::jsonb,
    notes = 'Extra (opcjonalny): PF=pufa, PFO=pufa otwierana, FT=fotel. Opcjonalny prefix ilości np. 2XFT.'
WHERE segment_name = 'extra';
