

## Plan: Eliminacja hardcode'ów z dekodera SKU (nowe zamówienia)

Istniejące zamówienia (z `decoded_data`) pozostają bez zmian. Zmiana dotyczy tylko procesu dekodowania w `decodeSKU()` i konsumentów (`OrderDetailsPage`, generatory PDF).

### Co jest hardcoded i skąd powinno brać dane

| Hardcode | Gdzie | Źródło DB |
|----------|-------|-----------|
| `FINISHES` mapa (A→Szyty, B→Klejony...) | skuDecoder.ts (6 miejsc), labels, guides | tabela `finishes` |
| `SEATS_PUFA` (frontBack, sides, foam, box) | OrderDetailsPage, pufaGuide, labels | tabela `seats_pufa` |
| Pufa nóżki "H 16cm", "4 szt" | OrderDetailsPage, pufaGuide, fotelGuide, labels | tabela `series_config` (pufa_leg_height_cm, pufa_leg_count) |
| Fotel nóżki "H 16cm", "4 szt" | OrderDetailsPage, fotelGuide, labels | tabela `series_config` |
| SK23 → N4 H=2.5cm | skuDecoder.ts linia 308 | tabela `chests` (już ma leg_height_cm) — logika OK, ale N4 hardcoded |

---

### Krok 1: Rozszerz `DecodedSKU` w `types/index.ts`

Dodaj pola:
```typescript
pufaSeat?: { frontBack: string; sides: string; foam: string; box: string };
pufaLegs?: { code: string; height: number; count: number };
fotelLegs?: { code: string; height: number; count: number };
```

### Krok 2: `skuDecoder.ts` — fetch `finishes`, `seats_pufa`, `series_config`

- Dodaj do `Promise.all`: fetch `finishes` (all), `seats_pufa` (by seatCode + seriesId), `series_config` (by seriesId)
- Zbuduj dynamiczną mapę `finishesMap` z DB, fallback na statyczny `FINISHES`
- Użyj `finishesMap` zamiast `FINISHES` we wszystkich miejscach (seatFinishName, sideFinishName, backrestFinishName, pillowFinishName, jaskiFinishName, walekFinishName)
- Wypełnij `pufaSeat` z danych `seats_pufa`
- Wypełnij `pufaLegs` i `fotelLegs` z `series_config` (pufa_leg_height_cm, pufa_leg_count, pufa_leg_type)
- Zwróć nowe pola w obiekcie wynikowym

### Krok 3: `OrderDetailsPage.tsx` — usuń `SEATS_PUFA` import

- Zamień `const pufaSeat = SEATS_PUFA[decoded.seat.code]` na `const pufaSeat = decoded.pufaSeat`
- Zamień hardcoded "H 16cm (4 szt)" na `decoded.pufaLegs` / `decoded.fotelLegs`
- Usuń import `SEATS_PUFA` z `@/data/mappings`

### Krok 4: Generatory PDF — użyj danych z `DecodedSKU`

**`pufaGuide.ts`**: Usuń import `SEATS_PUFA`, użyj `decoded.pufaSeat` i `decoded.pufaLegs`

**`fotelGuide.ts`**: Użyj `decoded.fotelLegs` zamiast "H 16cm", "4 szt"

**`labels.ts`**: Usuń import `SEATS_PUFA`, użyj `decoded.pufaSeat`, `decoded.pufaLegs`, `decoded.fotelLegs`

### Co się NIE zmienia

- Stare zamówienia — `decoded_data` z bazy wyświetlane jak dotąd
- Parser SKU (`skuParser.ts`) — regexy bez zmian
- Tabele i migracje — żadnych zmian w schemacie (wszystkie potrzebne kolumny już istnieją)
- Statyczne mappingi w `mappings.ts` — zostają jako fallback awaryjny w dekoderze

