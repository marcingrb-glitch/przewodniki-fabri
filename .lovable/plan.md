

## Plan: Ogranicz wybór modeli w wariantach szycia do modeli z danych technicznych

### Problem

`ModelMultiSelect` w sekcji wariantów szycia pokazuje **wszystkie modele z serii** (`availableModels`), zamiast tylko tych przypisanych do danego oparcia w polu `model_name`. Użytkownik może przez pomyłkę przypisać model, który nie jest powiązany z tym wariantem oparcia.

### Rozwiązanie

W `renderSewingSection` przekazać do `ModelMultiSelect` ograniczoną listę modeli — tylko te z `parseModels(b.model_name)` zamiast globalnych `availableModels`.

### Zmiana w `SeriesBackrests.tsx`

1. **`ModelMultiSelect`** — dodać opcjonalny prop `allowedModels` który, jeśli podany, zastępuje `availableModels`:

```typescript
const ModelMultiSelect = ({ selected, onChange, label = "Modele", allowedModels }: { 
  selected: string[]; onChange: (models: string[]) => void; label?: string; allowedModels?: string[] 
}) => {
  const modelsToShow = allowedModels ?? availableModels;
  // ... reszta bez zmian, użyć modelsToShow zamiast availableModels
```

2. **W `renderSewingSection`** (linia 269) — przekazać modele karty:

```typescript
<ModelMultiSelect
  selected={v.models}
  onChange={(models) => updateSewingVariant(v.id, "models", models)}
  label="Modele"
  allowedModels={parseModels(b.model_name)}
/>
```

### Plik do edycji
- `src/pages/AdminPanel/spec/SeriesBackrests.tsx`

