

## Plan: Poprawki terminologii, logiki skrzyń, kolorów i duplikacji "cm"

### 1. SeriesLegs.tsx — pełna przebudowa

**Terminologia:**
- "Kto co montuje" → "Kto co kompletuje"
- "Kto montuje" (nagłówek kolumny) → "Kto kompletuje"
- "Dziewczyny od nóżek" → "Dziewczyny od nóżek (kompletacja do worka)"
- "Nie kompletowane (wbudowane)" → "Tapicer (wbudowane)"
- "Nie kompletowane (plastikowe 2.5cm)" → "Nie kompletowane — przy stanowisku"
- "Plastikowe — NIE kompletować" → "Nie kompletowane — przy stanowisku"

**Logika skrzyń — mountInfo:**
Obecnie wszystkie skrzynie mają `type: "from_sku"`. Poprawić: skrzynie z `leg_height_cm === 0` (np. SK23) powinny mieć typ "N4 plastikowe", height "2.5", who "Nie kompletowane — przy stanowisku". Skrzynie z `leg_height_cm > 0` zachowują "N z SKU".

Dodać kolumny "Ilość" do tabeli (4 szt dla skrzyń, dynamicznie dla siedzisk z automats).

Pobrać `automats` żeby wyświetlić per-automat info o siedziskach (AT1 ma nóżki, AT2 nie).

**Kolory — formatColors:**
Zmienić z `String(colors)` na obsługę obiektów JSONB:
```typescript
const formatColors = (colors: Json) => {
  if (Array.isArray(colors)) return colors.join(", ");
  if (colors && typeof colors === "object" && !Array.isArray(colors)) {
    return Object.entries(colors).map(([k, v]) => `${k}=${v}`).join(", ");
  }
  return String(colors);
};
```

**Bug "15 cm cm":**
Linia 111: `${info.height} cm` — ale `height` dla fotela jest ustawione jako `"15"`, a dla skrzyń jako `${c.leg_height_cm}`. Problem jest że height już może zawierać "cm" lub nie. Upewnić się że height jest zawsze liczbą/stringiem bez "cm", a sufiks dodawany raz w renderze.

### 2. NozkiSheet.tsx — terminologia + kolory

- Analogiczna zmiana terminologii w sekcjach CO/CZEGO NIE KOMPLETOWAĆ
- Poprawić formatowanie kolorów z `(l.colors as string[]).join(", ")` na obsługę obiektów JSONB (linia 129)
- SK23 w "CZEGO NIE KOMPLETOWAĆ" powinno zawsze się wyświetlać (niezależnie od `leg_height_cm`)

### 3. KierownikSheet.tsx — kolory

- Poprawić formatowanie kolorów (linia 257) z `(l.colors as string[]).join(", ")` na `Object.entries` format

### Pliki do zmiany:
- `src/pages/AdminPanel/spec/SeriesLegs.tsx` — terminologia, logika skrzyń, automaty, kolory, bug cm
- `src/pages/AdminPanel/cheatsheets/NozkiSheet.tsx` — terminologia, kolory
- `src/pages/AdminPanel/cheatsheets/KierownikSheet.tsx` — kolory

