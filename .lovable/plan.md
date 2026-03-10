

## Plan: Make "Kto co kompletuje" data-driven instead of hardcoded

### Problem
The "Kto co kompletuje" table in `SeriesLegs.tsx` has hardcoded logic mapping specific chest codes (SK23, SK15, SK17) to leg types. This can't be edited from the admin panel.

### Solution
Remove all hardcoded chest-code checks. Derive leg type from `chests.leg_height_cm`:
- If `leg_height_cm <= 2.5` → N4 plastikowe, Tapicer (na stanowisku)
- If `leg_height_cm > 2.5` → N z SKU, Dziewczyny od nóżek

This way, editing `leg_height_cm` in the Chests admin panel controls the behavior everywhere.

### Changes

**`src/pages/AdminPanel/spec/SeriesLegs.tsx`** (lines 109-120):
Replace the hardcoded `if (c.code === "SK23") ... else if (c.code === "SK15") ...` block with a single data-driven rule:

```typescript
for (const c of chests) {
  const isPlastic = c.leg_height_cm <= 2.5;
  mountRows.push({
    element: "Pod skrzynią",
    detail: c.code,
    type: isPlastic ? "N4 plastikowe" : "N z SKU",
    height: `${c.leg_height_cm} cm`,
    count: "4 szt",
    who: isPlastic ? "Tapicer (na stanowisku)" : "Dziewczyny od nóżek (kompletacja do worka)",
  });
}
```

Current chest data confirms this logic works correctly:
- SK23: 2.5cm → plastic (correct)
- SK15: 10cm → from SKU (correct)
- SK17: 8cm → from SKU (correct)

### No changes to
- `skuParser.ts`, `skuDecoder.ts`, `utils/pdfGenerators/*`
- Database schema (no migration needed)

### Files to edit
- `src/pages/AdminPanel/spec/SeriesLegs.tsx` only

