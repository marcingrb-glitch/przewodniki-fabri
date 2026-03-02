

## Plan: Konsolidacja automatów per seria — ZREALIZOWANY ✅

### Krok 1: Migracja SQL ✅
- Dodano `series_id` (UUID, FK → series, NOT NULL) do `automats`
- Przypisano istniejące automaty do S1
- Wstawiono automaty S2 (AT1/AT2 oba z `has_seat_legs=true`, 2.5cm, 2szt)
- Usunięto stary unique constraint na `code`, dodano `UNIQUE(code, series_id)`
- Usunięto kolumny `seat_leg_default`, `seat_leg_height_cm`, `seat_leg_count` z tabeli `series`

### Krok 2: `skuDecoder.ts` ✅
- Fetch automats filtruje po `series_id`
- Fetch series bez kolumn `seat_leg_*`
- Logika sofaSeatLeg uproszczona: automat decyduje, jeśli N w SKU → nóżki z SKU, jeśli brak → N4

### Krok 3: Panel admina ✅
- Automaty przeniesione do sekcji per seria w sidebarze
- Automats.tsx filtruje po series_id, wstrzykuje series_id przy submit
- Series.tsx bez pól seat_leg_*
