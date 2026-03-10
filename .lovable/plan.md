

## Skrócenie nazw pól sprężyn: "Sprężyna siedziska/oparcia" → "Sprężyna"

### Logika
Skoro sprężyna jest dodawana w kontekście konkretnego komponentu (siedzisko/oparcie), pełna nazwa jest zbędna — wystarczy "Sprężyna".

### Zmiany

**`src/utils/fieldLabels.ts`** — 2 wartości:
- `"seat.springType"`: `"Sprężyna siedziska"` → `"Sprężyna"`
- `"backrest.springType"`: `"Sprężyna oparcia"` → `"Sprężyna"`

**`src/pages/AdminPanel/labels/DisplayFieldsSelector.tsx`** — 2 labele:
- seat → `"Sprężyna siedziska"` → `"Sprężyna"`
- backrest → `"Sprężyna oparcia"` → `"Sprężyna"`

4 zmiany stringów, 2 pliki.

