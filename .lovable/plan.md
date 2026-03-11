

## Analiza problemow

### 1. Etykiety — ucięta lewa sekcja (nadal)
Zmiana `nextX = 2` nie wystarczyła. Problem jest glębszy: tekst rotowany 90° w jsPDF rozciąga się w LEWO od pozycji x. Przy `seriesCodeSize = 30pt` (z bazy), tekst ma ~10.5mm wysokości. Przy x=3.5mm, tekst rozciąga się od x≈-7mm do x≈3.5mm — wychodzi poza lewą krawędź strony.

**Aktualny kod** (`pdfHelpers.ts` linia 240-259):
```
let nextX = 2;
const x = nextX + 1.5;  // = 3.5mm — za mało dla 30pt fontu
```

**Naprawa**: Pozycjonować x uwzględniając wysokość czcionki (po rotacji wysokość staje się szerokością):
```
const fontHeightMm = fontSize * 0.35;
const x = nextX + fontHeightMm;
nextX = x + 1.5;
```
Dla 30pt: x = 2 + 10.5 = 12.5mm. Dla drugiego pola (13pt): x = 14 + 4.6 = 18.6mm. Mieści się w 20mm leftZoneWidth.

### 2. Przewodnik — nagłówek sekcji warunkowej renderowany przed sprawdzeniem warunku
W `guideGenerator.ts` (linie 140-149), nagłówek sekcji (`section.section_name.toUpperCase()`) jest drukowany PRZED sprawdzeniem warunku `is_conditional`. Gdy sekcja warunkowa nie spełnia warunku, nagłówek i tak pojawia się w PDF.

**Naprawa**: Przenieść sprawdzenie warunku PRZED renderowanie nagłówka sekcji.

### 3. Przewodnik — brak podgrupowych nagłówków "Stolarka"/"Pianki" w czytelnym formacie
Nazwy podgrup "Stolarka" i "Pianki" w sekcji Siedzisko są renderowane jako italic szary tekst zamiast jako wyraźne nagłówki jak w podglądzie HTML (SIEDZISKO — STOLARKA, SIEDZISKO — PIANKI).

**Naprawa**: Zmienić format podgrup — dodać nazwę sekcji do podgrupy: `${section.section_name} — Stolarka` i `${section.section_name} — Pianki`, renderować jako bold zamiast italic, czarny zamiast szarego.

---

## Pliki do edycji
1. `src/utils/pdfHelpers.ts` linie 240-259 — pozycjonowanie lewej strefy etykiet
2. `src/utils/pdfGenerators/guideGenerator.ts` linie 140-173 — warunek przed nagłówkiem + format podgrup

