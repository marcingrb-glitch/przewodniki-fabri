

## Plan: Automaty do WSPÓLNE + tabela powiązania z serią

### Koncepcja

Dobry pomysł. Automaty (AT1, AT2) to fizyczne mechanizmy, które mogą być używane w różnych seriach. Parametry nóżek pod siedziskiem (czy są, ile, jakiej wysokości) zależą od serii. Struktura:

| Gdzie | Co przechowuje |
|-------|---------------|
| `automats` (globalne) | `code`, `name`, `type` |
| `series_automats` (junction) | `series_id`, `automat_code`, `has_seat_legs`, `seat_leg_height_cm`, `seat_leg_count` |

Przykład: AT1 w S1 → 2szt, 15cm. AT1 w S2 → 2szt, 2.5cm. AT2 w S1 → brak nóżek. AT2 nie występuje w S2.

### Zmiany

**1. Migracja bazy danych**

```sql
-- Nowa tabela junction
CREATE TABLE series_automats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  series_id uuid NOT NULL REFERENCES series(id) ON DELETE CASCADE,
  automat_code text NOT NULL,
  has_seat_legs boolean NOT NULL DEFAULT false,
  seat_leg_height_cm numeric DEFAULT 0,
  seat_leg_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  UNIQUE(series_id, automat_code)
);
-- RLS: admin CRUD, authenticated read

-- Migracja danych z automats do series_automats
INSERT INTO series_automats (series_id, automat_code, has_seat_legs, seat_leg_height_cm, seat_leg_count)
SELECT series_id, code, has_seat_legs, seat_leg_height_cm, seat_leg_count FROM automats;

-- Deduplikacja automats (zostaw jeden per kod)
DELETE FROM automats a USING automats b WHERE a.code = b.code AND a.created_at > b.created_at;

-- Usuń kolumny series-specific z automats
ALTER TABLE automats DROP CONSTRAINT IF EXISTS automats_series_id_fkey;
ALTER TABLE automats DROP COLUMN series_id;
ALTER TABLE automats DROP COLUMN has_seat_legs;
ALTER TABLE automats DROP COLUMN seat_leg_height_cm;
ALTER TABLE automats DROP COLUMN seat_leg_count;
ALTER TABLE automats ADD CONSTRAINT automats_code_unique UNIQUE (code);

-- FK z series_automats do automats
ALTER TABLE series_automats ADD CONSTRAINT series_automats_automat_code_fkey
  FOREIGN KEY (automat_code) REFERENCES automats(code);
```

**2. AdminLayout.tsx** — dodaj "Automaty" do `sharedLinks`

**3. Automats.tsx** (WSPÓLNE) — usuń `useOutletContext`, `series_id`. Kolumny: kod, nazwa, typ. Prosty CRUD globalny.

**4. Nowy komponent w specyfikacji serii: SeriesAutomats.tsx**
- Tabela pokazuje automaty przypisane do serii (z `series_automats` JOIN `automats`)
- Kolumny: Kod, Nazwa, Typ, Nóżki (tak/nie), Wysokość, Ilość
- CRUD na `series_automats`: dodaj automat (dropdown z globalnych), ustaw parametry nóżek
- Formularz: wybierz automat (select z `automats`), has_seat_legs, seat_leg_height_cm, seat_leg_count

**5. SeriesSpecification.tsx** — dodaj zakładkę "Automaty" (obok Nóżki)

**6. SeriesLegs.tsx** — zmień query: pobieraj automaty z `series_automats` JOIN `automats` zamiast `automats.eq("series_id")`

**7. skuDecoder.ts** — zmień query automatu:
```typescript
// Było: .eq("code", parsed.automat).eq("series_id", seriesId)
// Będzie: pobierz automat globalny + series_automats dla parametrów nóżek
const [automatRes, seriesAutomatRes] = await Promise.all([
  supabase.from("automats").select("code, name, type").eq("code", parsed.automat).maybeSingle(),
  supabase.from("series_automats").select("*").eq("automat_code", parsed.automat).eq("series_id", seriesId).maybeSingle(),
]);
```

**8. NozkiSheet.tsx, KierownikSheet.tsx** — zmień query: `series_automats` JOIN `automats` zamiast `automats.eq("series_id")`

### Co się NIE zmienia
- `skuParser.ts`, `pdfGenerators/*` — bez zmian
- Logika sofaSeatLeg w skuDecoder — ta sama, tylko źródło danych się zmienia

