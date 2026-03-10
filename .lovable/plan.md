

## Dodanie "Modyfikacja stelaża" + podział siedziska na podgrupy

### 1. `src/types/index.ts` — dodać pole do DecodedSKU

Dodać `frameModification?: string` do obiektu `seat` w interfejsie `DecodedSKU`.

### 2. `src/utils/skuDecoder.ts` — pobrać wartość z DB

- Dodać `let seatFrameModification = ""` (linia ~283)
- W bloku `if (seatSofaRes.data)` (~285): `seatFrameModification = seatSofaRes.data.frame_modification ?? ""`
- W obiekcie `seat:` (~512): dodać `frameModification: seatFrameModification || undefined`

### 3. `src/utils/pdfGenerators/guideGenerator.ts` — resolver

Dodać case w `resolveField`:
```
case "seat.frameModification":
  return decoded.seat.frameModification || "-";
```

### 4. `src/pages/AdminPanel/GuideTemplates.tsx` — podział grupy + nowe pole

**FIELD_GROUPS** — zamienić `{ key: "seat", label: "Siedzisko" }` na:
- `{ key: "seat_frame", label: "Siedzisko — Stolarka" }`
- `{ key: "seat_foam", label: "Siedzisko — Pianki" }`

**AVAILABLE_FIELDS** — zmienić grupy istniejących pól seat:
- `seat.code`, `seat.finish_name`, `seat.code_finish`, `seat.type`, `seat.frame`, `seat.front`, `seat.midStrip_yn`, `seat.springType` → group: `"seat_frame"`
- Nowe: `{ value: "seat.frameModification", label: "Modyfikacja stelaża", group: "seat_frame" }`
- `seat.foams_summary` → group: `"seat_foam"`

### Pliki do edycji
1. `src/types/index.ts` — 1 linia
2. `src/utils/skuDecoder.ts` — 3 linie
3. `src/utils/pdfGenerators/guideGenerator.ts` — 2 linie
4. `src/pages/AdminPanel/GuideTemplates.tsx` — ~12 linii

