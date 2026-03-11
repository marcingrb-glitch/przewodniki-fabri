

## Problem

Comparing the HTML preview (screenshot 1) with the PDF output (screenshot 2), the PDF is missing **section name headers** (SIEDZISKO, OPARCIE, BOCZEK, SKRZYNIA + AUTOMAT). The preview renders them as bold uppercase labels above each table, but the PDF generator (`guideGenerator.ts`) never prints `section.section_name`.

Specifically in `guideGenerator.ts` lines 140-168:
- For **split sections** (Stolarka/Pianki): It prints the sub-labels but skips the parent header ("SIEDZISKO")
- For **non-split sections**: It jumps straight to `renderColumns()` without any section name

## Fix

**File**: `src/utils/pdfGenerators/guideGenerator.ts`

Add a bold section name header before each section's content, inside the `for (const section of sections)` loop (before the `hasSplit` check). This means adding ~5 lines:

```typescript
// Before the hasSplit check, render section name as bold header
doc.setFontSize(guideSettings.font_size_header);
doc.setFont("Roboto", "bold");
doc.setTextColor(0, 0, 0);
doc.text(section.section_name.toUpperCase(), 15, y);
y += 5;
```

This will match the preview's behavior where each section has a bold uppercase name displayed above its table(s).

