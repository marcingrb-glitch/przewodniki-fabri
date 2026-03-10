

## Dodanie "Nadpisz dla tej serii" + ustawienia globalne przewodnika

### 1. Przycisk "Nadpisz dla tej serii" w GuideTemplates

Wzorowane na `LabelTemplates.copyForSeriesMutation` — gdy użytkownik wybierze konkretną serię i nie ma jeszcze nadpisań:
- Pokazać przycisk "Nadpisz dla tej serii" (ikona Copy)
- Po kliknięciu: skopiować wszystkie globalne sekcje (`series_id === null`) dla danego `product_type` do nowych rekordów z `series_id` ustawionym na wybraną serię

**Plik:** `src/pages/AdminPanel/GuideTemplates.tsx`
- Dodać `copyForSeriesMutation` (analogicznie do etykiet)
- Dodać helper `hasSeriesOverride(productType, seriesId)` 
- Renderować przycisk obok selektora serii gdy `selectedSeriesId !== "__global__"` i brak nadpisań
- Gdy brak sekcji i jest to seria — zmienić komunikat na "Brak nadpisań — używane są sekcje globalne"

### 2. Tabela `guide_settings` (singleton)

Nowa tabela w bazie (migracja):

```sql
CREATE TABLE public.guide_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  font_size_header numeric DEFAULT 11,
  font_size_table numeric DEFAULT 9,
  table_row_height numeric DEFAULT 8,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.guide_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read guide_settings" ON public.guide_settings FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can update guide_settings" ON public.guide_settings FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can insert guide_settings" ON public.guide_settings FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

INSERT INTO public.guide_settings (font_size_header, font_size_table, table_row_height) VALUES (11, 9, 8);
```

### 3. Komponent GuideSettings

**Nowy plik:** `src/pages/AdminPanel/guides/GuideSettings.tsx`
- Collapsible panel (jak `LabelSettings`) z polami:
  - Czcionka nagłówka (pt)
  - Czcionka tabeli (pt)  
  - Wysokość wiersza tabeli (mm)
- Auto-save z debounce
- Hook `useGuideSettings()` do re-użycia w generatorze PDF

### 4. Integracja w GuideTemplates

- Import i renderowanie `<GuideSettings />` nad tabelą sekcji

### 5. Użycie ustawień w generatorze PDF

**Plik:** `src/utils/pdfGenerators/guideGenerator.ts`
- Pobrać ustawienia z `guide_settings` przed generowaniem
- Zastosować `font_size_header` w `addHeader`, `font_size_table` w `addTable`

### Pliki do edycji/utworzenia
1. Migracja SQL — nowa tabela `guide_settings`
2. `src/pages/AdminPanel/guides/GuideSettings.tsx` — nowy komponent
3. `src/pages/AdminPanel/GuideTemplates.tsx` — dodać copy mutation + GuideSettings
4. `src/utils/pdfGenerators/guideGenerator.ts` — użyć ustawień z DB

