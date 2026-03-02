

## Plan: Konsolidacja automatów per seria

### Krok 1: Migracja SQL

Jedna migracja:
1. Dodaj `series_id` (UUID, FK → series) do `automats`
2. Przypisz istniejące automaty do S1
3. Wstaw automaty S2 (AT1/AT2 oba z `has_seat_legs=true`, 2.5cm, 2szt)
4. Upewnij się o poprawne wartości S1 AT1 (16/2) i AT2 (0/0)
5. Ustaw `series_id NOT NULL`
6. Usuń stary unique constraint na `code`, dodaj `UNIQUE(code, series_id)`
7. Usuń kolumny `seat_leg_default`, `seat_leg_height_cm`, `seat_leg_count` z tabeli `series`

### Krok 2: `skuDecoder.ts` — 3 zmiany

1. **Fetch automats** — dodać `.eq("series_id", seriesId)` i wymagać `seriesId` (linia 154-157)
2. **Fetch series** — usunąć `seat_leg_default, seat_leg_height_cm, seat_leg_count` z select (linia 135)
3. **Logika sofaSeatLeg** (linie 319-336) — usunąć priorytet 1 (seria), zastąpić uproszczoną logiką:
   - Jeśli `automatSeatLegs && automatSeatLegHeight > 0`:
     - Gdy `legsDecoded` → nóżki z SKU (S1)
     - Gdy brak → domyślne N4 (S2)

### Krok 3: Panel admina

1. **`AdminLayout.tsx`** — przenieść `{ to: "/admin/automats", label: "Automaty" }` z `sharedLinks` do `seriesLinks`
2. **`Automats.tsx`** — dodać `useOutletContext`, filtrowanie po `series_id`, wstrzykiwanie `series_id` przy submit
3. **`Series.tsx`** — usunąć 3 kolumny/pola `seat_leg_*`, zostawić kod/nazwa/kolekcja

