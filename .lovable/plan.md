

## Dodanie pola "Typ siedziska" do selektora przewodników

### Co robimy

Dodajemy nowe pole `seat.type` (np. "Wciąg", "Gładkie", "Dzielone") jako osobny checkbox w grupie "Siedzisko".

`DecodedSKU.seat.type` już istnieje w typach — wystarczy dodać:

### Zmiany

**1. `src/pages/AdminPanel/GuideTemplates.tsx`** — nowy wpis w `AVAILABLE_FIELDS`:
```typescript
{ value: "seat.type", label: "Typ siedziska", group: "seat" },
```

**2. `src/utils/pdfGenerators/guideGenerator.ts`** — nowy case w `resolveField`:
```typescript
case "seat.type":
  return decoded.seat.type || "-";
```

**3. `src/pages/AdminPanel/GuidePreview.tsx`** — nowy wpis w `resolveExampleValue`:
```typescript
"seat.type": "Wciąg",  // przykładowa wartość
```

### Pliki
- `src/pages/AdminPanel/GuideTemplates.tsx`
- `src/utils/pdfGenerators/guideGenerator.ts`
- `src/pages/AdminPanel/GuidePreview.tsx`

