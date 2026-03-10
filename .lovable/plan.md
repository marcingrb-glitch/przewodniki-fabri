

## Plan: Domyślne sekcje dekodowania (seed defaults)

Dodanie przycisku "Wstaw domyślne sekcje", który automatycznie utworzy sekcje odpowiadające wcześniejszemu hardcoded'owanemu układowi dekodowania (Tkanina, Siedzisko-Stolarka, Siedzisko-Pianki, Oparcie, Boczek, Skrzynia+Automat, Nóżki, Dodatki + warunkowe: Poduszka, Jaśki, Wałek, Pufa, Fotel).

### Zmiana w `src/pages/AdminPanel/DecodingTemplates.tsx`

Dodać mutację `seedDefaultsMutation` wstawiającą ~12 sekcji z poprawnymi kolumnami do `guide_sections` z `product_type = "decoding"`. Przycisk widoczny tylko gdy `filtered.length === 0` (brak sekcji). Domyślne sekcje:

1. **Tkanina** — `fabric.code`, `fabric.name`, `fabric.color`, `fabric.group` (wymaga dodania tych pól do fieldResolver)
2. **Siedzisko — Stolarka** — `seat.code`, `seat.type`, `seat.frame`, `seat.frameModification`, `seat.springType`, `seat.finish_name`
3. **Siedzisko — Pianki** — `seat.foams_summary`, `seat.front`, `seat.midStrip_yn`
4. **Oparcie** — `backrest.code`, `backrest.frame`, `backrest.foams_summary`, `backrest.top`, `backrest.springType`, `backrest.finish_name`
5. **Boczek** — `side.code`, `side.frame`, `side.finish_name`
6. **Skrzynia + Automat** — `chest.name`, `automat.code_name`
7. **Nóżki** — `legs.code_color`, `legHeights.sofa_chest_info`, `legHeights.sofa_seat_info`
8. **Poduszka** (warunkowa: pillow) — `pillow.code`, `pillow.name`, `pillow.finish_info`
9. **Jaśki** (warunkowa: jaski) — `jaski.code`, `jaski.name`, `jaski.finish_info`
10. **Wałek** (warunkowa: walek) — `walek.code`, `walek.name`, `walek.finish_info`
11. **Pufa** (warunkowa: extras_pufa_fotel) — `pufaSeat.frontBack`, `pufaSeat.sides`, `pufaSeat.foam`, `pufaSeat.box`, `pufaLegs.code`, `pufaLegs.height_info`, `pufaLegs.count_info`
12. **Fotel** (warunkowa: fotelLegs) — `fotelLegs.code`, `fotelLegs.height_info`, `fotelLegs.count_info`

### Zmiana w `src/pages/AdminPanel/fieldResolver.ts`

Dodać brakujące pola tkaniny do `AVAILABLE_FIELDS`:
- `fabric.code` (Kod), `fabric.name` (Nazwa), `fabric.color` (Kolor), `fabric.group` (Grupa) — grupa `fabric`
- Dodać grupę `fabric` ("Tkanina") do `FIELD_GROUPS`
- Dodać mapowanie w `resolveExampleValue`

### Pliki do edycji:
- `src/pages/AdminPanel/DecodingTemplates.tsx` — przycisk + mutacja seed
- `src/pages/AdminPanel/fieldResolver.ts` — pola tkaniny

