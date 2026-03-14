

## Etap 2 Krok 0: Walidacja sku_segments na realnych SKU

Plik zawiera 4 zapytania SQL do uruchomienia na bazie danych. Wykonam je sekwencyjnie przez `psql` i zapiszę wyniki.

### Co zrobi skrypt

1. **Część 1** — Pokaże 15 ostatnich SKU z zamówień
2. **Część 2** — Rozbije każde SKU na segmenty (po `-`), dopasuje do regexów z `sku_segments` i pokaże match/no-match per segment
3. **Część 3** — Podsumowanie: ile segmentów matchuje vs nie
4. **Część 4** — Referencja: aktualne definicje `sku_segments`

### Plan implementacji

1. Uruchomić każde z 4 zapytań SQL osobno przez `psql` na bazie projektu
2. Zebrać wyniki i przedstawić je w czytelnej formie
3. Jeśli jakieś segmenty nie matchują — zidentyfikować brakujące/błędne regexy w `sku_segments`

Żadne zmiany w kodzie nie są potrzebne — to czysta diagnostyka danych.

