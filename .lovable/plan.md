

## Problem

Podgląd dekodowania PDF renderuje iframe z data URI, ale iframe może wyświetlać się jako pusty. Prawdopodobne przyczyny:

1. **Race condition w `generatePreview`**: `setGenerating(false)` wykonuje się w `finally` ZANIM `reader.onload` zdąży ustawić `pdfDataUri` — ale to nie powoduje pustego iframe, bo stan `pdfDataUri` i tak się ustawi po chwili.

2. **Główny problem**: iframe z `data:application/pdf;base64,...` może nie renderować się w sandboxowanym preview Lovable. Komponent `PDFPreview` (używany przez przewodniki) działa, bo jest w `Dialog` — ale mechanizm jest identyczny (data URI w iframe).

3. **Brak obsługi błędów widocznych dla użytkownika** — jeśli PDF się nie wygeneruje (np. brak danych), użytkownik widzi pustą ramkę bez informacji.

## Rozwiązanie

Zamiast własnego inline iframe, użyć istniejącego komponentu `PDFPreview` (dialog z iframe), który już działa poprawnie dla przewodników. Dodatkowo dodać toast z informacją o błędzie.

### Zmiana w `src/pages/AdminPanel/DecodingTemplates.tsx`:

1. **Importować `PDFPreview`** i `toast` z sonner
2. **Zastąpić stan `pdfDataUri`** stanem `pdfBlob: Blob | null`
3. **Dodać stan `showPreview: boolean`** do kontroli dialogu
4. **`generatePreview`** — ustawia `pdfBlob` i `showPreview = true`
5. **Przycisk "Podgląd"** — wywołuje `generatePreview` → otwiera `PDFPreview` dialog
6. **Usunąć inline Card z iframe** — podgląd będzie w dialogu (jak w przewodnikach)
7. **Dodać toast error** jeśli generowanie się nie uda
8. **Usunąć `useEffect` auto-generowania** — podgląd na żądanie (klik "Podgląd")

### Pliki do edycji:
- `src/pages/AdminPanel/DecodingTemplates.tsx` — przebudowa na PDFPreview dialog

