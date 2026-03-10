

## Plan: Fix [object Object] in leg colors + Add finishes legend

### 1. Fix formatColors in KierownikSheet.tsx (line 257)

The inline color formatting on line 257 is the bug source. The `colors` field default is `'[]'::jsonb` (empty array), but actual data is a JSON object like `{"A":"Buk"}`. The inline code handles both cases but may fail with nested objects.

**Fix**: Replace the inline expression on line 257 with a `formatColors` helper function (same as in NozkiSheet/SeriesLegs). Add the function at the top of the file (after line 12):

```typescript
const formatColors = (colors: any): string => {
  if (!colors || typeof colors !== 'object' || Array.isArray(colors)) return '—';
  return Object.entries(colors).map(([k, v]) => `${k}=${v}`).join(', ');
};
```

Then line 257: `{formatColors(l.colors)}`

SeriesLegs.tsx and NozkiSheet.tsx already have correct `formatColors` — no changes needed there.

### 2. Add finishes legend to KrojowniaSheet.tsx and KierownikSheet.tsx

Add a `useQuery` for `finishes` table in both files. Display a bold bordered bar after the `<h1>` title, before the first section:

```
LEGENDA WYKOŃCZEŃ: A = Stebnówka | B = Szczypanka | C = Dwuigłówka | D = Zwykły
```

**KrojowniaSheet.tsx** (after line 59, before "Pułapki"):
- Add `useQuery` for `finishes` table, ordered by `code`
- Render legend bar: `finishes.map(f => f.code + " = " + f.name).join(" | ")`
- Styled with border, bold, background highlight

**KierownikSheet.tsx** (after line 97, before "Konfiguracja"):
- Same query and legend bar

### Files to edit
- `src/pages/AdminPanel/cheatsheets/KierownikSheet.tsx` — add formatColors helper + finishes legend
- `src/pages/AdminPanel/cheatsheets/KrojowniaSheet.tsx` — add finishes legend

### No changes to
- `skuParser.ts`, `skuDecoder.ts`, `utils/pdfGenerators/*`
- `SeriesLegs.tsx`, `NozkiSheet.tsx` (already correct)

