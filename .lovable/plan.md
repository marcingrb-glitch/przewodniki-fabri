

## Problem

1. **Podgląd (preview) nie rozwiązuje nowych pól** — w `GuidePreview.tsx` brakuje wpisów w mapie `resolveExampleValue` dla: `seat.springType`, `seat.frameModification`, `backrest.springType`. Dlatego na screenie widać surowy tekst "seat.springType" zamiast wartości.

2. **Podgrupy "Stolarka"/"Pianki" istnieją w pickerze pól** (dropdown z checkboxami) — działają poprawnie w kodzie. Widać je po kliknięciu "Dodaj kolumny". Podgrupy NIE wpływają na to, jak sekcje wyglądają w podglądzie — tam widać sekcje (tabele), które sam tworzysz i nazywasz.

### Co trzeba naprawić

**`src/pages/AdminPanel/GuidePreview.tsx`** — dodać 3 brakujące wpisy w mapie `resolveExampleValue`:

```typescript
"seat.springType": v(data.seat?.spring_type),
"seat.frameModification": v(data.seat?.frame_modification),
"backrest.springType": v(data.backrest?.spring_type),
```

Wymaga też rozszerzenia zapytania do `seats_sofa` o pole `spring_type, frame_modification` i do `backrests` o `spring_type` w funkcji `useExampleData`.

### Pliki do edycji
1. `src/pages/AdminPanel/GuidePreview.tsx` — 2 zmiany: rozszerzenie select + 3 wpisy w mapie

