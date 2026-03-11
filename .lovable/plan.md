## Problem

Dekodowanie SKU nie mieści się na 1 stronie A4 — sekcje są ułożone pionowo jedna pod drugą, co zajmuje za dużo miejsca.

## Rozwiązanie — układ dwukolumnowy pod zdjęciem

Przebudowa `decodingPDF.ts` aby sekcje tabel renderowały się w **dwóch kolumnach** obok siebie (lewa i prawa), podobnie jak było wcześniej z "Główne komponenty" i "Dodatki/Nóżki".

### Struktura strony:

```text
┌──────────────────────────────────────┐
│  Nagłówek (nr zamówienia, seria)     │
│  SKU: S1-XXXXX                       │
│  ─────────────────────────────────── │
│  ┌──────────── ZDJĘCIE ───────────┐  │
│  │         (180 x 50mm)           │  │
│  └────────────────────────────────┘  │
│                                      │
│  ┌─── KOLUMNA L ──┐┌─── KOLUMNA P ──┐│
│  │ Seria           ││ Poduszka       ││
│  │ Tkanina         ││ Jaśki/Wałki    ││
│  │ Siedzisko-Stol. ││ Nóżki          ││
│  │ Siedzisko-Pianki││ Automat         ││
│  │ Oparcie         ││                ││
│  │ Bok             ││                ││
│  └─────────────────┘└────────────────┘│
└──────────────────────────────────────┘
```

### Zmiany w `decodingPDF.ts`:

1. **Zmniejsz spacing/font** — `fs=7`, `rh=5`, `sp=3` — bardziej kompaktowe tabele.
2. **Dwukolumnowy rendering**: Po zebraniu wszystkich grup sekcji, podziel je na lewą i prawą kolumnę (np. pół na pół albo balansując wysokość). Renderuj tabele z `margin.left=15` i `tableWidth=85` dla lewej kolumny, `margin.left=105` i `tableWidth=85` dla prawej.
3. **Nowa funkcja `addTableAt**` w `pdfHelpers.ts` — wariant `addTable` przyjmujący parametry `xStart` i `tableWidth`, żeby renderować tabelę w dowolnym miejscu na stronie.
4. **Tekst się zawija** — `overflow: "linebreak"` już jest ustawione, więc długi tekst automatycznie zwiększy wysokość komórki. Bez zmian tu potrzebnych.

### Zmiany w `pdfHelpers.ts`:

Dodanie eksportowanej funkcji `addTableAt(doc, y, headers, rows, xStart, tableWidth, columnStyles?, spacing?, fontSize?, minCellHeight?)` — identyczna logika jak `addTable`, ale z konfigurowalnym `margin.left` i `tableWidth`.

### Algorytm podziału na kolumny:

1. Zbierz wszystkie gotowe grupy (po filtracji warunkowej) w tablicę `renderItems[]` — każdy item to: nagłówek + kolumny.
2. Podziel na pół (np. pierwsze N/2 → lewa, reszta → prawa).
3. Renderuj lewą kolumnę od `y` w dół, zapamiętaj `yLeft`.
4. Renderuj prawą kolumnę od tego samego `y`, zapamiętaj `yRight`.
5. Kontynuuj od `max(yLeft, yRight)`.