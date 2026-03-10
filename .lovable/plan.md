

## Rozdzielenie "Kod + wykończenie" na osobne checkboxy

### Co robimy

Zamiast jednego pola `seat.code_finish` (łączonego "Kod + wykończenie"), dodajemy osobne pola:
- `seat.code` — Kod
- `seat.finish_name` — Wykończenie
- analogicznie dla `backrest` i `side`

Stare pola `*.code_finish` zostają jako opcja "łączona" dla kompatybilności wstecznej.

### Zmiany w plikach

**1. `src/pages/AdminPanel/GuideTemplates.tsx`** — rozszerzenie `AVAILABLE_FIELDS`:
```
// seat group — dodać przed code_finish:
{ value: "seat.code", label: "Kod", group: "seat" },
{ value: "seat.finish_name", label: "Wykończenie", group: "seat" },
{ value: "seat.code_finish", label: "Kod + wykończenie (razem)", group: "seat" },

// backrest group:
{ value: "backrest.code", label: "Kod", group: "backrest" },
{ value: "backrest.finish_name", label: "Wykończenie", group: "backrest" },
{ value: "backrest.code_finish", label: "Kod + wykończenie (razem)", group: "backrest" },

// side group:
{ value: "side.code", label: "Kod", group: "side" },
{ value: "side.finish_name", label: "Wykończenie", group: "side" },
{ value: "side.code_finish", label: "Kod + wykończenie (razem)", group: "side" },
```

**2. `src/utils/pdfGenerators/guideGenerator.ts`** — dodanie nowych case w `resolveField`:
```
case "seat.code": return decoded.seat.code;
case "seat.finish_name": return decoded.seat.finishName;
case "backrest.code": return decoded.backrest.code;
case "backrest.finish_name": return decoded.backrest.finishName;
case "side.code": return decoded.side.code;
case "side.finish_name": return decoded.side.finishName;
```

**3. `src/pages/AdminPanel/GuidePreview.tsx`** — dodanie nowych pól w mapie `resolveExampleValue`:
```
"seat.code": v(data.seat?.code),
"seat.finish_name": finishName,
"backrest.code": v(data.backrest?.code),
"backrest.finish_name": finishName,
"side.code": v(data.side?.code),
"side.finish_name": finishName,
```

