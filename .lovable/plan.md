

## Plan: Tabelka poduszek na pełną szerokość pod dwiema kolumnami

### Co robimy
Sekcje zawierające pola `pillow.*`, `jaski.*`, `walek.*` (grupa "Poduszka/Jaśki/Wałek") wyciągamy z dwukolumnowego layoutu i renderujemy na pełną szerokość (180mm) pod obiema kolumnami.

### Zmiany w `src/utils/pdfGenerators/decodingPDF.ts`

1. **Rozdzielenie renderItems na dwie grupy** — po zbudowaniu `renderItems`, podziel je na:
   - `columnItems` — wszystko co **nie** zawiera pól `pillow.*`, `jaski.*`, `walek.*`
   - `fullWidthItems` — sekcje z polami `pillow.*`, `jaski.*`, `walek.*`

   Identyfikacja: sprawdź czy w `item.headers` lub oryginalnych kolumnach sekcji są pola z tych grup. Najprościej: dodaj flagę `fullWidth: boolean` do `RenderItem` i oznacz ją podczas budowania.

2. **Podział na kolumny tylko z `columnItems`** — `midPoint`, `leftItems`, `rightItems` liczone z `columnItems`.

3. **Estymacja wysokości** — `estimateColumnHeight` liczy tylko `columnItems` + dodaj osobną estymację `fullWidthItems` do kalkulacji `availableForImage`.

4. **Rendering** — po wyrenderowaniu dwóch kolumn (`y = Math.max(yLeft, yRight)`), renderuj `fullWidthItems` na pełną szerokość:
   ```
   xStart = 15, colW = 180 (cała szerokość)
   ```
   Czcionka adaptacyjna liczy się normalnie od liczby kolumn — ale przy 180mm nawet 5 kolumn wygląda dobrze w fs=10.

### Identyfikacja sekcji poduszek
Sekcja jest "full-width" jeśli którykolwiek z jej pól zaczyna się od `pillow.`, `jaski.` lub `walek.`. Sprawdzane na etapie budowania `renderItems` z oryginalnych `cols[].field`.

