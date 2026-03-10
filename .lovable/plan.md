

## Plan: Ucinanie słowa "Poduszka" z nazwy poduszki w dekodowaniu

### Problem
W polu "Nazwa" poduszki wyświetla się "Poduszka kwadratowa" — ale sekcja już się nazywa "Poduszka", więc słowo jest redundantne.

### Rozwiązanie
Dodać helper `stripPrefix(name, prefix)` i użyć go w 3 miejscach:

### 1. `src/pages/AdminPanel/fieldResolver.ts` → `resolveExampleValue`
Dla `pillow.name` — usunąć prefix "Poduszka " z wartości.

### 2. `src/utils/pdfGenerators/guideGenerator.ts` → `resolveField`
Dodać explicit case `"pillow.name"` który ucina prefix "Poduszka " (analogicznie do innych special cases).

### 3. `src/utils/pdfGenerators/decodingPDF.ts` (linia 199)
W hardcoded sekcji "Dodatki" — uciąć "Poduszka " z `decoded.pillow.name`.

### Helper
```typescript
function stripPillowPrefix(name: string): string {
  return name.replace(/^Poduszka\s+/i, "");
}
```

### Pliki do edycji:
- `src/pages/AdminPanel/fieldResolver.ts`
- `src/utils/pdfGenerators/guideGenerator.ts`
- `src/utils/pdfGenerators/decodingPDF.ts`

