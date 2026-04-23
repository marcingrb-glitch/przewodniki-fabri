-- N2: header_template identyczny jak S1/S2: "SOFA {collection} [{code}]"
-- Dla N2: "NAROŻNIK {collection} [{code}]". Usuwamy orientation z headera
-- (jesli bedzie potrzebna, dodamy w section title analogicznie do {width}).

UPDATE public.label_templates_v2 t
SET header_template = 'NAROŻNIK {series.collection} [{series.code}]'
FROM public.products p
WHERE p.id = t.series_id
  AND p.code = 'N2'
  AND t.product_type = 'naroznik';
