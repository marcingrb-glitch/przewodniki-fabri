

## Etap 2: Strona Specyfikacji Serii — Plan implementacji

### Zakres
Nowa strona `/admin/spec/:seriesCode` z 7 tabami, dodana obok istniejącego panelu. Zero zmian w istniejących stronach.

### Struktura plików

```text
src/pages/AdminPanel/
├── SeriesSpecification.tsx          (główny komponent — routing, fetch series, tabs)
├── spec/
│   ├── SeriesOverview.tsx           (tab Przegląd — karty z series_config)
│   ├── SeriesModels.tsx             (tab Modele/Siedziska — sub-tabs per model, inline edit pianek)
│   ├── SeriesSides.tsx              (tab Boczki — tabela + macierz kompatybilności)
│   ├── SeriesBackrests.tsx          (tab Oparcia — tabela oparć)
│   ├── SeriesLegs.tsx               (tab Nóżki & Montaż — tabela nóżek + info box)
│   ├── SeriesPufa.tsx               (tab Pufa — tabela seats_pufa + info nóżki)
│   ├── SeriesFotel.tsx              (tab Fotel — info o dziedziczeniu)
│   └── InlineEditCell.tsx           (reużywalny komponent — klik→input→save)
```

### Krok 1: InlineEditCell komponent
Reużywalny komponent do inline edycji komórek tabeli pianek:
- Wyświetla wartość lub szare tło z "uzupełnij" gdy puste
- Klik → zamienia na Input z aktualną wartością
- Enter/onBlur → save callback, Escape → cancel
- Obsługa typów: text, number

### Krok 2: SeriesSpecification.tsx (główny)
- `useParams()` → `seriesCode`
- Fetch series by code: `supabase.from('series').select('*').eq('code', seriesCode).single()`
- Fetch series_config by series_id
- Render nagłówek (nazwa, kolekcja) + Tabs z 7 tabami
- Przekazuje `seriesId` i `seriesConfig` do każdego taba

### Krok 3: SeriesOverview
- Karty (Card) z danymi z `series_config`:
  - Stałe elementy (fixed_backrest, fixed_chest, fixed_automat — "zawsze X" lub "dowolne")
  - Sprężyna (default_spring + spring_exceptions jako lista)
  - Nóżki siedzisko (seat_leg_type + seat_leg_height_cm)
  - Nóżki pufa (pufa_leg_type + pufa_leg_height_cm)
- Notes edytowalne (textarea + save button, admin only)

### Krok 4: SeriesModels
- Fetch `seats_sofa` WHERE series_id
- Fetch `product_foams` WHERE series_id
- Fetch `seat_pillow_mapping` WHERE series_id
- Jeśli model_name istnieje → sub-tabs per unikalne model_name
- Jeśli brak model_name → prosta tabela siedzisk w card layout
- Per siedzisko/model:
  - Karta z kodem, typem, wykończeniami, modyfikacją stelaża, sprężyną
  - Tabela pianek z InlineEditCell (pozycja, nazwa, wys×szer×dł, materiał, ilość, uwagi)
  - Save via `supabase.from('product_foams').update({...}).eq('id', foamId)`
  - Poduszka oparciowa z seat_pillow_mapping
  - Przycisk "Dodaj piankę" → insert do product_foams

### Krok 5: SeriesSides
- Tabela boczków (reużycie DataTable/useAdminCrud)
- Sekcja "Kompatybilność" — macierz checkboxów:
  - Fetch `seat_side_compatibility` WHERE series_id
  - Fetch `seats_sofa` WHERE series_id (dla kolumn)
  - Grid: wiersze = boczki, kolumny = siedziska (z model_name jeśli jest)
  - Toggle checkbox → upsert/update `seat_side_compatibility`

### Krok 6: SeriesBackrests
- Tabela oparć z backrests WHERE series_id (reużycie DataTable/useAdminCrud)

### Krok 7: SeriesLegs
- Tabela nóżek z legs WHERE series_id
- Info box "Kto co montuje" — dane z series_config:
  - Pod skrzynią, pod siedziskiem, pufa, fotel — typ, wysokość, kto montuje

### Krok 8: SeriesPufa
- Tabela seats_pufa WHERE series_id
- Info box o nóżkach pufy z series_config

### Krok 9: SeriesFotel
- Statyczny info o dziedziczeniu z sofy
- Nóżki fotela info

### Krok 10: Route w App.tsx
Dodaj wewnątrz admin layout:
```tsx
<Route path="spec/:seriesCode" element={<SeriesSpecification />} />
```

### Bez zmian
- Istniejące strony admin (SeatsSofa, Sides, etc.) — bez zmian
- AdminLayout sidebar — bez zmian (Etap 3)
- Istniejące routing — bez zmian

