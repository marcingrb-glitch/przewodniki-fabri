-- N2: show_meta_row=false (jak S2). Usuwa redundantne "190 cm" pod naglowkiem.

UPDATE public.label_templates_v2 t
SET show_meta_row = false
FROM public.products p
WHERE p.id = t.series_id
  AND p.code = 'N2'
  AND t.product_type = 'naroznik';
