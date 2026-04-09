-- Restrukturyzacja szezlongow N2: nowe kody (N2-SZ-1..5), stelaz siedziska + oparcia

-- SZ1-SZ4 (Modena, Ravenna, Sienna, Porto): oparcie N2-SZ-OP16
UPDATE products
SET
  code = 'N2-SZ-' || SUBSTRING(code FROM 3),
  properties = properties
    || '{"frame": "N2-SZ-SD", "backrest_frame": "N2-SZ-OP16"}'::jsonb
WHERE category = 'chaise'
  AND code IN ('SZ1','SZ2','SZ3','SZ4')
  AND series_id = (SELECT id FROM products WHERE code = 'N2' AND category = 'series');

-- SZ5 (Barga): oparcie N2-SZ-OP14
UPDATE products
SET
  code = 'N2-SZ-5',
  properties = properties
    || '{"frame": "N2-SZ-SD", "backrest_frame": "N2-SZ-OP14"}'::jsonb
WHERE category = 'chaise'
  AND code = 'SZ5'
  AND series_id = (SELECT id FROM products WHERE code = 'N2' AND category = 'series');
