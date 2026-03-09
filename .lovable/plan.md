

## Plan: Rozbudowa panelu specyfikacji o inline editing, CRUD i dane z istniejących tabel

Wszystkie taby specyfikacji już czytają z poprawnych tabel (seats_sofa, sides, backrests, legs, automats, seats_pufa, chests). Główne zmiany to: dodanie inline editing do wszystkich komórek, dodanie przycisków Dodaj/Edytuj/Usuń per wiersz, oraz uproszczenie taba Przegląd.

### Pliki do zmiany

#### 1. `SeriesModels.tsx` — dodaj inline editing pól siedziska
- Każde pole siedziska (code, type, type_name, frame, foam, front, spring_type, model_name, frame_modification) edytowalne inline przez `InlineEditCell`
- center_strip jako Checkbox inline
- allowed_finishes/default_finish — edytowalne przez klik → dialog ComponentForm
- Dodaj przycisk "Dodaj siedzisko" (insert do seats_sofa z series_id)
- Dodaj ikonki Edit (otwiera ComponentForm) i Delete (AlertDialog) per siedzisko
- Puste pola: szare tło + "uzupełnij" (już obsłużone przez InlineEditCell)

#### 2. `SeriesSides.tsx` — inline editing + CRUD
- Każde pole (code, name, frame) edytowalne inline
- allowed_finishes, default_finish — renderuj jako tekst, edit przez ComponentForm dialog
- Dodaj przycisk "Dodaj boczek" + ikony Edit/Delete per wiersz
- useAdminCrud lub bezpośredni supabase.update/insert/delete z fetchAll() po zmianach

#### 3. `SeriesBackrests.tsx` — inline editing + CRUD
- Każde pole (code, height_cm, frame, foam, top) edytowalne inline
- allowed_finishes/default_finish — edit przez dialog
- Przycisk "Dodaj oparcie" + Edit/Delete per wiersz

#### 4. `SeriesLegs.tsx` — inline editing nóżek + CRUD
- Tabela nóżek: code, name, material edytowalne inline
- colors — renderuj jako `A=Buk, B=...`, edit przez ComponentForm z type "colors"
- Przycisk "Dodaj nóżkę" + Edit/Delete per wiersz
- Tabela "Kto co kompletuje" — pozostaje read-only (wyliczana dynamicznie)

#### 5. `SeriesPufa.tsx` — inline editing + CRUD
- Każde pole (code, front_back, sides, base_foam, box_height) edytowalne inline
- Przycisk "Dodaj siedzisko pufy" + Edit/Delete per wiersz

#### 6. `SeriesOverview.tsx` — uprość
- Usuń kartę "Nóżki pod siedziskiem" (dane są w automats, widoczne w tabie Nóżki)
- Sprężyna: pobierz z seats_sofa.spring_type, wyświetl podsumowanie np. "Sprężyna B (wyjątek: SD5 = A)"
- Reszta bez zmian (stałe elementy, skrzynie, notatki)

#### 7. `SeriesFotel.tsx` — popraw Badge "Montaż"
- Zmień "Montaż: Dziewczyny od nóżek" → "Kompletacja: Dziewczyny od nóżek (kompletacja do worka)"

### Wzorzec edycji

Dla prostych pól tekstowych/numerycznych: `InlineEditCell` (już istnieje) → `supabase.from(table).update({field: value}).eq("id", id)` → toast → refetch.

Dla złożonych pól (allowed_finishes, colors): ikona Edit → `ComponentForm` dialog z odpowiednimi `FieldDefinition[]` → submit → refetch.

Dla dodawania: przycisk "Dodaj" → `ComponentForm` z pustymi danymi → insert z `series_id` → refetch.

Dla usuwania: ikona Trash → `AlertDialog` potwierdzenie → delete → refetch.

### Kluczowe zasady
- NIE modyfikujemy skuParser.ts, skuDecoder.ts, pdfGenerators
- NIE tworzymy nowych tabel
- Toast po każdym zapisie
- Puste pola: szare tło + "uzupełnij" (InlineEditCell)

