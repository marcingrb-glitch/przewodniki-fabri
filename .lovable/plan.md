

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

