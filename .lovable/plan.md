

## Plan: Poprawki ściągawki nóżek i formatowania kolorów

### Plik 1: `src/pages/AdminPanel/cheatsheets/NozkiSheet.tsx` — pełna przebudowa logiki CO/CZEGO NIE

Przebudowa sekcji na dwa osobne zestawy wierszy (`doRows` / `dontRows`):

**doRows (CO KOMPLETOWAĆ):**
- SK15: N z SKU, H10cm, 4szt
- SK17: N z SKU, H8cm, 4szt
- Automaty z `has_seat_legs` AND `seat_leg_type === "from_sku"`: N z SKU
- Pufa gdy `pufa_leg_type === "from_sku"`: N z SKU
- Fotel (tylko gdy `seriesCode !== "S2"`)

**dontRows (CZEGO NIE KOMPLETOWAĆ):**
- SK23: N4 plastikowe, 2.5cm — tapicer ma na stanowisku
- Automaty z `has_seat_legs` AND plastic/built_in: tapicer
- Automaty bez `has_seat_legs` (AT2): BRAK nóżek
- Pufa gdy plastic: tapicer

Wyświetlanie: `doRows` w sekcji zielonej, `dontRows` w sekcji czerwonej z powodami.

**Kolory nóżek** — zastąpienie istniejącej logiki nową `formatColors`:
```typescript
const formatColors = (colors: any): string => {
  if (!colors) return "—";
  if (typeof colors === "object" && !Array.isArray(colors)) {
    return Object.entries(colors).map(([k, v]) => `${k}=${v}`).join(", ");
  }
  if (Array.isArray(colors)) {
    if (colors.length === 0) return "—";
    if (typeof colors[0] === "object") return colors.map((c: any) => `${c.code}=${c.name}`).join(", ");
    return colors.join(", ");
  }
  return String(colors);
};
```

### Plik 2: `src/pages/AdminPanel/spec/SeriesLegs.tsx` — fix formatColors

Linia 26-34: Zastąpić `formatColors` tą samą nową wersją (obsługuje JSONB object `{A: "Buk"}` i array `[{code, name}]`).

### Brak zmian w:
- `skuParser.ts`, `skuDecoder.ts`, `utils/pdfGenerators/*`
- Brak migracji SQL

