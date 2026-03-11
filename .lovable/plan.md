

## Plan: Fix label PDF — text overlap and left zone spacing

### Problem 1: Text overlap in main content
The `lineHeight` multiplier (`mainFontSize * 0.45`) is too small, causing lines to overlap when font size is large. For a 14pt font, lineHeight = 6.3mm which is not enough for bold Roboto.

**Fix:** Change line height multiplier from `0.45` to `0.55` in `addLabel` (line 281).

### Problem 2: Too much gap between S1 and Viena in left zone
The `nextX` calculation uses `fontSize * 0.35` on both sides of the text plus extra spacing. For S1 at 18pt, this creates ~7.6mm per field when the text itself is only ~6mm wide. The gap after the first field (`fi === 0 ? 1 : 0.8`) adds more space.

**Fix:** Reduce the spacing multiplier from `0.35` to `0.3` and reduce inter-field gap from `1` to `0.5` (lines 256-259).

### Files to edit
- **`src/utils/pdfHelpers.ts`** — lines 256-259 (left zone spacing) and line 281 (line height)

