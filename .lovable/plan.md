

## Plan: Naprawienie parsowania SKU dla S2 i nowych poduszek

### Problem

SKU `S2-T12A-SD2A-B3A-OP68A-SK22-AT1-P3A` nie jest rozpoznawany. Główna przyczyna: **regex poduszek w parserze jest za restrykcyjny**.

Aktualny regex: `/^P[12]$/` — dopuszcza tylko P1 i P2, bez litery wykończenia.  
Segment `P3A` nie pasuje do żadnego wzorca i jest ignorowany.

Dodatkowy problem: nawet `P1A` czy `P2C` nie pasują do tego regexa (brak obsługi litery finish), więc **poduszki z wykończeniem w SKU nigdy nie były poprawnie parsowane**.

### Zmiany

**1. `src/utils/skuParser.ts`** — rozszerzenie regexa poduszek:

Zmiana z:
```
if (/^P[12]$/.test(part))
```
na regex z capture group:
```
const pillowMatch = part.match(/^(P\d+)([A-D])?$/);
```
Zapisanie `pillowMatch[1]` jako kodu i `pillowMatch[2]` jako opcjonalnego finish.

**2. `src/types/index.ts`** — zmiana typu `pillow` w `ParsedSKU`:

Z `pillow?: string` na `pillow?: { code: string; finish?: string }` — aby parser mógł przekazać finish do dekodera.

**3. `src/utils/skuDecoder.ts`** — dostosowanie do nowej struktury pillow:

Zmiana odwołań z `parsed.pillow` (string) na `parsed.pillow.code` i użycie `parsed.pillow.finish` zamiast seatFinish gdy dostępny.

**4. `src/utils/skuValidator.ts`** — dostosowanie walidacji do nowej struktury pillow (jeśli używa `parsed.pillow`).

### Analogicznie: jaski i walek

Regexy `/^J[12]$/` i `part === "W1"` też są zbyt restrykcyjne. Zmienię je na:
- Jaski: `/^(J\d+)([A-D])?$/`
- Walek: `/^(W\d+)([A-D])?$/`

I odpowiednio zaktualizuję typy w `ParsedSKU` (`jaski?: { code: string; finish?: string }`, `walek?: { code: string; finish?: string }`).

### Szczegóły techniczne

- Zmiana typów `pillow`, `jaski`, `walek` w `ParsedSKU` z `string` na `{ code: string; finish?: string }` wymaga aktualizacji **wszystkich miejsc** odwołujących się do tych pól (dekoder, walidator, ewentualnie formularze zamówień).
- W dekoderze: jeśli `parsed.pillow.finish` jest ustawiony, użyj go; w przeciwnym razie fallback na `seatFinish` (obecne zachowanie).

