

## Plan: Dynamiczna wysokość zdjęcia + większa czcionka tabel

### Problem
Zdjęcie ma stałą wysokość 50mm niezależnie od ilości tabel. Czcionka w tabelkach to 7pt — za mała.

### Rozwiązanie

#### 1. Czcionka tabel → 10pt
Zmiana `fs = 7` na `fs = 10` oraz `rh = 5` na `rh = 8` (linia 221-222).

#### 2. Dynamiczna wysokość zdjęcia
Zamiast stałego `imageH = 50`, oblicz ile miejsca zajmą tabele, a resztę przeznacz na zdjęcie:

```text
pageHeight = 297mm (A4)
headerEnd ≈ 39mm (nagłówek + SKU + linia)
tablesStart = headerEnd + imageH + 4
bottomMargin = 10mm

Dostępna przestrzeń na tabele = 297 - tablesStart - bottomMargin
```

**Podejście**: Najpierw wyrenderuj tabele "na sucho" (na tymczasowym dokumencie lub oblicz szacunkową wysokość), potem dopasuj zdjęcie.

Prostsze podejście — **szacowanie wysokości tabel**:
- Każdy renderItem z tytułem: ~3mm (tytuł) + nagłówek tabeli (~rh) + wiersze * rh + spacing
- Wysokość kolumny ≈ suma itemów w dłuższej kolumnie
- `imageH = pageH - bottomMargin - headerEnd - 4 - tablesColumnHeight`
- Minimum imageH = 20mm, maksimum = 80mm

#### Zmiany w `decodingPDF.ts`:

1. **Linia 221-222**: `fs = 10`, `rh = 8`
2. **Przed renderowaniem zdjęcia** (linia ~94-146): Przenieś budowanie `renderItems` i obliczenie wysokości kolumn PRZED rysowaniem zdjęcia
3. **Nowa funkcja** `estimateColumnHeight(items, fs, rh, sp)` — szacuje wysokość kolumny na podstawie liczby wierszy, nagłówków i spacing
4. **Oblicz `imageH`**: `Math.max(20, Math.min(80, 297 - 10 - y - 4 - maxColumnHeight))`
5. Reszta logiki (rysowanie zdjęcia, renderowanie kolumn) bez zmian

#### Kolejność w kodzie:
```
1. Header + SKU → y ≈ 39
2. Buduj renderItems z sekcji
3. Podziel na left/right kolumny
4. Szacuj wysokość dłuższej kolumny
5. imageH = dostępne miejsce - wysokość tabel
6. Rysuj zdjęcie (imageH)
7. Renderuj tabele dwukolumnowo
```

