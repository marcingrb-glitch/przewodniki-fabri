

## Plan: Model name jako multi-select z siedzisk

### Problem
Pole `model_name` w oparciach jest wpisywane ręcznie jako tekst. Powinno być multi-selectem z unikalnymi nazwami modeli pobranymi z tabeli `seats_sofa` dla danej serii.

### Zmiany w `SeriesBackrests.tsx`

1. **Fetch modeli z `seats_sofa`** — w `fetchAll` dodaj query:
```typescript
supabase.from("seats_sofa").select("model_name").eq("series_id", seriesId).not("model_name", "is", null)
```
Wyciągnij unikalne wartości → np. `["Modena", "Sienna", "Porto", "Ravenna", "Barga"]`

2. **Zmień pole `model_name` w `backrestFields`** — z `type: "text"` na `type: "multi-select"` z dynamicznymi opcjami pobranymi z seats_sofa. Opcje generowane przy renderze formularza.

3. **Zmień format zapisu** — `model_name` zapisywany jako `"Modena / Sienna / Porto"` (join z ` / `) żeby zachować kompatybilność z istniejącym kodem (renderowanie, matching wariantów szycia).

4. **Inline edit w karcie** — zamień `InlineEditCell` dla modelu na Popover z checkboxami (analogicznie do planu na warianty szycia). Badge'e z wybranymi modelami + możliwość zmiany.

5. **Kolumna Modele w wariantach szycia** — ten sam mechanizm: Popover z checkboxami z listy modeli z `seats_sofa`, zamiast statycznych badge'ów.

### Plik do edycji
- `src/pages/AdminPanel/spec/SeriesBackrests.tsx`

