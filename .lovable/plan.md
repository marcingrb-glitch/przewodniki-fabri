

## Plan: Pole "wkład" + zmiana "Typ konstrukcji" → "Wygląd" + pola w dekodowaniu

### 1. Migracja bazy danych
Dodanie kolumny `insert_type` (text, nullable) do tabeli `pillows`:
```sql
ALTER TABLE public.pillows ADD COLUMN insert_type text;
```

### 2. `src/pages/AdminPanel/Pillows.tsx`
- Zmienić label kolumny `construction_type` z "Typ konstrukcji" na "Wygląd"
- Zmienić label pola formularza analogicznie
- Dodać kolumnę `insert_type` ("Wkład") w tabeli
- Dodać pole `insert_type` w formularzu jako `select` z opcją `dinaro xl` (na razie jedna)

### 3. `src/pages/AdminPanel/fieldResolver.ts`
Dodać nowe pola do `AVAILABLE_FIELDS` w grupach pillow/jaski/walek:
- `pillow.construction_type` → "Wygląd"
- `pillow.insert_type` → "Wkład"
- `jaski.construction_type` → "Wygląd"
- `jaski.insert_type` → "Wkład"
- `walek.construction_type` → "Wygląd"
- `walek.insert_type` → "Wkład"

Dodać mapowanie w `resolveExampleValue` dla tych pól.

### Pliki do edycji:
- Migracja SQL (dodanie kolumny `insert_type`)
- `src/pages/AdminPanel/Pillows.tsx`
- `src/pages/AdminPanel/fieldResolver.ts`

