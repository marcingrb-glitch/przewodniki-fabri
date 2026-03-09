

## Etap 1: Migracja bazy danych — nowe tabele + kolumny + dane seed

### Zakres
Tylko zmiany w bazie danych. Zero zmian w plikach React/TypeScript.

### Krok 1: Migracja DDL (schema changes)
Jedna migracja SQL zawierająca:

1. **4 nowe tabele** z RLS:
   - `product_foams` — pianki per model/siedzisko (authenticated mogą read/insert/update, admin delete)
   - `seat_side_compatibility` — macierz kompatybilności boczek ↔ siedzisko (admin CRUD, public read)
   - `series_config` — konfiguracja stałych per seria (admin CRUD, public read)
   - `seat_pillow_mapping` — powiązanie siedzisko → poduszka (admin CRUD, public read)

2. **3 nowe kolumny** w `seats_sofa`:
   - `model_name TEXT`
   - `frame_modification TEXT`
   - `spring_type TEXT DEFAULT 'B'`

### Krok 2: Dane seed (insert tool, nie migracja)
Osobne wywołania insert tool dla:
- `series_config` — konfiguracja S1 i S2
- `seats_sofa` UPDATE — model_name, frame_modification, spring_type dla S2
- `seat_side_compatibility` — macierz S2 (30 wierszy: 5 siedzisk × 6 boczków)
- `seat_pillow_mapping` — 5 wierszy S2
- `product_foams` — ~25 wierszy pianek S2 (Modena, Ravenna, Sienna, Porto, Barga)

### Bez zmian
- Zero plików .tsx/.ts
- Zero usuwania istniejących tabel/kolumn
- Istniejąca aplikacja działa identycznie

