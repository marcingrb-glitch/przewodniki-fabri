

## Plan: Globalne nóżki + ilości przy źródle danych

### Koncepcja

Dobry pomysł — dane o ilościach i wysokościach nóżek powinny żyć tam, gdzie naturalnie należą:

| Element | Wysokość nóżek | Ilość nóżek | Gdzie już jest / co dodać |
|---------|----------------|-------------|--------------------------|
| Skrzynia | `chests.leg_height_cm` (jest) | **dodać `chests.leg_count`** | tabela `chests` |
| Siedzisko | `automats.seat_leg_height_cm` (jest) | `automats.seat_leg_count` (jest) | tabela `automats` — już kompletne |
| Pufa | `series_config.pufa_leg_height_cm` (jest) | **dodać `series_config.pufa_leg_count`** | tabela `series_config` |
| Fotel | stałe 15cm | stałe 4szt | zostaje w logice (lub przyszła konfiguracja) |

Nóżki same w sobie (kod, nazwa, materiał, kolory, kto kompletuje) stają się **globalnym zasobem** w sekcji WSPÓLNE.

### Zmiany

**1. Migracja bazy danych**
```sql
-- Nóżki: dodaj completed_by, usuń series_id, dodaj UNIQUE(code)
ALTER TABLE legs ADD COLUMN completed_by text 
  DEFAULT 'Dziewczyny od nóżek (kompletacja do worka)';
UPDATE legs SET completed_by = 'Tapicer (na stanowisku)' WHERE code = 'N4';
DELETE FROM legs a USING legs b WHERE a.code = b.code AND a.created_at > b.created_at;
ALTER TABLE legs DROP COLUMN series_id;
ALTER TABLE legs ADD CONSTRAINT legs_code_unique UNIQUE (code);

-- Skrzynie: dodaj ilość nóżek (domyślnie 4)
ALTER TABLE chests ADD COLUMN leg_count integer DEFAULT 4;

-- Series config: dodaj ilość nóżek pufy (domyślnie 4)
ALTER TABLE series_config ADD COLUMN pufa_leg_count integer DEFAULT 4;
```

**2. AdminLayout.tsx** — dodaj "Nóżki" do `sharedLinks` (sekcja WSPÓLNE)

**3. Legs.tsx** — usuń `useOutletContext`, `filterColumn`, `series_id` injection. Dodaj kolumnę `completed_by` do tabeli i formularza.

**4. Chests.tsx** — dodaj kolumnę `leg_count` do tabeli i formularza

**5. SeriesLegs.tsx** — usuń formularz CRUD nóżek (przeniesiony do WSPÓLNE). Zostaw read-only podgląd globalnych nóżek. Tabela "Kto co kompletuje" pobiera `completed_by` z `legs`, `leg_count` z `chests`, `seat_leg_count` z `automats`, `pufa_leg_count` z `series_config`.

**6. skuDecoder.ts** — linia 153-154: usuń `.eq("series_id", seriesId)` z query do `legs`

**7. NozkiSheet.tsx i KierownikSheet.tsx** — usuń filtrowanie po `series_id` w query do `legs`, używaj `completed_by` z rekordu

### Co się NIE zmienia
- `skuParser.ts`, `pdfGenerators/*` — bez zmian
- `automats` — już ma `seat_leg_height_cm` i `seat_leg_count`
- RLS na `legs` — bez zmian (te same polityki, brak series_id w warunkach)

