

## Problem

Dwa niezależne problemy:

1. **Brak danych w bazie** — rekord `backrests` dla OP68 + Barga ma `foam = NULL`. To trzeba uzupełnić ręcznie w panelu admina (zakładka Oparcia w specyfikacji S2).

2. **Dekoder nie rozróżnia wariantów oparć** — zapytanie w `skuDecoder.ts` linia 136 filtruje tylko po `code` + `series_id`, ale dla S2 istnieją dwa rekordy OP68 (Barga i Modena/Sienna). `maybeSingle()` może zwrócić błąd lub niewłaściwy wariant.

## Plan naprawy (punkt 2)

### Zmiana w `skuDecoder.ts`

Dekoder zna kod siedziska (`seatCode`) i na jego podstawie może pobrać `model_name` z `seats_sofa`. Następnie użyje `model_name` do filtrowania oparcia:

1. **Po pobraniu danych siedziska** (~linia 190+), wyciągnąć `model_name` z `seatsRes.data`
2. **Zmienić zapytanie o oparcia** — nie może być w `Promise.all` razem z siedziskiem, bo zależy od wyniku siedziska. Przenieść zapytanie o `backrests` po rozwiązaniu siedziska:
   - Jeśli `model_name` istnieje → filtruj `.eq("model_name", modelName)`
   - Jeśli brak → filtruj `.is("model_name", null)` (domyślny wariant)
   - Fallback: jeśli brak wyniku, ponów bez filtra `model_name`

3. **Dodać `model_name` do SELECT w seats_sofa** (linia 130) — obecnie nie jest pobierane

### Wpływ

- Żadnych zmian w bazie danych
- Żadnych zmian w UI
- Poprawne dekodowanie oparć dla serii z wieloma wariantami (S2)
- Wsteczna kompatybilność: serie z jednym wariantem (S1) działają bez zmian

### Pliki do edycji

- `src/utils/skuDecoder.ts` — refaktor zapytania o backrests + dodanie `model_name` do query seats_sofa

