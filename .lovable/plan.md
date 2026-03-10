

## Plan: 3 poprawki — Krojownia warianty szycia, Nóżki SK23/S2, kolory

### 1. KrojowniaSheet.tsx — dodaj sekcję wariantów szycia oparcia

Dodać query do `sewing_variants` WHERE `series_id` AND `component_type = 'backrest'`.

Po sekcji "Wykończenia oparć" (linia ~148), dodać nową sekcję warunkową (tylko gdy są rekordy):
- Ramka z pomarańczowym/żółtym tłem (wyróżnienie ⚠️)
- Tabela: Wariant | Modele | Opis
- Dane z `variant_name`, `models` (array → join), `description`

### 2. NozkiSheet.tsx — poprawki SK23 i fotel S2

**Problem z fotelem S2**: Linia 158 `if (seriesCode !== "S2")` wyklucza fotel dla S2. Zmienić na: zawsze dodawaj fotel do `doRows` (bez warunku na serię). Fotel powinien być w CO KOMPLETOWAĆ dla wszystkich serii.

**SK23**: Logika `c.leg_height_cm > 0` już poprawnie kieruje SK23 (leg_height_cm=0) do dontRows. Weryfikacja — jeśli dane w bazie są poprawne (SK23 ma leg_height_cm=0), to działa. Nie wymaga zmian w kodzie.

### 3. formatColors — już poprawione

Obie wersje `formatColors` (NozkiSheet linia 14-25, SeriesLegs linia 26-37) już obsługują JSONB object `{A: "Buk"}` poprawnie. Jeśli nadal wyświetla `[object Object]`, problem może być w tym, że `colors` ma default `'[]'::jsonb` (array), a dane to object. Obecna logika obsługuje oba formaty — nie wymaga zmian.

### Zmiany w plikach

**KrojowniaSheet.tsx**:
- Dodać `useQuery` dla `sewing_variants` (component_type = 'backrest')
- Dodać sekcję po oparciach z tabelą wariantów w wyróżnionej ramce

**NozkiSheet.tsx**:
- Linia 157-166: usunąć warunek `if (seriesCode !== "S2")` — fotel zawsze w doRows

### Brak zmian w:
- `skuParser.ts`, `skuDecoder.ts`, `utils/pdfGenerators/*`
- `SeriesLegs.tsx` (formatColors już poprawne)
- Brak migracji SQL

