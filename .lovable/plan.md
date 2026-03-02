

## Plan: Migracja parsingu SKU do bazy danych

Plan jest dobrze przemyslany. Poniżej doprecyzowana wersja z uwzględnieniem obecnego kodu.

---

### Krok 1: Migracja SQL — 3 nowe tabele + dane początkowe

Jedna migracja SQL tworząca:

1. **`sku_parse_rules`** — reguły parsowania per seria (series_id, component_type, zero_padded, notes)
2. **`side_exceptions`** — wyjątki boczków per seria (series_id, original_code, mapped_code, description, active)
3. **`seat_types`** — typy siedzisk (code, name)

RLS: authenticated read, admin write (używając `has_role()` zamiast bezpośredniego query na user_roles).

Dane początkowe: 2 wyjątki boczków S1, 6 typów siedzisk, reguły parsowania S1 (zero_padded=true) i S2 (zero_padded=false).

---

### Krok 2: Modyfikacja `skuParser.ts`

- Usunąć statyczną mapę `SIDE_EXCEPTIONS`
- `parseSKU()` przyjmuje opcjonalny parametr `sideExceptions?: Record<string, string>`
- Logika mapowania boczków używa tego parametru zamiast hardkodowanej mapy

---

### Krok 3: Modyfikacja `skuDecoder.ts`

Na początku `decodeSKU()`:
- Pobrać `side_exceptions` z DB dla danej serii → przekazać do `parseSKU()`
- Pobrać `sku_parse_rules` dla danej serii → użyć `zero_padded` w `findSeatInDB()` zamiast zawsze próbować zero-padding
- Pobrać `seat_types` z DB → użyć zamiast statycznego `SEAT_TYPES`
- Pobrać `extras` z DB (series-specific) → zastąpić statyczny `EXTRAS`

Fallbacki na statyczne mappingi zachowane (nullish coalescing).

---

### Krok 4: Nowa strona admina `/admin/sku-config`

Plik `src/pages/AdminPanel/SKUConfig.tsx` z 3 tabkami:

- **Tab 1: Reguły parsowania** — CRUD na `sku_parse_rules`, filtrowane po wybranej serii z sidebara
- **Tab 2: Wyjątki boczków** — CRUD na `side_exceptions`, filtrowane po serii, toggle aktywny/nieaktywny
- **Tab 3: Typy siedzisk** — CRUD na `seat_types`, wspólne dla wszystkich serii

Użyje istniejącego hooka `useAdminCrud` i komponentów `DataTable`/`ComponentForm`.

---

### Krok 5: Routing + Sidebar

- `AdminLayout.tsx` — dodać link `{ to: "/admin/sku-config", label: "Konfiguracja SKU" }` do `sharedLinks`
- `App.tsx` — dodać `<Route path="sku-config" element={<SKUConfig />} />`

---

### Krok 6: Oznaczenie `mappings.ts` jako legacy fallback

Dodać komentarze przy `SEAT_TYPES`, `DEFAULT_FINISHES`, `EXTRAS`, `SIDE_EXCEPTIONS` (usunięte z parsera) — wskazujące że główne źródło danych to baza.

---

### Szczegóły techniczne

**RLS policies** — użycie `has_role(auth.uid(), 'admin'::app_role)` (zgodnie z istniejącym wzorcem) zamiast bezpośredniego EXISTS na user_roles.

**findSeatInDB()** — nowa sygnatura: `findSeatInDB(code, seriesId, zeroPadded)`. Gdy `zeroPadded=false`, pomija próbę zero-paddingu.

**Extras z DB** — dodać do parallel fetch w `decodeSKU()`:
```
supabase.from("extras").select("code, name, type").eq("series_id", seriesId)
```
i użyć wyników zamiast statycznego `EXTRAS`.

