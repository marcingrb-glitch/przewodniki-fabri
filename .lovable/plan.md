

## Problem

SKU `S2-T2D-SD1-B1B-OP68A-SK23-AT1-P2C` — pianki oparcia są źle dekodowane. Wyświetlają się pianki z **obu** wariantów oparcia OP68 (Modena + Barga) zamiast tylko z właściwego.

### Przyczyna źródłowa

Dane w bazie:
- **Siedzisko SD1** (S2) ma `model_name = "Modena"`
- **Oparcie OP68** (S2) ma dwa warianty:
  - `model_name = "Modena / Sienna / Porto / Ravenna"` (id: 3e8537fe) — **poprawny**
  - `model_name = "Barga"` (id: 1608086a) — **niepoprawny dla tego SKU**

Linia 176 w `skuDecoder.ts` robi **exact match**: `.eq("model_name", "Modena")`, ale w bazie wartość to `"Modena / Sienna / Porto / Ravenna"` — nie pasuje.

Fallback szuka `model_name IS NULL` — też nie istnieje. Więc `backrestsRes.data = null`, `backrestId = null`.

Gdy `backrestId = null`, logika filtrowania pianek (linia 243) przepuszcza **wszystkie** pianki oparcia niezależnie od `backrest_id` — stąd pianki z wariantu Barga mieszają się z Modena.

## Rozwiązanie

### Zmiana w `skuDecoder.ts` — dopasowanie oparcia po częściowym `model_name`

Zamiast `.eq("model_name", seatModelName)`, użyj `.ilike("model_name", "%Modena%")` — sprawdza czy model_name **zawiera** nazwę modelu siedziska.

**Konkretnie (linia 170-189)**:

1. Zamień `.eq("model_name", seatModelName)` na `.ilike("model_name", `%${seatModelName}%`)`
2. Reszta logiki (fallback na `model_name IS NULL`, potem `anyBackrest`) — bez zmian

To wystarczy, bo:
- `"Modena"` pasuje do `"Modena / Sienna / Porto / Ravenna"` ✓
- `"Barga"` nie pasuje do `"Modena / Sienna / Porto / Ravenna"` ✓
- Gdy backrest zostanie znaleziony poprawnie, `backrestId` będzie ustawiony → filtrowanie pianek będzie działać prawidłowo

### Wpływ

Jedna zmiana w jednej linii — naprawia zarówno dopasowanie oparcia (stelaż, sprężyny), jak i pianek oparcia dla wszystkich serii z wielomodelowymi nazwami oparć.

