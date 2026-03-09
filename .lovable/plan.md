

## Problem

SKU `S1-T4B-SD4-B6D-OP62A-SK15-AT1-N1A-P1D` fails with "Brak boczka (B1-B9)".

The side regex in the parser is `^B(\d+(?:S|W)?)([A-C])?$` -- finish letter is limited to A-C. `B6D` has finish `D` (Zwykły), which doesn't match `[A-C]`, so the entire segment is skipped and side is never parsed.

Note: `B6D` is also a side exception for S1 (mapped to B6C), but the **validator** calls `parseSKU()` without sideExceptions, so the exception path isn't triggered during validation.

## Fix

In `src/utils/skuParser.ts`, expand all side-related regexes from `[A-C]` to `[A-D]`:

1. **Line 55** (mapped side exception regex): `[A-C]` to `[A-D]`
2. **Line 65** (main side regex): `[A-C]` to `[A-D]`

The backrest regex on line 75 `^OP(\d{2})([A-C])$` should also be expanded to `[A-D]` for consistency, since finish D exists in the system.

This is a one-line-per-location fix in `skuParser.ts`. No other files need changes.

