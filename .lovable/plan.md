

## Plan: Konfigurowalny podgląd dekodowania (jak przewodniki)

### Cel
Dodanie możliwości konfigurowania sekcji i pól w podglądzie dekodowania — analogicznie do przewodników (GuideTemplates). Pola będą wybierane z selektora, a dane będą pobierane z bazy.

### Podejście
Reużycie istniejącej tabeli `guide_sections` z nowym `product_type = "decoding"`. Dzięki temu cały mechanizm CRUD (dodawanie sekcji, edycja kolumn, sortowanie, warunkowe sekcje) działa od razu.

### Zmiany

**1. `src/pages/AdminPanel/DecodingTemplates.tsx`**
- Dodać pełne UI zarządzania sekcjami (lista sekcji, dodawanie, edycja, usuwanie, reorder) — skopiowane z GuideTemplates ale uproszczone (bez tabów sofa/pufa/fotel, jeden typ "decoding")
- Zachować selektor serii i przyciski PDF
- Wczytywanie sekcji z `guide_sections` filtrowane po `product_type = "decoding"`
- Dialog dodawania/edycji sekcji z field pickerem (checkboxy pogrupowane)
- Reużycie stałych `AVAILABLE_FIELDS` i `FIELD_GROUPS` z GuideTemplates (wyeksportować je lub przenieść do wspólnego pliku)

**2. `src/pages/AdminPanel/DecodingPreview.tsx`**
- Przerobić z hardcoded sekcji na dynamiczne — jak GuidePreview
- Przyjmować `sections` jako prop (zamiast `decoded`)
- Używać `resolveExampleValue` do mapowania pól na dane z bazy
- Renderować sekcje z konfigurowalnymi kolumnami

**3. `src/pages/AdminPanel/GuideTemplates.tsx`**
- Wyeksportować `AVAILABLE_FIELDS`, `FIELD_GROUPS`, `CONDITION_FIELDS` aby mogły być reużyte w DecodingTemplates

**4. Wspólny resolver danych**
- Przenieść `resolveExampleValue` z GuidePreview do wspólnego pliku (np. `src/pages/AdminPanel/fieldResolver.ts`) aby był reużywalny

### Bez zmian w bazie danych
Reużycie tabeli `guide_sections` z `product_type = "decoding"` — nie potrzeba nowej migracji.

### Pliki do edycji:
- `src/pages/AdminPanel/DecodingTemplates.tsx` — przebudowa na CRUD sekcji z field pickerem
- `src/pages/AdminPanel/DecodingPreview.tsx` — dynamiczne sekcje z danymi z bazy
- `src/pages/AdminPanel/GuideTemplates.tsx` — eksport stałych
- `src/pages/AdminPanel/fieldResolver.ts` — nowy plik, wyekstrahowany resolver

