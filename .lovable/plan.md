


## Plan: Reorganizacja Konfiguracji SKU + eliminacja seat_types

### Krok 1: Migracja SQL — dodaj `type_name` do `seats_sofa`

Dodaj kolumnę `type_name TEXT` i wypełnij na podstawie istniejącej kolumny `type` (N→Niskie, ND→Niskie dzielone, NB→Niskie oba półwałki, W→Wysokie, D→Zwykły).

### Krok 2: AdminLayout.tsx — przeorganizuj linki

- Usuń `{ to: "/admin/sku-config", label: "🔧 Konfiguracja SKU" }` z `sharedLinks`
- Dodaj do `seriesLinks`: `parse-rules` (Reguły parsowania), `side-exceptions` (Wyjątki boczków)

### Krok 3: Nowe pliki — ParseRules.tsx i SideExceptions.tsx

Wydzielenie `ParseRulesTab` i `SideExceptionsTab` z SKUConfig.tsx do samodzielnych komponentów z `useOutletContext` i `series_id` injection (wzorzec identyczny jak Automats.tsx).

### Krok 4: App.tsx — routing

- Usuń import SKUConfig i route `sku-config`
- Dodaj importy i route'y: `parse-rules`, `side-exceptions`

### Krok 5: skuDecoder.ts — uprość seat types

- Zamień fetch `seat_types` na `Promise.resolve({ data: null })`
- Usuń budowanie mapy z DB, zostaw tylko statyczny fallback
- Dodaj `type_name` do select `seats_sofa`
- Uprość logikę typeName: `seatSofaRes.data.type_name || SEAT_TYPES[seatType] || seatType`

### Krok 6: SeatsSofa.tsx — dodaj pola type_name

- Zmień kolumnę `type` na `type (kod)`, dodaj `type_name (nazwa)`
- Analogicznie w fields

### Krok 7: Usuń SKUConfig.tsx

Plik nie jest już potrzebny.

---

## Etap 2: Migracja na nowy system products/sku_segments

### Etap 2.0: Walidacja sku_segments ✅

Diagnostyka regex w `sku_segments` vs realne SKU. Wynik: 132/134 segmentów matchuje, 2 tkaniny Shopify (KIARA_866, RAVEN_18) nie matchują standardowego wzorca — to expected behavior.

### Etap 2.1: Nowy Generic SKU Parser ✅

- Utworzono `src/utils/skuParserGeneric.ts` — async parser z cache, czyta reguły z `sku_segments` i side exceptions z `product_relations`
- Zmieniono `src/utils/skuValidator.ts` na async (`validateSKU` → `async function`)
- Zaktualizowano callsites: `OrderForm.tsx`, `ShopifyOrderForm.tsx`, `OrderHistoryPage.tsx` — importy + await
- Stary `skuParser.ts` zostaje jako fallback (nie usunięty)

### Etap 2.2: Nowy Generic SKU Decoder (TODO)

### Etap 2.3: Cleanup starych tabel (TODO)

---

## Etap 3: Eliminacja starej tabeli `series`

### Etap 3A: Przełączenie queries `from("series")` → `from("products")` ✅

- Migracja SQL: FK `guide_sections.series_id` i `label_templates.series_id` przepięte ze starej `series` na `products`
- 8 plików: mechaniczne podmianki `from("series")` → `from("products").eq("category","series")`
- `finishValidator.ts`: 4 stare tabele (`seats_sofa`, `sides`, `backrests`, `pillows`) → `products`
- Zostały 2 referencje w plikach mock data (GuidePreview, LabelConfigurator) — krok B

### Etap 3B: Preview/mock refaktor (TODO)

### Etap 3C: Drop starej tabeli `series` (TODO)
