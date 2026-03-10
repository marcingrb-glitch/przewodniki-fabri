

## Plan: Usunięcie nazwy grupy z nagłówków kolumn w dekodowaniu

### Problem
Gdy dodajesz pole np. "Wygląd" z grupy "Poduszka", nagłówek kolumny generuje się jako "Poduszka — Wygląd". To redundantne, bo sekcja już nazywa się "PODUSZKA".

### Rozwiązanie
Zmienić logikę generowania domyślnego nagłówka w `GuideTemplates.tsx` — zamiast `"Grupa — Pole"` ustawić po prostu `"Pole"` (sam label pola).

**Zmiana w `src/pages/AdminPanel/GuideTemplates.tsx` (linia ~201):**
```typescript
// Przed:
const defaultHeader = fieldDef ? `${groupDef?.label || ""} — ${fieldDef.label}` : fieldValue;

// Po:
const defaultHeader = fieldDef ? fieldDef.label : fieldValue;
```

Istniejące sekcje zapisane w bazie zachowają stare nagłówki — użytkownik może je ręcznie edytować lub usunąć i dodać ponownie. Nowe pola będą miały czyste nazwy.

### Pliki do edycji:
- `src/pages/AdminPanel/GuideTemplates.tsx` — zmiana domyślnego nagłówka kolumny

