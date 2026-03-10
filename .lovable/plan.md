

## Plan: Inline podgląd dekodowania (jak w przewodnikach)

### Problem
Obecnie strona dekodowania otwiera PDF w dialogu (`PDFPreview`), a użytkownik oczekuje inline podglądu na stronie — tak jak `GuidePreview` renderuje skalowany mockup A4 bezpośrednio w HTML.

### Rozwiązanie
Stworzyć komponent `DecodingPreview` analogiczny do `GuidePreview` — renderujący dane dekodowania jako skalowany HTML mockup A4 bezpośrednio na stronie, bez generowania PDF.

### Nowy plik: `src/pages/AdminPanel/DecodingPreview.tsx`
Komponent przyjmujący dane z bazy (exampleData) i renderujący:
- Nagłówek z numerem zamówienia, datą, serią, SKU
- Placeholder na zdjęcie wariantu (szare pole)
- Tabele HTML dla każdej sekcji (Tkanina, Siedzisko-Stolarka, Siedzisko-Pianki, Oparcie, Boczek, Skrzynia+Automat, Nóżki, Dodatki)
- Kontener o stałej szerokości ~500px z border i shadow (jak GuidePreview)
- Tekst w rozmiarze 9-10px, nagłówki sekcji bold uppercase

Dane będą mapowane przez istniejący `buildExampleDecoded()` — reuse tej funkcji.

### Zmiana w: `src/pages/AdminPanel/DecodingTemplates.tsx`
- Dodać `DecodingPreview` renderowany inline pod przyciskami
- Zachować przyciski "Podgląd PDF" (dialog) i "Pobierz PDF" do generowania faktycznego PDF
- Inline preview renderuje się automatycznie po wyborze serii (bez klikania)

### Pliki:
- `src/pages/AdminPanel/DecodingPreview.tsx` — nowy komponent
- `src/pages/AdminPanel/DecodingTemplates.tsx` — dodanie inline preview

