

## Problem

W `MagazynSheet.tsx` są dwa błędy uniemożliwiające wyświetlanie pianek ze specyfikacji:

1. **Siedziska (linia 100)**: Filtr pianek używa `f.component === "seat"` ale dane w bazie mają `component: "siedzisko"`. Przez to tabela szczegółowych pianek nigdy się nie wyświetla — widać tylko stare pole `seat.foam` ("Pianka ogólna").

2. **Oparcia (linia 160)**: Wyświetla tylko `b.foam` (stare pole tekstowe z tabeli `backrests`) — w ogóle nie pobiera danych z `product_foams` dla oparć (component = `"oparcie"`). KierownikSheet robi to poprawnie przez `formatFoamsForCode`, ale MagazynSheet nie.

## Rozwiązanie

### `MagazynSheet.tsx`:

1. **Linia 100** — zmień `"seat"` na `"siedzisko"`:
```typescript
const seatFoams = foams.filter(f => f.seat_code === seat.code && f.component === "siedzisko");
```

2. **Sekcja Oparcia (linie 141-168)** — dodaj pianki z `product_foams` analogicznie jak w siedziskach:
   - Dla każdego oparcia pobierz pianki: `foams.filter(f => f.seat_code === b.code && f.component === "oparcie" && (!f.backrest_id || f.backrest_id === b.id))`
   - Zamień tabelę na karty z widokiem szczegółowych pianek (tak jak siedziska)
   - Dodaj fallback na `b.foam` gdy brak pianek w `product_foams`
   - Uwzględnij model_name i spring_type oparcia w nagłówku karty

### Plik do edycji:
- `src/pages/AdminPanel/cheatsheets/MagazynSheet.tsx`

