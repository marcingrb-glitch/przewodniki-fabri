

## Plan: Dodanie `available_chests` do `series_config` i filtrowanie skrzyń per seria

### 1. Migracja bazy danych
Dodaj kolumnę `available_chests TEXT[]` do `series_config` + ustaw wartości per seria:
```sql
ALTER TABLE public.series_config ADD COLUMN IF NOT EXISTS available_chests TEXT[] DEFAULT ARRAY['SK15','SK17','SK23'];
UPDATE series_config SET available_chests = ARRAY['SK15','SK17','SK23'] WHERE series_id = (SELECT id FROM series WHERE code = 'S1');
UPDATE series_config SET available_chests = ARRAY['SK23'] WHERE series_id = (SELECT id FROM series WHERE code = 'S2');
```

### 2. SeriesOverview.tsx — rozbudowa karty "Stałe elementy"
- Pobrać `chests` z bazy, filtrować po `config.available_chests` (nowa kolumna, dostępna jako `(config as any).available_chests` do czasu regeneracji typów)
- Dla S2: wyświetlić info "Skrzynia: zawsze SK22 (alias → SK23). Nóżki plastikowe N4 H2.5cm." — bazując na `fixed_chest` i `available_chests`
- Dodać nową kartę "Skrzynie dostępne w serii" z listą skrzyń filtrowanych po `available_chests`

### 3. NozkiSheet.tsx — filtrowanie skrzyń per seria
- Zmienić query `cheat-chests` żeby pobierał wszystkie skrzynie, ale filtrował po `config.available_chests`
- Sekcja "CO KOMPLETOWAĆ" — iterować po dostępnych skrzyniach zamiast tylko `fixed_chest`

### 4. SeriesLegs.tsx — dodanie info o skrzyniach
- Pobrać `chests` filtrowane po `config.available_chests`
- Wyświetlić w "Kto co montuje" info per skrzynia zamiast tylko `fixed_chest`

### 5. KierownikSheet.tsx — filtrowanie skrzyń
- Analogicznie filtrować skrzynie po `available_chests` z config

### Pliki do zmiany
- `src/pages/AdminPanel/spec/SeriesOverview.tsx` — karta skrzyń + info S2
- `src/pages/AdminPanel/spec/SeriesLegs.tsx` — skrzynie w montażu
- `src/pages/AdminPanel/cheatsheets/NozkiSheet.tsx` — filtrowanie skrzyń
- `src/pages/AdminPanel/cheatsheets/KierownikSheet.tsx` — filtrowanie skrzyń

