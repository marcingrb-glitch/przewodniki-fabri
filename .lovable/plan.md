

## Opisy (etykiety) przed wartościami pól

### Problem
Teraz na etykiecie widać np. `Siedzisko: SD02ND 66B` — kod i sprężyna bez opisu. Użytkownik chce widzieć `Siedzisko: SD02ND Sprężyna: 66B` — każde pole z własnym opisem.

### Rozwiązanie
Wykorzystać istniejące `label` z `COMPONENT_FIELDS` (już są w bazie kodu, np. "Kod siedziska", "Sprężyna siedziska") jako prefiksy przed wartościami. Skrócić je do czytelnej formy (np. "Sprężyna" zamiast "Sprężyna siedziska" — bo kontekst wynika z nazwy etykiety).

### Zmiany

**`LabelConfigurator.tsx`** — w `previewLines`:
- Zamiast `values.join(" ")` → każde pole formatować jako `"Label: value"` używając `getFieldLabel(f, component)`
- Pierwsza linia: prefix `template.label_name` + pola z opisami
- Kolejne linie: pola z opisami bez prefixu

**`pdfHelpers.ts` / `labels.ts`** — w generowaniu PDF:
- Analogiczna zmiana — przy budowaniu tekstu linii, każde pole dostaje swój opis z `COMPONENT_FIELDS`
- Format: `"Kod: SD02ND Sprężyna: 66B"` zamiast `"SD02ND 66B"`

### Dane
Opisy pochodzą z `COMPONENT_FIELDS` w `DisplayFieldsSelector.tsx` — nie trzeba dodatkowych zapytań do bazy. Te labele są już zdefiniowane per pole (np. `{ value: "seat.springType", label: "Sprężyna siedziska" }`).

Brak zmian w bazie danych.

