

## Usunięcie pól legacy nóg

### Zmiany

**`src/utils/fieldLabels.ts`** — usunąć 3 wpisy:
- `"leg.code"`
- `"leg.height"` 
- `"leg.count"`

**`src/pages/AdminPanel/labels/DisplayFieldsSelector.tsx`** — usunąć 3 wpisy z grupy `leg_chest`:
- `leg.code`
- `leg.height`
- `leg.count`

**`src/utils/pdfGenerators/labels.ts`** — usunąć blok `legAliases` z funkcji `resolveField` (linie z mapowaniem `leg.* → legHeights.sofa_chest.*`).

3 pliki, usunięcie ~15 linii kodu.

