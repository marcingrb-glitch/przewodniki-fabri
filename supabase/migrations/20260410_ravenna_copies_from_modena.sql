-- N2-SZ-1 zostaje tylko jako Modena (bez copies_from)
UPDATE products
SET properties = (properties - 'copies_from') || '{"model_name": "Modena"}'::jsonb
WHERE code = 'N2-SZ-1' AND category = 'chaise';

-- N2-SZ-2: Ravenna jako kopia modelu Modena (N2-SZ-1)
UPDATE products
SET properties = properties || '{"model_name": "Ravenna", "copies_from": "N2-SZ-1"}'::jsonb,
    name = 'Szezlong Ravenna'
WHERE code = 'N2-SZ-2' AND category = 'chaise';
