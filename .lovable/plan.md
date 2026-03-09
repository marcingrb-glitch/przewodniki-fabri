

## Plan: Przebudowa karty siedziska — wydzielona sekcja "Dane techniczne"

Plik do zmiany: `src/pages/AdminPanel/spec/SeriesModels.tsx`

### Zmiana w `renderSeatCard`

Obecny layout karty ma nagłówek z kodem + badge'ami, a pod spodem w `text-muted-foreground` wymieszane dane identyfikacyjne (model, typ) z technicznymi (stelaż, pianka, przód). Trzeba to rozdzielić.

**Nowy layout karty:**

1. **Nagłówek** (CardHeader): Kod (edytowalny) + Badge typ + Badge sprężyna + Edit/Delete buttons
2. **Info identyfikacyjne** (pod nagłówkiem): Model, Typ, Nazwa typu — jako inline edit
3. **Wykończenia**: allowed_finishes + default_finish (jak teraz)
4. **Sekcja "Dane techniczne"** (CardContent, nowa wydzielona sekcja z nagłówkiem):
   - Stelaż: `seat.frame` — InlineEditCell
   - Pianka: `seat.foam` — InlineEditCell  
   - Front: `seat.front` — InlineEditCell
   - Pasek środek: `seat.center_strip` — Checkbox + label "TAK"/"NIE"
   - Modyfikacja stelaża: `seat.frame_modification` — InlineEditCell (zawsze widoczne, nie tylko gdy niepuste)
5. **Sekcja "Pianki szczegółowe"** (tabela product_foams — jak teraz)
6. **Poduszka** (jak teraz)

Kluczowe zmiany w kodzie (linie 142-258):
- Przenieść stelaż/pianka/front/center_strip/frame_modification z CardHeader do CardContent w nowym `div` z nagłówkiem "Dane techniczne"
- Checkbox center_strip przenieść z nagłówka do sekcji dane techniczne, wyświetlać "TAK"/"NIE" obok
- `frame_modification` wyświetlać zawsze (nie tylko gdy niepuste) — puste pokaże "uzupełnij"
- Sprężyna zostaje jako Badge w nagłówku (szybka identyfikacja) + edytowalna w info identyfikacyjnych

