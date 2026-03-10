

## Zawijanie kolumn do kolejnych wierszy

### Problem
Gdy sekcja ma za dużo kolumn, tabela wychodzi poza stronę A4 (widoczne na screenshocie — kolumna "Front" ucięta).

### Rozwiązanie
Obliczać maksymalną liczbę kolumn na wiersz na podstawie dostępnej szerokości (A4 = 180mm użyteczne). Przy czcionce 10pt minimalna czytelna kolumna to ~30mm, więc max ~6 kolumn. Jeśli sekcja ma więcej — dzielimy na chunki i renderujemy jako kolejne tabele (bez powtarzania nazwy sekcji).

### Zmiany

**1. `src/utils/pdfGenerators/guideGenerator.ts`**
- W pętli po sekcjach: jeśli `cols.length > MAX_COLS` (np. 5), podzielić na chunki po MAX_COLS
- Każdy chunk = osobne wywołanie `addTable` z odpowiednimi nagłówkami i wartościami
- Między chunkami mniejszy odstęp (np. 2mm zamiast 8mm)

**2. `src/utils/pdfHelpers.ts`**
- Dodać opcjonalny parametr `spacing` do `addTable` żeby kontrolować odstęp po tabeli (domyślnie 8, ale dla kontynuacji chunka 2mm)

**3. `src/pages/AdminPanel/GuidePreview.tsx`**
- Analogiczna logika chunkowania w podglądzie — jeśli kolumn > MAX_COLS, renderować wiele mini-tabel pod sobą

