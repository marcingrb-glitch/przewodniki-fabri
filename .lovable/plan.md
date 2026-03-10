

## Plan: Rozbudowa PDF Dekodowania o pełne dane zamówienia

### Obecny stan
PDF dekodowania zawiera: nagłówek, SKU, zdjęcie wariantu (180x90mm), dwie kolumny z podstawowymi komponentami i dodatkami. Dane są skrótowe.

### Cel
PDF ma zawierać **wszystkie szczegóły techniczne** zamówienia — jak ściągawka Kierownika, ale dla jednego konkretnego zdekodowanego SKU. Zdjęcie wariantu zostaje na górze.

### Nowy układ PDF (wielostronicowy A4)

**Strona 1:**
1. Nagłówek (numer zamówienia, seria, data) — bez zmian
2. SKU wycentrowane — bez zmian
3. Zdjęcie wariantu — zmniejszone do ~60mm wysokości (zamiast 90mm) żeby zmieścić więcej danych
4. **Tabela: Tkanina** — kod, nazwa, kolor, grupa cenowa
5. **Tabela: Siedzisko — Stolarka** — kod, typ, model, stelaż, modyfikacja, sprężyna, wykończenie
6. **Tabela: Siedzisko — Pianki** — szczegółowe pianki (formatFoamsDetailed), front, pasek środek
7. **Tabela: Oparcie** — kod, wysokość, stelaż, góra, sprężyna, wykończenie + pianki szczegółowe
8. **Tabela: Boczek** — kod, nazwa, stelaż, wykończenie

**Strona 2 (jeśli potrzebna — jsPDF autoTable automatycznie łamie strony):**
9. **Tabela: Skrzynia + Automat** — kody, nazwy, typ automatu
10. **Tabela: Nóżki** — kod, materiał, kolor + wysokości pod skrzynią i siedziskiem
11. **Tabela: Dodatki** — poduszka, jaśki, wałek z wykończeniami
12. **Tabela: Pufa** (warunkowa) — SKU pufy, nóżki pufy
13. **Tabela: Fotel** (warunkowa) — SKU fotela, nóżki fotela

### Zmiana w pliku
- **`src/utils/pdfGenerators/decodingPDF.ts`** — pełna przebudowa funkcji `generateDecodingPDF`:
  - Zmniejszenie obszaru zdjęcia (imageH 90→60)
  - Zastąpienie dwukolumnowego layoutu sekwencją pełnoszerokich tabel (używając `addTable` z pdfHelpers)
  - Dodanie szczegółowych danych pianek (via `formatFoamsDetailed`)
  - Użycie mniejszej czcionki (fontSize 8) i mniejszego row height (6) żeby zmieścić dużo danych
  - Automatyczne łamanie stron przez autoTable

### Bez zmian
- `pdfHelpers.ts` — istniejące `addTable`, `addHeader` wystarczą
- Typy — `DecodedSKU` już zawiera wszystkie potrzebne dane

