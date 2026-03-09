

## Etap 4: Generator Ściągawek Stanowiskowych

### Zakres
Nowa strona `/admin/cheatsheets` z wyborem serii i stanowiska, podglądem ściągawki HTML i drukiem via `window.print()`.

### Struktura plików

```text
src/pages/AdminPanel/
├── Cheatsheets.tsx                    (główny — selektory + routing do widoków)
├── cheatsheets/
│   ├── MagazynSheet.tsx               (📦 Magazyn stolarki i pianek)
│   ├── KrojowniaSheet.tsx             (✂️ Krojownia)
│   ├── NozkiSheet.tsx                 (👟 Kompletacja nóżek)
│   └── KierownikSheet.tsx             (👔 Kierownik produkcji)
```

### Krok 1: Cheatsheets.tsx (główny)
- Dropdown serii (z `useQuery` na `series`)
- Kafelki stanowisk (4 przyciski z ikonami)
- Po wyborze obu → renderuje odpowiedni komponent `*Sheet`
- Przycisk "🖨️ Drukuj" → `window.print()`
- Cały sheet wrapper ma klasę `print-area`, selektory mają `no-print`

### Krok 2: MagazynSheet (Magazyn stolarki i pianek)
Pobiera: `seats_sofa`, `product_foams`, `backrests`, `sides`, `series_config` WHERE series_id
- Nagłówek z nazwą serii
- Sekcja Sprężyny: tabela model→sprężyna, wyjątki z czerwonym tłem
- Sekcja Siedziska: per model — kod, stelaż, modyfikacja, pianki (wymiary z product_foams)
- Sekcja Oparcia: stelaż + pianki
- Sekcja Boczki: kod → nazwa → stelaż
- Brak danych → "⚠️ BRAK DANYCH"

### Krok 3: KrojowniaSheet (Krojownia)
Pobiera: `seats_sofa`, `sides`, `backrests`, `series_config`, `seat_pillow_mapping`
- Tabela wykrojów: element + wykończenie → opis
- Sekcja pułapek (hardcoded per seria + dane z DB): wyróżnione pogrubieniem i podkreśleniem
- Dozwolone wykończenia per element

### Krok 4: NozkiSheet (Kompletacja nóżek)
Pobiera: `series_config`, `legs`, `chests`, `automats`
- 🟢 CO KOMPLETOWAĆ: tabela z typem nóżki, wysokością, ilością, kto montuje
- 🔴 CZEGO NIE KOMPLETOWAĆ: duży font, czerwona ramka, pogrubienie — plastikowe 2.5cm NIGDY, specyficzne wyjątki per seria
- Tabela typów nóżek: N1-N5 z nazwą, materiałem, kolorami

### Krok 5: KierownikSheet (Kierownik produkcji)
- Renderuje kompaktowy read-only widok pełnej specyfikacji serii
- Reużywa dane z tych samych tabel co SeriesSpecification
- Kompaktowy layout bez edycji, z page-break per sekcja

### Krok 6: Print CSS
Dodać w `src/index.css` blok `@media print`:
- Ukryj header, sidebar, selektory (`.no-print`)
- Pełna szerokość, czarno-biały
- Tabele z ramkami 1px solid black
- `.warning` → bold + underline
- `.page-break` → page-break-before: always

### Krok 7: Route w App.tsx
Dodać `<Route path="cheatsheets" element={<Cheatsheets />} />` wewnątrz admin layout + import.

### Bez zmian
- Istniejące strony i routing — bez zmian
- SeriesSpecification — bez zmian
- AdminLayout sidebar — link już istnieje (`/admin/cheatsheets`)

