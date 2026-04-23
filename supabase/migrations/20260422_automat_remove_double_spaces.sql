-- Automat names: wyczysc podwojne spacje w `name`.
-- "Automat  Zwykły" -> "Automat Zwykły"

UPDATE public.products
SET name = regexp_replace(name, '\s+', ' ', 'g'),
    updated_at = now()
WHERE category = 'automat'
  AND name ~ '\s{2,}';
