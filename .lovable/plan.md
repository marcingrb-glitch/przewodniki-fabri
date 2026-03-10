

## Plan: Uzupełnienie brakujących `default_finish`

Potwierdzone braki w bazie (zweryfikowane zapytaniem):

| Tabela | Kod | Seria | allowed_finishes | Brak default_finish |
|--------|-----|-------|-----------------|-------------------|
| seats_sofa | SD02N | S1 | [A, B] | tak |
| seats_sofa | SD03 | S1 | [A, B] | tak |
| sides | B1-B6, B9 | S1 | [A, B] | tak |
| sides | B1-B8 | S2 | [B, C] lub [A, B, C] | tak |
| backrests | OP62 | S1 | [A, B] | tak |
| backrests | OP68 | S2 | [A, B] | tak |

### Operacje (dane, nie schemat)

Wykonam 6 UPDATE-ów przez narzędzie do manipulacji danymi:

1. **S1 seats_sofa**: `SD02N` i `SD03` → `default_finish = 'A'`
2. **S1 sides**: wszystkie bez default → `default_finish = 'A'`
3. **S2 sides B3**: → `default_finish = 'A'`
4. **S2 sides pozostałe**: → `default_finish = allowed_finishes[1]`
5. **S1 backrests**: → `default_finish = 'A'`
6. **S2 backrests**: → `default_finish = 'A'`

### Brak zmian w kodzie

Nie modyfikuję żadnych plików TypeScript. Nie modyfikuję `skuParser.ts`, `skuDecoder.ts`, ani `pdfGenerators/`.

