

## Plan: Zgrupowanie Poduszka/Jaśki/Wałek w jedną tabelę

### Problem
Obecnie Poduszka, Jaśki i Wałek to 3 osobne sekcje, każda z identyczną strukturą (Kod | Nazwa | Wykończenie). Użytkownik chce je widzieć jako jedną tabelę z 3 wierszami.

### Rozwiązanie
W `DecodingPreview.tsx` dodac logikę grupowania: kolejne sekcje warunkowe o identycznych nagłówkach kolumn zostaną automatycznie scalone w jedną tabelę z wieloma wierszami. Nazwa sekcji stanie się pierwszą kolumną ("Typ").

Nie trzeba zmieniać danych w bazie ani seed defaults -- sekcje pozostaną osobne w konfiguracji (dla elastyczności), ale w podglądzie renderują się razem.

### Zmiana w `src/pages/AdminPanel/DecodingPreview.tsx`

Przed renderowaniem sekcji, zgrupować kolejne sekcje o identycznych nagłówkach kolumn w "grupy":

```text
Przed:
  Poduszka  | Kod | Nazwa | Wykończenie  (1 wiersz)
  Jaśki     | Kod | Nazwa | Wykończenie  (1 wiersz)  
  Wałek     | Kod | Nazwa | Wykończenie  (1 wiersz)

Po (w podglądzie):
  ┌──────────┬──────┬────────┬─────────────┐
  │ Typ      │ Kod  │ Nazwa  │ Wykończenie  │
  ├──────────┼──────┼────────┼─────────────┤
  │ Poduszka │ P01  │ Nazwa  │ Wciąg       │
  │ Jaśki    │ J01  │ Nazwa  │ Wciąg       │
  │ Wałek    │ W01  │ Nazwa  │ Wciąg       │
  └──────────┴──────┴────────┴─────────────┘
```

Algorytm: iterować po `enabledSections`, porównywać nagłówki kolejnych sekcji — jeśli identyczne, łączyć w grupę. Grupa renderuje jedną tabelę z wieloma wierszami i nagłówkiem "Poduszka / Jaśki / Wałek".

### Pliki do edycji:
- `src/pages/AdminPanel/DecodingPreview.tsx` — logika grupowania + rendering multi-row

