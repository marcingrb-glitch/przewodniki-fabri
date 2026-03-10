

## Podgląd etykiety z realnymi danymi z bazy

### Problem
Konfigurator etykiet używa zahardkodowanych przykładowych wartości (`EXAMPLE_VALUES`) — "S1-01", "Bonell", "Nóżka okrągła" itd. — które nie odpowiadają rzeczywistym danym w bazie. Użytkownik widzi bzdury zamiast realnych wartości.

### Rozwiązanie
Przy otwarciu konfiguratora pobrać pierwszy wiersz z odpowiednich tabel DB i zbudować `EXAMPLE_VALUES` dynamicznie.

### Zapytania do bazy

Przy montowaniu konfiguratora (lub zmianie `template.component`) — jedno `useQuery` pobierające:

| Komponent | Tabela | Kolumny |
|---|---|---|
| seat | `seats_sofa` | code, frame, front, type, spring_type, center_strip |
| side | `sides` | code, name, frame |
| backrest | `backrests` | code, height_cm, frame, top, spring_type |
| chest | `chests` | code, name, leg_height_cm, leg_count |
| automat | `automats` | code, name, type |
| series | `series` | code, name (do lewej strefy) |

Dla `finish`, `finishName`, `foamsList` — wstawić fallback "A" / "Zwykły" / "—" bo te wartości zależą od SKU, nie od tabeli komponentu.

### Zmiany w plikach

**`src/pages/AdminPanel/labels/LabelConfigurator.tsx`**:
1. Usunąć statyczny obiekt `EXAMPLE_VALUES`
2. Dodać `useQuery` z kluczem `["label-example-data"]` pobierający po jednym wierszu z każdej tabeli
3. Zbudować dynamiczny `exampleValues: Record<string, string>` z wyników zapytań, mapując kolumny DB na ścieżki pól (np. `seats_sofa.frame` → `"seat.frame"`, `backrests.height_cm` → `"backrest.height"`)
4. Użyć `exampleValues` zamiast `EXAMPLE_VALUES` w `previewLines` i `LEFT_FIELD_EXAMPLES`
5. Pola bez danych w bazie → wyświetlić "(brak)" zamiast "???"

Brak zmian w DB, brak zmian w PDF — to dotyczy wyłącznie podglądu w konfiguratorze.

