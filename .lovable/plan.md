

## Problem

PDF dekodowania nie wyświetla poprawnych wartości dla kilku pól, ponieważ `skuDecoder.ts` **nie pobiera wszystkich kolumn z bazy**, a typ `DecodedSKU` **nie ma pól** `constructionType` / `insertType` dla poduszek, jaśków i wałków.

### Konkretne luki:

1. **Poduszki** — tabela `pillows` ma kolumny `construction_type` i `insert_type`, ale decoder pobiera tylko `code, name, default_finish, allowed_finishes`. Te pola nigdy nie trafiają do `DecodedSKU`, więc `resolveDecodedField` zwraca `"-"` dla `pillow.construction_type` i `pillow.insert_type`.

2. **Jaśki / Wałki** — tabele `jaskis` i `waleks` **nie mają** kolumn `construction_type` / `insert_type` w bazie. Pola te są zdefiniowane w `AVAILABLE_FIELDS` i wyświetlane w podglądzie, ale dane nie istnieją. Trzeba dodać te kolumny do tabel DB.

3. **Typ `DecodedSKU`** — interfejsy `pillow`, `jaski`, `walek` nie mają `constructionType` / `insertType`, dlatego resolver używa `as any` — zawsze `undefined`.

### Naprawa

#### 1. Migracja DB — dodaj brakujące kolumny do `jaskis` i `waleks`
```sql
ALTER TABLE public.jaskis ADD COLUMN construction_type text;
ALTER TABLE public.jaskis ADD COLUMN insert_type text;
ALTER TABLE public.waleks ADD COLUMN construction_type text;
ALTER TABLE public.waleks ADD COLUMN insert_type text;
```

#### 2. `src/types/index.ts` — rozszerz typy pillow/jaski/walek
Dodaj `constructionType?: string` i `insertType?: string` do interfejsów `pillow`, `jaski`, `walek` w `DecodedSKU`.

#### 3. `src/utils/skuDecoder.ts` — pobierz brakujące pola
- Poduszki: zmień select na `code, name, default_finish, allowed_finishes, construction_type, insert_type`
- Jaśki: zmień select na `code, name, construction_type, insert_type`
- Wałki: zmień select na `code, name, construction_type, insert_type`
- Przypisz `constructionType` i `insertType` do decoded obiektów

#### 4. `src/utils/pdfGenerators/decodingFieldResolver.ts` — usuń `as any` casty
Zamień `(decoded.pillow as any)?.constructionType` na `decoded.pillow?.constructionType` (analogicznie dla jaski/walek).

