# Handoff: Fotel S1 — spec 2026-04-23

Kontynuacja planu z `2026-04-22-labels-v2-state.md` → "Fotel — osobna specyfikacja".

## Zakres

- **S1**: ma fotela jako osobny byt (nowa kategoria `seat_fotel`)
- **S2**: brak fotela
- **N2**: brak fotela (narożnik)

## Fotel S1 — etykieta: JEDNA sekcja "SIEDZISKO"

(brak osobnego oparcia — oparcie zintegrowane z bazą)

| Pole | Wartość |
|---|---|
| Stelaż | `S1-SD-FT` |
| Modyfikacja stelaża | listwa 3 cm wysokości [Góra] |
| Sprężyna | 48B |
| Pianka baza | 14 × 64 × 60 cm (rola: base) |
| Front | dziedziczony z sofa-seat per wariant SD (SD2 → SD02 itd.) |
| Oparcie (zintegr.) | oklejka 1 cm |
| Tył | oklejka 1 cm |
| Bok | oklejka 1 cm |
| Automat | brak |
| Pozycja śrub | brak |

## Komponenty współdzielone z sofą S1

- **Boczki fotela** = `sofa-side` (ten sam produkt, ten sam SKU segment)
- **Front (półwałek)** = `sofa-seat.front_foam` per wariant SD
- **Nóżki** = series `fotel_leg_height_cm=15`, `fotel_leg_count=4`

## SKU fotela (decoder buduje)

`FT-{series}-{fabric}-{sofa-seat}-{side}-{jaski?}-{legs}`

Fotel NIE ma własnego segmentu SD — korzysta z SD sofy (front foam inheritance).

## Otwarte pytania do migracji

1. **Oklejka 1 cm** — jedna pianka entry "oklejka 1 cm" (opis tekstowy), czy 3 oddzielne (oparcie/tył/bok)?
2. **Wymiary oklejki** — podać wymiary per strona, czy wystarczy "oklejka 1 cm" jako opis?
3. **Kolejność pianek na etykiecie** — baza → front → oklejka, czy inna?
4. **Label template** — pola w wierszu Model/Typ: Model + Typ (jak w sofie)? Stelaż/Modyfikacja/Sprężyna jako osobne linie?

## Implementacja — plan

### SQL (migracje)
1. `20260423_fotel_s1_seat_product.sql` — nowy produkt `S1-SD-FT` w kategorii `seat_fotel`
2. `20260423_fotel_s1_foams.sql` — pianki bazy + oklejka (product_specs)
3. `20260423_fotel_s1_label_template.sql` — `label_templates_v2` dla productType=fotel, series=S1
4. `20260423_fotel_s1_relation_front_inherit.sql` — relacja / mechanizm front-inherit z sofa-seat

### Code
- `skuDecoderGeneric.ts` — rozdzielić fotel-seat od sofa-seat; resolve `fotel_front_foam` z sofa-seat
- `labelsV2.ts` — fotel sheet render (jedna sekcja zamiast dwóch)
- `DecodedSKU.fotel` — nowe pole (seat: frame/frameModification/spring/foams)

## Zapisano

Spec ustalony w sesji 2026-04-23 (branch `claude/add-armchair-session-LeB8h`).
