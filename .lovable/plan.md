

## Plan: Wizualne rozdzielenie podgrup Stolarka/Pianki w podglądzie i PDF

### Problem
Gdy sekcja (np. "SIEDZISKO") zawiera kolumny z obu podgrup (`seat_frame` i `seat_foam`), wyświetla je w jednej ciągłej tabeli. Użytkownik chce widzieć wizualne rozdzielenie — nagłówek podgrupy nad każdą grupą kolumn.

### Rozwiązanie

Zarówno w podglądzie (`GuidePreview.tsx`) jak i w generatorze PDF (`guideGenerator.ts`), przy renderowaniu kolumn sekcji:

1. Rozdzielić kolumny na grupy `seat_frame` i `seat_foam` (na podstawie listy `AVAILABLE_FIELDS` lub hardcoded set pól)
2. Jeśli obie grupy mają kolumny — renderować dwie osobne pod-tabele z etykietami "Stolarka" / "Pianki"
3. Jeśli tylko jedna grupa — renderować jak dotąd bez podziału

### Zmiany w plikach

**1. `src/pages/AdminPanel/GuidePreview.tsx`** — w sekcji renderowania tabel (linie ~234-270):
- Zdefiniować stały set pól `seat_foam`: `seat.foams_summary`, `seat.front`, `seat.midStrip_yn`
- Przed chunkowaniem sprawdzić, czy kolumny zawierają pola z obu grup
- Jeśli tak — renderować dwa bloki z nagłówkami podgrup ("Stolarka", "Pianki"), każdy z własnymi kolumnami i chunkowaniem
- Nagłówek podgrupy: mały wiersz `text-[9px] font-semibold italic bg-muted/20 px-2 py-0.5`

**2. `src/utils/pdfGenerators/guideGenerator.ts`** — analogiczna logika w pętli sekcji (~linia 160):
- Rozdzielić kolumny na frame/foam
- Jeśli obie obecne — dodać małą etykietę tekstową przed każdą pod-tabelą i wywołać `addTable` osobno dla każdej grupy

### Definicja pól foam (współdzielona)
```typescript
const SEAT_FOAM_FIELDS = new Set([
  "seat.foams_summary", "seat.front", "seat.midStrip_yn"
]);
```
Wszystkie pozostałe pola `seat.*` → Stolarka. Pola nie-seat → bez podziału.

