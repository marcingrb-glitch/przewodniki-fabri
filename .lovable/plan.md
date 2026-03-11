

## Problem Analysis

There are **two separate issues**, both stemming from the same root cause: `generateDecodingPDF` is **completely hardcoded** and does NOT use the `guide_sections` configuration from the database.

### Issue 1: PDF shows fields not selected in admin panel
The PDF always renders all sections (Tkanina with Grupa, Siedzisko-Stolarka, Siedzisko-Pianki, Oparcie, Boczek, etc.) with hardcoded columns — regardless of what's configured in the decoding templates panel. The admin panel preview (HTML) correctly reflects the configuration, but the actual PDF ignores it entirely.

### Issue 2: Foams show without dimensions in the HTML preview
The admin panel DecodingPreview uses `resolveExampleValue` which returns hardcoded placeholder text. For real order data, there's no function that resolves `guide_sections` fields against actual `DecodedSKU` data — so the preview can't show real foam dimensions.

### Issue 3: "Grupa" appears in PDF
Because `decodingPDF.ts` line 88-96 always renders the Tkanina table with a "Grupa" column, regardless of admin configuration.

---

## Plan

### 1. Create a field resolver for DecodedSKU (`src/utils/pdfGenerators/decodingFieldResolver.ts`)

A function `resolveDecodedField(field: string, decoded: DecodedSKU): string` that maps field paths (like `seat.foams_summary`, `fabric.group`, `backrest.frame`) to actual values from a `DecodedSKU` object. This is the equivalent of `resolveExampleValue` but for real decoded data. For `seat.foams_summary` and `backrest.foams_summary`, it will use `formatFoamsDetailed` to include dimensions.

### 2. Refactor `generateDecodingPDF` to be dynamic (`src/utils/pdfGenerators/decodingPDF.ts`)

Instead of hardcoded sections, the function will:
- Accept `sections: GuideSection[]` as a parameter
- Fetch sections from `guide_sections` table (filtered by series or global fallback)
- Iterate over enabled sections, resolving each column's field against the decoded data using the new resolver
- Render each section as a table with the configured columns only
- Handle conditional sections (check if pillow/jaski/walek/pufa/fotel exist)
- Handle merged sections (consecutive conditional sections with same headers get a "Typ" column)

### 3. Update all call sites

- `OrderDetailsPage.tsx` — pass series_id to `generateDecodingPDF` (or fetch sections before calling)
- `OrderHistoryPage.tsx` — same
- `DecodingTemplates.tsx` — pass filtered sections for preview

### 4. Update DecodingPreview to show real foam data

Update `resolveExampleValue` for `seat.foams_summary` and `backrest.foams_summary` to fetch actual foam data from the database when `exampleData` includes foams, instead of showing hardcoded placeholders.

### Files to edit
- **New**: `src/utils/pdfGenerators/decodingFieldResolver.ts` — field-to-value resolver for DecodedSKU
- **Edit**: `src/utils/pdfGenerators/decodingPDF.ts` — refactor to use guide_sections dynamically
- **Edit**: `src/pages/OrderDetailsPage.tsx` — update generateDecodingPDF calls
- **Edit**: `src/pages/OrderHistoryPage.tsx` — update generateDecodingPDF calls
- **Edit**: `src/pages/AdminPanel/DecodingTemplates.tsx` — pass sections to PDF generator
- **Edit**: `src/pages/AdminPanel/fieldResolver.ts` — improve foam example values

