

## Plan: Konfigurowalne nóżki pod siedziskiem sofy

### Krok 1: Migracja SQL — nowe kolumny

**Tabela `series`** — 3 nowe kolumny:
- `seat_leg_default` (boolean, default false)
- `seat_leg_height_cm` (numeric, nullable)
- `seat_leg_count` (integer, nullable)

Dane: S1 → false, S2 → true/2.5/2

**Tabela `automats`** — 2 nowe kolumny:
- `seat_leg_height_cm` (numeric, default 0)
- `seat_leg_count` (integer, default 0)

Dane: AT1 → 16/2, AT2 → 0/0

### Krok 2: `skuDecoder.ts` — 3 zmiany

1. **Fetch series** — dodać `seat_leg_default, seat_leg_height_cm, seat_leg_count` do select (linia z series query)
2. **Fetch automats** — dodać `seat_leg_height_cm, seat_leg_count` do select; zmienić `const` na `let` dla `automatSeatLegHeight`/`automatSeatLegCount` i nadpisać z DB (linie 274-281)
3. **Logika sofaSeatLeg** (linie 317-319) — zamienić na dwupoziomową:
   - Priorytet 1: `seriesRes.data?.seat_leg_default` → stałe nóżki serii (N4, height/count z serii)
   - Priorytet 2: `automatSeatLegs && legsDecoded` → nóżki z automatu (obecna logika)

### Krok 3: Panel admina

**`Series.tsx`** — dodać 3 kolumny i 3 pola formularza (wbudowane nóżki, wysokość, ilość)

**`Automats.tsx`** — dodać 2 kolumny i 2 pola formularza (wysokość nóżek, ilość nóżek)

### Szczegóły techniczne

Zmiana w dekoderze nie wymaga modyfikacji typu `DecodedSKU` — `legHeights.sofa_seat` już ma odpowiednią strukturę `{ leg: string; height: number; count: number } | null`.

Statyczne fallbacki w `AUTOMATS` mappingu nadal działają dla `seatLegHeight`/`seatLegCount` gdy DB nie zwraca danych.

