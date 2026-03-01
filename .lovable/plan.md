

## Plan: Rotated series info on left side of label

The user wants the series info (e.g. "S1 [Sofa Viena]") displayed vertically on the left edge of the label, rotated 90 degrees — as shown in the red box on the screenshot. The current series line at the top center would be replaced by this rotated text on the left.

### Changes to `src/utils/pdfHelpers.ts` — `addLabel` function:

1. **Remove** the current centered series line at the top
2. **Add rotated text** on the left side:
   - Rotate text 90° counterclockwise using `doc.text(text, x, y, { angle: 90 })`
   - Position at ~3mm from left edge, vertically centered
   - Use bold font, ~9-10pt size, auto-scale to fit label height
3. **Shift main content zone** to the right (e.g. start at ~18-20mm instead of 3mm) to make room for the rotated text
4. **Main lines** remain bold, centered in the remaining horizontal space

### Changes to `src/utils/pdfGenerators/labels.ts`:

- Update the `seriesLine()` helper to produce a shorter format suitable for vertical display, e.g. `"S1 [Sofa Viena]"` instead of `"[S1 - Sofa Mar [Viena]]"`
- Or keep existing format and let auto-scaling handle it

