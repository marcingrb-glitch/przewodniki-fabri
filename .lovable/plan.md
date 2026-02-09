
## Obsługa boczków z literowym sufiksem (B6S, B6W)

### Problem
Kody boczków w parserze SKU sa rozpoznawane regexem `^B(\d+)([A-C])$`, ktory wymaga formatu: **B + cyfry + wykończenie (A-C)**. Kod jak `B6SC` (po uppercase) nie pasuje, bo `6S` nie jest czysta liczba — litera `S` jest czescia kodu boczka, nie wykończenia.

### Rozwiazanie
Zmienic regex boczka, aby akceptowal opcjonalny sufiks literowy w kodzie (np. B6S, B6W, B10X), a nastepnie osobno odczytywal litere wykończenia (A-C).

### Zmiany w plikach

**1. `src/utils/skuParser.ts`** (linia 47)

Zmienic regex z:
```
/^B(\d+)([A-C])$/
```
na:
```
/^B(\d+[A-Z]?)([A-C])$/
```
To dopasuje np. `B6SC` jako kod `B6S` + wykończenie `C`. Trzeba jednak upewnic sie, ze ostatnia litera jest traktowana jako wykończenie, a poprzednie litery jako czesc kodu. Bezpieczniejszy regex:
```
/^(B\d+[A-Z]?)([A-C])$/
```
z dodatkowa logika: jesli sufiks kodu boczka to A, B lub C — moze byc niejednoznaczny z wykończeniem. Dlatego lepsze podejscie to:

- Nowy regex: `/^(B\d+\w?)([A-C])$/` gdzie `\w?` lapie opcjonalny sufiks
- Ale to nadal jest niejednoznaczne dla np. `B6A` — czy `A` to sufiks kodu czy wykończenie?

Rozwiazanie: kody z sufiksem literowym musza byc **lowercase** w SKU (np. `B6sC`), a parser nie powinien robic uppercase na calym stringu, tylko porownywac inteligentniej. Alternatywnie — sufiksy boczków sa znane (`s`, `w`) i mozna je jawnie obslugiwac.

**Proponowane podejscie — jawna lista sufiksow:**

Regex: `/^B(\d+)(s|w)?([A-C])$/i` z zachowaniem wielkosci liter sufiksu, ale po uppercase calego SKU trzeba zmienic na:

```
/^B(\d+(?:S|W)?)([A-C])$/
```

To dopasuje:
- `B1A` -> kod `B1`, wykończenie `A`
- `B6SC` -> kod `B6S`, wykończenie `C`  
- `B6WA` -> kod `B6W`, wykończenie `A`
- `B9C` -> kod `B9`, wykończenie `C`

Nie bedzie konfliktu, bo istniejace kody (B1-B9) nie konczyly sie na S ani W.

**2. `src/utils/skuDecoder.ts`** (linia ~27)

Dekoder odczytuje dane boczka z `SIDES[parsed.side.code]`. Jesli boczki B6S i B6W sa w bazie danych, trzeba upewnic sie ze dekoder pobiera dane z bazy (lub z mappings). Aktualnie uzywany jest statyczny slownik `SIDES` z `data/mappings.ts`.

**3. `src/data/mappings.ts`** (sekcja SIDES)

Dodac nowe kody:
```typescript
B6S: { frame: "B6S [...]", name: "Iga A Slim" },
B6W: { frame: "B6W [...]", name: "Iga A Wide" },
```
(nazwy przykladowe — trzeba ustalic wlasciwe na podstawie danych z panelu admina)

**Uwaga**: Jesli system docelowo pobiera dane boczków z bazy danych (tabela `sides`), to mappings.ts nie musi byc aktualizowany recznie — ale dekoder musi byc przystosowany do dynamicznego pobierania danych zamiast statycznego slownika.

### Podsumowanie zmian

| Plik | Zmiana |
|------|--------|
| `src/utils/skuParser.ts` | Nowy regex boczka: `/^B(\d+(?:S\|W)?)([A-C])$/` |
| `src/data/mappings.ts` | Dodanie B6S, B6W do slownika SIDES |
| `src/utils/skuDecoder.ts` | Bez zmian (juz uzywa `SIDES[parsed.side.code]`) |
