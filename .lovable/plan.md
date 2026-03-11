

## Plan: Fix SKU decoder missing fields + cheatsheet print layout

### Problem 1: Missing `frame_modification` in seats_sofa SELECT
Line 131 in `skuDecoder.ts` — the select string doesn't include `frame_modification`, so it's always `undefined` even though the DB column exists and line 293 tries to read it.

**Fix:** Add `frame_modification` to the select string on line 131.

### Problem 2: Backrest foams never fetched
Line 224 filters `product_foams` by `.eq("seat_code", seatCode)`. Backrest foams are stored with `seat_code` equal to the backrest code (e.g. "OP62"), not the seat code. So they never match.

**Fix:** Change `.eq("seat_code", seatCode)` to `.in("seat_code", [seatCode, parsed.backrest.code])` to fetch both seat and backrest foams in one query.

### Problem 3: Cheatsheet print — forced page breaks
Every `<section>` in all 4 cheatsheet components uses `className="page-break"`, and the CSS rule `.page-break { page-break-before: always; }` forces each section onto a new page. This creates excessive whitespace.

**Fix:**
- Remove `page-break` class from all cheatsheet sections
- Add a new CSS class `avoid-break` with `page-break-inside: avoid` so sections try to stay together but don't force new pages
- Add reasonable margin between sections (e.g. `mb-6`)

### Files to edit:
1. **`src/utils/skuDecoder.ts`** — add `frame_modification` to select (line 131), change foam query to `.in()` (line 224)
2. **`src/index.css`** — add `avoid-break` print class
3. **`src/pages/AdminPanel/cheatsheets/KierownikSheet.tsx`** — replace `page-break` with `mb-6 avoid-break`
4. **`src/pages/AdminPanel/cheatsheets/MagazynSheet.tsx`** — same
5. **`src/pages/AdminPanel/cheatsheets/KrojowniaSheet.tsx`** — same
6. **`src/pages/AdminPanel/cheatsheets/NozkiSheet.tsx`** — same

