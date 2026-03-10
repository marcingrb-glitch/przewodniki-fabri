

## Analiza: co jest zduplikowane / hardkodowane

**Duplikacja znaleziona:**
1. **`labels.ts`** — cała logika generowania etykiet jest hardkodowana (jakie etykiety, ile sztuk, co na nich). Tabela `label_templates` została dodana jako konfiguracja, ale generator PDF jej jeszcze **nie używa** — to dwa niezależne źródła prawdy.
2. **`content_template`** w `label_templates` — wolny tekst z placeholderami (`{seat.code}`, `{backrest.finish}`), bez walidacji czy te pola istnieją. Łatwo o literówkę.

**Co działa dobrze:**
- Dane na etykietach pochodzą z obiektu `DecodedSKU`, który jest budowany z tabel DB (seats_sofa, sides, backrests, chests, legs, automats, series_config itd.)
- Tabela `label_templates` jest globalna (sofa/pufa/fotel) — nie per seria.

---

## Czy dzielić szablony per seria?

**Tak — warto dodać opcjonalne `series_id`:**
- Seria S2 nie ma fotela → nie potrzebuje etykiet fotela
- Różne serie mogą mieć inne nóżki, inne automaty, inne dane na etykietach
- `series_id = NULL` → szablon domyślny dla wszystkich serii
- `series_id = konkretna` → nadpisanie dla tej serii

---

## Plan zmian

### 1. Dodać `series_id` do `label_templates`
- Nullable UUID, FK do `series`
- NULL = szablon globalny (domyślny), konkretne ID = override per seria

### 2. Zamienić wolny tekst `content_template` na strukturalne pola
Zamiast `"Siedzisko: {seat.code}\nAutomat: {automat.code}"` → lista pól do wyświetlenia wybierana z dropdowna.

Dostępne pola per komponent (z tabel Wspólne + Specyfikacje):

| Komponent | Źródło tabeli | Dostępne pola |
|---|---|---|
| seat | seats_sofa | code, type_name, model_name, frame, foam, front, spring_type |
| side | sides | code, name, frame, finish (z SKU) |
| backrest | backrests | code, height_cm, frame, foam, top, finish (z SKU) |
| chest | chests | code, name, leg_height_cm, leg_count |
| automat | automats | code, name, type |
| leg | legs | code, name, material, color |
| pufa_seat | seats_pufa | code, front_back, sides, base_foam, box_height |
| pillow | pillows | code, name, finish |

W UI: multi-select pól per etykieta, z podglądem jak będzie wyglądać.

### 3. Dodać filtr po serii w UI
- Dropdown "Seria" obok tabów SOFA/PUFA/FOTEL
- Pokazuje szablony globalne + specyficzne dla wybranej serii
- Przycisk "Nadpisz dla tej serii" kopiuje globalny szablon jako override

### 4. Podłączyć generator PDF do szablonów z bazy
- `labels.ts` będzie czytać `label_templates` z bazy zamiast hardkodu
- Buduje etykiety dynamicznie na podstawie szablonów
- Używa `DecodedSKU` jako źródła wartości

### Implementacja krok po kroku:

**Migracja DB:**
- Dodać kolumnę `series_id uuid REFERENCES series(id)` (nullable) do `label_templates`
- Dodać kolumnę `display_fields text[]` (tablica nazw pól do wyświetlenia, np. `['seat.code', 'automat.code']`)

**UI (`LabelTemplates.tsx`):**
- Dodać dropdown serii na górze
- Zamienić pole tekstowe `content_template` na multi-select z dostępnych pól per komponent
- Podgląd wygenerowanego tekstu etykiety

**Generator (`labels.ts`):**
- Fetch szablonów z `label_templates` (filtr: seria + product_type)
- Iteracja po szablonach, budowanie etykiet z `DecodedSKU` wg `display_fields`
- Usunięcie hardkodowanych funkcji `generateSofaLabelsPDF` / `generatePufaLabelsPDF` / `generateFotelLabelsPDF` → jedna uniwersalna `generateLabelsPDF(decoded, productType)`

