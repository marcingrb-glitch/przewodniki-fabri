

## Panel zarządzania przewodnikami PDF

### Idea

Obecnie przewodniki (sofa, pufa, fotel) mają zakodowane na sztywno sekcje i kolumny w plikach TypeScript. Cel: przenieść definicję sekcji do bazy danych, aby admin mógł konfigurować co pojawia się w przewodniku, bez zmian w kodzie.

### Architektura: analogicznie do etykiet

System etykiet (`label_templates` + `label_settings`) już działa na zasadzie: szablon w bazie → generator PDF czyta szablony → renderuje dynamicznie. Przewodniki dostaną identyczny wzorzec.

### Nowa tabela: `guide_sections`

Każdy wiersz = jedna sekcja (tabela) w przewodniku PDF.

| Kolumna | Typ | Opis |
|---|---|---|
| `id` | uuid PK | |
| `product_type` | text | `sofa` / `pufa` / `fotel` |
| `series_id` | uuid? | NULL = globalny, wartość = nadpisanie per seria |
| `section_name` | text | Nazwa sekcji (np. "Siedzisko", "Nóżka") |
| `sort_order` | int | Kolejność sekcji na stronie |
| `is_conditional` | bool | Czy sekcja pojawia się tylko gdy dane istnieją |
| `condition_field` | text? | Ścieżka do pola warunku (np. "pillow", "jaski") |
| `columns` | jsonb | Definicja kolumn: `[{header: "Stelaż", field: "seat.frame"}, ...]` |
| `enabled` | bool | Włączona/wyłączona |

### Logika nadpisywania

Przy generowaniu PDF dla danej serii:
1. Pobierz sekcje z `series_id = ta_seria`
2. Pobierz sekcje globalne (`series_id IS NULL`)
3. Dla każdego `section_name` + `product_type`: jeśli istnieje wersja per seria, użyj jej; w przeciwnym razie użyj globalnej

### Strona admina

Nowa podstrona `/admin/guide-templates` w sekcji "Konfiguracja SKU" na sidebarze. Widok:
- Zakładki: SOFA | PUFA | FOTEL
- Lista sekcji (drag-to-reorder lub sort_order)
- Przycisk dodaj/edytuj sekcję → formularz z:
  - Nazwa sekcji
  - Seria (puste = globalna)
  - Kolumny (dynamiczna lista: nagłówek + ścieżka pola z DecodedSKU)
  - Warunkowa tak/nie + pole warunku
- Podgląd kolejności sekcji

### Migracja danych

Seed: wstawić obecne hardcoded sekcje jako rekordy globalne, aby po wdrożeniu przewodniki wyglądały identycznie jak teraz.

### Zmiany w generatorze PDF

`sofaGuide.ts`, `pufaGuide.ts`, `fotelGuide.ts` → zastąpić jednym uniwersalnym generatorem `guideGenerator.ts`, który:
1. Pobiera sekcje z bazy (z logiką nadpisywania)
2. Iteruje po sekcjach w kolejności `sort_order`
3. Dla każdej sekcji: sprawdza warunek → resolve'uje pola → renderuje tabelę przez `addTable`

### Zakres tego kroku

1. Tabela `guide_sections` + RLS + seed z obecnymi danymi
2. Strona admina do zarządzania sekcjami
3. Nowy uniwersalny generator PDF
4. Routing + link w sidebarze

Szczegóły pól, formatowania i wyglądu → następny krok, jak ustaliliśmy.

### Pliki do utworzenia/edycji

- **Migracja SQL**: tabela `guide_sections` + seed
- `src/pages/AdminPanel/GuideTemplates.tsx` — nowa strona
- `src/utils/pdfGenerators/guideGenerator.ts` — uniwersalny generator
- `src/pages/AdminPanel/AdminLayout.tsx` — link w sidebarze
- `src/App.tsx` — nowa trasa

