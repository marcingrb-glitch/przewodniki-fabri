

## Plan: Format leg type labels in KierownikSheet and SeriesOverview

### Changes

**1. `src/pages/AdminPanel/cheatsheets/KierownikSheet.tsx`**

Add `formatLegType` helper function (after existing `formatColors`):
```typescript
const formatLegType = (type: string | null, height: number | null): string => {
  if (!type) return '—';
  switch (type) {
    case 'built_in_plastic': return `N4 plastikowe wbudowane, H${height}cm`;
    case 'plastic_2_5': return `N4 plastikowe, H${height}cm`;
    case 'from_sku': return `Z segmentu N (z SKU), H${height}cm`;
    default: return `${type}, H${height}cm`;
  }
};
```

Replace lines 148-149:
- Line 148: `{config.seat_leg_type ?? "from_sku"}, H{...}cm` → `{formatLegType(config.seat_leg_type, config.seat_leg_height_cm)}`
- Line 149: `{config.pufa_leg_type ?? "from_sku"}, H{...}cm` → `{formatLegType(config.pufa_leg_type, config.pufa_leg_height_cm)}`

**2. `src/pages/AdminPanel/spec/SeriesOverview.tsx`**

Replace the existing `LEG_TYPE_LABELS` approach (lines 22-26, 99-104) with `formatLegType`. The current code splits type and height into separate lines — consolidate into a single display using the same helper. Replace the "Typ" and "Wysokość" lines with a single formatted string per leg type.

### No changes to
- `skuParser.ts`, `skuDecoder.ts`, `utils/pdfGenerators/*`

