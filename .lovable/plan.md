

## Problem: Warianty szycia "znikają" po zapisie

### Analiza

Dane w bazie potwierdzają, ze warianty **zostały zapisane** (Wariant 3 i 4 z modelami [Ravenna] i opisem "Bodno na górze" istnieją w bazie). Problem polega na tym, ze po zapisie **nie są widoczne** na karcie OP68 sprężyna B.

Przyczyna tkwi w funkcji `getMatchingVariants`:

```text
getMatchingVariants(b) — filtruje warianty szycia wg modeli karty:
  1. Pobiera warianty z component_code === b.code (OP68)
  2. Filtruje: v.models musi mieć overlap z b.model_name

Karta B: model_name = "Modena / Sienna / Porto" (bez Ravenna!)
Wariant 3: models = ["Ravenna"]
→ Ravenna ∉ [Modena, Sienna, Porto] → wariant UKRYTY
```

**Flow użytkownika:**
1. Klika "Dodaj wariant" → wariant z `models: []` pojawia się (bo length===0 przepuszcza filtr)
2. Przypisuje Ravenna do modeli wariantu, wpisuje opis
3. Po zapisie `fetchAll()` → wariant ma teraz `models: ["Ravenna"]` → filtr odrzuca go, bo karta B nie ma Ravenna w model_name
4. Wariant "znika" — użytkownik myśli, ze nie zapisał się

### Rozwiązanie

Zmienić logikę wyświetlania wariantów szycia: **nie filtrować po overlap modeli**. Zamiast tego wyświetlać wszystkie warianty dla danego kodu komponentu na każdej karcie z tym kodem. Model badges w tabeli wariantów wystarczająco komunikują, do których modeli wariant się odnosi.

### Zmiana w `SeriesBackrests.tsx`

Funkcja `getMatchingVariants` — usunąć filtrowanie po modelach:

```typescript
// PRZED:
const getMatchingVariants = (b: Backrest) => {
  const variants = sewingVariants.filter(v => v.component_code === b.code);
  if (!b.model_name) return variants;
  const cardModels = parseModels(b.model_name);
  return variants.filter(v =>
    v.models.length === 0 || v.models.some(m => cardModels.includes(m))
  );
};

// PO:
const getMatchingVariants = (b: Backrest) => {
  return sewingVariants.filter(v => v.component_code === b.code);
};
```

Dodatkowo: usunąć zduplikowane Warianty 3 i 4 z bazy (oba mają ten sam opis i modele — wystarczy jeden).

### Plik do edycji
- `src/pages/AdminPanel/spec/SeriesBackrests.tsx` — uproszczenie `getMatchingVariants`
- Usunięcie duplikatu wariantu z bazy (Wariant 4, id: `8c0115b8-...`)

