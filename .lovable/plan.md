

## Plan: Rozdzielenie oparcia OP68 na warianty + powiązanie pianek z backrest_id

### Zmiany

**1. Migracja SQL**

```sql
-- Dodaj model_name do backrests
ALTER TABLE public.backrests ADD COLUMN IF NOT EXISTS model_name TEXT;

-- Dodaj backrest_id do product_foams (referencja do konkretnego rekordu oparcia)
ALTER TABLE public.product_foams ADD COLUMN IF NOT EXISTS backrest_id UUID REFERENCES public.backrests(id) ON DELETE SET NULL;
```

**2. Aktualizacja danych (INSERT tool)**

- UPDATE istniejącego OP68 w S2: ustaw `model_name = 'Modena / Sienna / Porto'`, `spring_type = 'B'`
- INSERT drugiego OP68 w S2: `model_name = 'Ravenna / Barga'`, `spring_type = '54A'`, te same `height_cm`, `frame`, `allowed_finishes`, `default_finish`
- UPDATE istniejących pianek OP68 S2: ustaw `backrest_id` na ID pierwszego wariantu (Modena/Sienna/Porto)
- UPDATE sewing_variants: przypisz modele do odpowiednich wariantów

**3. SeriesBackrests.tsx — zmiany w widoku**

- Dodaj `model_name` do `backrestFields` w formularzu
- W `renderBackrestCard`: wyświetlaj `model_name` w tytule karty obok kodu (np. "OP68 — Modena / Sienna / Porto")
- Warianty szycia wyświetlaj WEWNĄTRZ karty oparcia — powiązanie przez `models` pokrywające się z `model_name` karty. Wyświetlaj jako badge: "Szycie: Przewinięte"
- Pianki filtruj po `backrest_id` zamiast `seat_code` — każda karta widzi tylko swoje pianki
- Przy dodawaniu pianki: ustaw `backrest_id` na ID bieżącej karty (oprócz `seat_code` i `series_id`)
- Grupuj karty po kodzie, potem po `model_name` — karty z tym samym kodem ale różnym `model_name` wyświetlają się jako osobne karty

### Pliki do edycji
- **Migracja SQL**: `ALTER TABLE` — 2 kolumny
- **Dane** (insert tool): UPDATE + INSERT rekordów
- **`SeriesBackrests.tsx`**: model_name w tytule, pianki filtrowane po backrest_id, warianty szycia jako badge wewnątrz karty

### Co się NIE zmienia
- `skuParser.ts`, `skuDecoder.ts`, `pdfGenerators/*` — bez zmian (zgodnie z instrukcją)
- `Backrests.tsx` (stary komponent) — nie używany w specyfikacji serii
- Struktura `sewing_variants` — bez zmian, tylko dane

