

## Plan: Naprawa etykiet — lewy margines + 2 boczki

### Problem 1: Brak lewego marginesu
`nextX` startuje od `1` (linia 240 w `pdfHelpers.ts`), co przy dużych czcionkach powoduje że tekst wychodzi poza lewą krawędź strony. Brakuje minimalnego marginesu od krawędzi.

**Naprawa**: Zmienić `nextX = 1` na `nextX = 2` w linii 240, aby dać 2mm marginesu od lewej krawędzi.

### Problem 2: Boczek powinien mieć 2 etykiety
To jest kwestia konfiguracji szablonu w tabeli `label_templates` — pole `quantity` dla szablonu "Boczek" powinno wynosić `2`. Trzeba zweryfikować aktualną wartość w bazie i ewentualnie zaktualizować.

### Pliki do edycji
- `src/utils/pdfHelpers.ts` linia 240 — zwiększyć startowy `nextX` z 1 na 2

### Weryfikacja bazy
- Sprawdzić `label_templates` czy `quantity` dla boczka = 2 (jeśli nie, zaktualizować migracją)

