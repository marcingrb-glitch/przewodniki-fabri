

## Problem

Tabele z wieloma kolumnami (np. Poduszka — 5 kolumn) są wciśnięte w 85mm szerokości jednej kolumny, co powoduje łamanie tekstu w nagłówkach i nieczytelność ("Podus zka — Wyglą d").

## Rozwiązanie — adaptacyjna czcionka per tabelę

Zamiast jednego `fs=10` dla wszystkich tabel, dynamicznie dobieraj rozmiar czcionki na podstawie liczby kolumn w tabeli:

- **≤3 kolumny** → `fs = 10` (obecny rozmiar, czytelne w 85mm)
- **4 kolumny** → `fs = 9`
- **5-6 kolumn** → `fs = 8`

### Zmiany w `decodingPDF.ts`:

1. **Dodaj pole `fontSize` do `RenderItem`** — każdy item wie jaki rozmiar czcionki potrzebuje.

2. **W `buildChunkedItems`** — ustaw `fontSize` na podstawie `cols.length`:
   ```
   fontSize = cols.length <= 3 ? 10 : cols.length === 4 ? 9 : 8
   ```

3. **W `renderColumn`** — przy wywołaniu `addTableAt` użyj `item.fontSize` zamiast globalnego `fs`.

4. **W `estimateColumnHeight`** — uwzględnij per-item fontSize zamiast globalnego `fs` (item z mniejszą czcionką zajmuje mniej miejsca).

5. **Nagłówki sekcji z 8pt → 7pt** — drobna oszczędność miejsca na tytuły nad tabelami.

To podejście zachowuje duże, czytelne czcionki dla prostych tabel (2-3 kolumny), a zmniejsza je tylko tam gdzie jest dużo kolumn — rozwiązując problem łamania tekstu bez utraty czytelności.

