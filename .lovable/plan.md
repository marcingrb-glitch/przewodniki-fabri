

## Plan: Zbiorczy prompt poprawek — Panel Specyfikacji Produktów

### Migracje SQL (jedna migracja)

**Schema changes** (migration tool):
- `ALTER TABLE public.pillows ADD COLUMN IF NOT EXISTS construction_type TEXT;`
- `ALTER TABLE public.backrests ADD COLUMN IF NOT EXISTS spring_type TEXT;`
- `ALTER TABLE public.backrests ADD COLUMN IF NOT EXISTS sewing_notes TEXT;`

**Data changes** (insert tool — 3 osobne wywołania):

1. SK22→SK23, kolekcja S2, N4 gwint M8:
```sql
UPDATE series_config SET fixed_chest = 'SK23' WHERE fixed_chest = 'SK22';
UPDATE series SET collection = 'Modena' WHERE code = 'S2';
UPDATE legs SET name = REPLACE(name, 'M5', 'M8') WHERE code = 'N4';
```

2. Sprężyny:
```sql
UPDATE seats_sofa SET spring_type = '66B' WHERE series_id = (SELECT id FROM series WHERE code = 'S1');
UPDATE backrests SET spring_type = '53B' WHERE code = 'OP62' AND series_id = (SELECT id FROM series WHERE code = 'S1');
UPDATE backrests SET spring_type = '57B' WHERE code = 'OP68' AND series_id = (SELECT id FROM series WHERE code = 'S1');
UPDATE seats_sofa SET spring_type = '63A' WHERE model_name = 'Barga' AND series_id = (SELECT id FROM series WHERE code = 'S2');
UPDATE backrests SET spring_type = '54A' WHERE code = 'OP68' AND series_id = (SELECT id FROM series WHERE code = 'S2');
UPDATE seats_sofa SET spring_type = 'B' WHERE series_id = (SELECT id FROM series WHERE code = 'S2') AND (spring_type IS NULL OR spring_type = 'B') AND (model_name IS NULL OR model_name != 'Barga');
```

3. Pianki oparcia + model_name S1:
```sql
UPDATE product_foams SET seat_code = 'OP68' WHERE series_id = (SELECT id FROM series WHERE code = 'S2') AND component = 'oparcie';
UPDATE seats_sofa SET model_name = 'Viena' WHERE series_id = (SELECT id FROM series WHERE code = 'S1') AND (model_name IS NULL OR model_name = '');
```

---

### Zmiany w kodzie (7 plików)

#### 1. `SeriesModels.tsx` — Poprawki 4, 11, 12
- **Usunąć** pola "Pianka" i "Front" z sekcji "Dane techniczne" (linie 196-203)
- **Usunąć** "Nazwa typu" z info identyfikacyjnych (linia 181)
- **Dodać** logikę współdzielenia pianek dla siedzisk dzielonych: jeśli `seat.code` kończy się na "D" i brak pianek → szukaj pianek dla kodu bez "D" (specjalnie: `SD01ND` → `SD01N`). Wyświetlić dopisek "Pianki jak [kod bazowy] + pasek środkowy"
- Filtrować pianki w `renderSeatCard`: tylko `component !== 'oparcie'` (żeby pianki oparcia nie wyświetlały się na kartach siedzisk)

#### 2. `SeriesBackrests.tsx` — Poprawki 3, 5, 14
Pełna przebudowa z tabeli na karty (wzór jak SeriesModels):
- Każda karta oparcia: kod + badge sprężyna + Edit/Delete
- Sekcja "Dane techniczne": Stelaż (`frame`), Wysokość (`height_cm`), Wykończenia (`allowed_finishes`), Sprężyna (`spring_type`) — inline edit
- **Usunąć** `foam` i `top` z wyświetlania (zostają w formularzu i bazie)
- Sekcja "Warianty szycia": wyświetl `sewing_notes` jako InlineEditCell (poprawka 14)
- Sekcja "Pianki szczegółowe": pobierz `product_foams` WHERE `seat_code = backrest.code` — taki sam format tabeli jak w SeriesModels
- Przycisk "+ Dodaj piankę" per oparcie
- Dodać `spring_type` i `sewing_notes` do `backrestFields`
- Fetch `product_foams` w `fetchAll` (filtruj po series_id)

#### 3. `SeriesLegs.tsx` — Poprawki 6, 15
Przebudowa logiki budowania `mountRows`:
- **SK23**: typ = "N4 plastikowe", wys = "2.5 cm", kto = "Tapicer (na stanowisku)" — niezależnie od `leg_height_cm`
- **SK15**: typ = "N z SKU", wys = "10 cm", kto = "Dziewczyny od nóżek (kompletacja do worka)"
- **SK17**: typ = "N z SKU", wys = "8 cm", kto = "Dziewczyny od nóżek (kompletacja do worka)"
- **Pod siedziskiem**: sprawdzaj `seat_leg_type` z config; dla S2 (plastic_2_5) → "N4 plastikowe", "Tapicer (na stanowisku)"
- **Pufa**: dla `plastic_2_5` → "Tapicer (na stanowisku)" zamiast "Nie kompletowane"
- **Fotel**: dodać warunkowo (nie dodawać dla S2 — ale to obsłuży SeriesSpecification)

#### 4. `SeriesOverview.tsx` — Poprawka 8
- Usunąć tekst `(alias SK22 → SK23)` z linii 105
- Nóżki pufy typ: zamiast surowego `config.pufa_leg_type` wyświetlać label z mapy (np. "Plastikowe N4" zamiast "plastic_2_5")
- Dodać badge "Kompletacja:" przy nóżkach pufy — wyliczany z `pufa_leg_type`

#### 5. `SeriesPufa.tsx` — Poprawka 7
- Dodać badge kompletacji nóżek pufy pod istniejącymi badge'ami:
  - `plastic_2_5` → "Kompletacja: Tapicer (na stanowisku)"
  - `from_sku` → "Kompletacja: Dziewczyny od nóżek (kompletacja do worka)"

#### 6. `SeriesSpecification.tsx` — Poprawka 16
- Warunkowe ukrywanie taba "Fotel": jeśli `seriesCode === 'S2'` → nie renderuj `TabsTrigger` i `TabsContent` dla "fotel"
- Przekazać `seriesCode` do `SeriesFotel` i `SeriesLegs` (żeby Legs nie dodawał wiersza Fotel dla S2)

#### 7. `Pillows.tsx` — Poprawka 2
- Dodać kolumnę "Typ konstrukcji" do `columns`: `{ key: "construction_type", label: "Typ konstrukcji" }`
- Dodać pole select do `fields`: `{ name: "construction_type", label: "Typ konstrukcji", type: "select", options: [{ value: "sztanga", label: "Sztanga" }, { value: "wciągi", label: "Wciągi" }, { value: "gładka", label: "Gładka" }] }`

---

### Pliki NIE modyfikowane
- `skuParser.ts`, `skuDecoder.ts`, `utils/pdfGenerators/*`

