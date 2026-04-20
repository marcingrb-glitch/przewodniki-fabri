-- Pufa V2: single source of truth
--
-- Do tej pory seedowane były 3 rekordy pufy w `label_templates_v2`:
--   1) product_type='pufa', series_id=NULL, sheet_name='PUFA'  (canonical)
--   2) product_type='sofa',     sheet_name='PUFA (do sofy)'     (kopia sekcji z #1)
--   3) product_type='naroznik', sheet_name='PUFA (do narożnika)' (kopia sekcji z #1)
--
-- Problem: edycja canonical pufy (#1) nie propagowała się do kopii — user musiał
-- edytować 3× ręcznie.
--
-- Rozwiązanie: usuwamy kopie (#2, #3). Generator V2 (fetchSheets w labelsV2.ts)
-- dla productType='sofa'|'naroznik' dodatkowo fetchuje canonical pufę i dodaje ją
-- z warunkiem `extras_pufa_fotel`.

DELETE FROM public.label_templates_v2
WHERE series_id IS NULL
  AND sheet_name IN ('PUFA (do sofy)', 'PUFA (do narożnika)')
  AND product_type IN ('sofa', 'naroznik');
