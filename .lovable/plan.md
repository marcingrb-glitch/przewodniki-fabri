

## Filtr serii w szablonach przewodników

### Stan obecny
- Tabela `guide_sections` już ma kolumnę `series_id` (null = globalny)
- Logika override w generatorze PDF już działa (per `section_name` — seria nadpisuje global)
- UI pokazuje wszystkie sekcje flat z kolumną "Seria", ale brak filtra — ciężko zarządzać gdy jest dużo serii

### Zmiany

**`src/pages/AdminPanel/GuideTemplates.tsx`**

1. Dodać state `selectedSeriesId` (domyślnie `"__global__"` = sekcje globalne)
2. Dodać dropdown filtra serii obok przycisku "Dodaj sekcję" — opcje: "Globalny (wszystkie serie)" + lista serii z DB
3. Zmienić `filtered` żeby oprócz `product_type` filtrował też po `series_id`:
   - `"__global__"` → `series_id === null`
   - konkretna seria → `series_id === selectedSeriesId`
4. Przy dodawaniu nowej sekcji (`openAdd`) — ustawiać `series_id` z aktualnego filtra (jeśli wybrana konkretna seria)
5. Podgląd (`GuidePreview`) — przekazać `selectedSeriesId` żeby pokazywał sekcje w kontekście wybranej serii (globalne + nadpisania)
6. Usunąć kolumnę "Seria" z tabeli (bo teraz filtrujemy po niej)

**`src/pages/AdminPanel/GuidePreview.tsx`**
- Przyjąć opcjonalny prop `seriesId` i wyświetlać w podglądzie info o serii

### Efekt
Użytkownik wybiera serię z dropdowna → widzi tylko sekcje tej serii (lub globalne). Dodając sekcję, automatycznie przypisuje ją do wybranej serii. Tak jak w etykietach.

