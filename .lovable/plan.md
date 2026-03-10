

## Dodanie pola "Sprężyna" do przewodników (siedzisko + oparcie)

### Co trzeba zmienić

**`src/pages/AdminPanel/GuideTemplates.tsx`** — dodać 2 pola do `AVAILABLE_FIELDS`:
- `{ value: "seat.springType", label: "Sprężyna", group: "seat" }` (po `seat.midStrip_yn`)
- `{ value: "backrest.springType", label: "Sprężyna", group: "backrest" }` (po `backrest.top`)

### Dlaczego to wystarczy

- `resolveField` w `guideGenerator.ts` ma generyczny resolver dot-path (linia 96-100), który automatycznie rozwiąże `seat.springType` i `backrest.springType` z obiektu `DecodedSKU`
- Dekoder SKU już ustawia `springType` dla obu komponentów
- `fieldLabels.ts` już ma wpisy `"seat.springType": "Sprężyna"` i `"backrest.springType": "Sprężyna"`

Zmiana dotyczy tylko 1 pliku — dodanie 2 linii.

