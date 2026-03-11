

## Plan: Zmniejsz odstęp w lewej strefie etykiety

### Problem
Padding w lewej strefie jest proporcjonalny do rozmiaru czcionki (`fontSize * 0.3`). Dla S1 przy 18pt to 5.4mm z każdej strony — daje ogromny odstęp. Dla Viena przy 9pt to 2.7mm — mniejszy, ale wciąż za duży.

### Rozwiązanie
W `src/utils/pdfHelpers.ts` (linie 256-259) — zamienić proporcjonalny padding na stały:

```typescript
// Przed:
const x = nextX + fontSize * 0.3;
nextX = x + fontSize * 0.3 + 0.5;

// Po:
const x = nextX + 1.5;
nextX = x + 1.5;
```

Stały padding 1.5mm z każdej strony tekstu zapewni równomierne, niewielkie odstępy niezależnie od rozmiaru czcionki.

