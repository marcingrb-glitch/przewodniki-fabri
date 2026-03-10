

## Fix: "Błąd zapisu" przy dodawaniu linii

### Problem
Kolumna `display_fields` w tabeli `label_templates` jest typu `text[]` (tablica Postgres), a nie `jsonb`. Tablice Postgres wymagają jednakowych wymiarów we wszystkich pod-tablicach, wiec `[["seat.code"], []]` (1 element vs 0 elementow) zwraca blad:

> `"Multidimensional arrays must have sub-arrays with matching dimensions."`

### Rozwiazanie
Zmiana typu kolumny `display_fields` z `text[]` na `jsonb`. Dane pozostana kompatybilne — istniejace flat arrays (`["seat.code"]`) beda dalej dzialac, a nested arrays (`[["seat.code"], []]`) tez beda akceptowane.

### Zmiany

**1. Migracja DB:**
```sql
ALTER TABLE label_templates 
  ALTER COLUMN display_fields TYPE jsonb 
  USING to_jsonb(display_fields);
```
To konwertuje istniejace dane `text[]` na `jsonb` (np. `{"seat.code","automat.code"}` → `["seat.code","automat.code"]`).

**2. `src/pages/AdminPanel/LabelTemplates.tsx`:**
- Typ `display_fields` w interfejsie `LabelTemplate` zmieniony z `string[]` na `any` (albo `string[] | string[][]`), zeby obsluzyc oba formaty.

**3. Bez zmian w pozostalych plikach** — `LabelConfigurator.tsx`, `labels.ts` i `pdfHelpers.ts` juz obsluguja oba formaty dzieki `normalizeFields()`.

