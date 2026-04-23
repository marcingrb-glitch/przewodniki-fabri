# Handoff: Labels V2 — stan 2026-04-23

Zastępuje `2026-04-22-labels-v2-state.md`. Główna praca: finalizacja S2, migracja N2 na styl S2 + szezlong z rolami pianek.

## Co zrobione

### S2 (Sofa Elma)
- **SIEDZISKO**: title `SIEDZISKO {width}` → "SIEDZISKO 190 cm"
  - Pola: Model·Typ / Stelaż / Modyfikacja stelaża / Sprężyna / Automat / Pozycja śrub
  - Stelaż ujednolicony `S2-SD-{190|200}` (migracja `20260422_s2_seat_frame_unified.sql`)
  - UWAGI wywalone (frame_modification jako osobny wiersz)
- **OPARCIE**: title `OPARCIE {width_raw} x {backrest.height_raw} cm` → "OPARCIE 190 x 68 cm"
  - Sekcje: OPARCIE (frame, spring) / PIANKI / SKRZYNIA
  - SKRZYNIA w stylu `cut_with_header` (cut-line + pełny nagłówek, żeby odcięta skrzynia miała kontekst)
  - SKRZYNIA content: `chest.name` + `automat.name_code` → "SK23 - 190" + "Automat  Zwykły | AT1"
- **Fotel S2**: całkowicie wywalony (nie ma fotel template)
- **Automat names**: wyczyszczone z double-spacji ("Automat  Zwykły" → "Automat Zwykły")

### S2 siedziska SD1-SD5 + D
- **SD*D** (SD2D/SD3D/SD4D): live-inherit pianek z base (SD2/SD3/SD4) przez `copies_from`.
- **SD5** (Całe): własne pianki z czapą **pojedynczą** (187cm / 197cm dla 200)
- **SD5D** (Dzielone): własne pianki z czapą **podwójną** (2× 93,5cm / 2× 98,5cm dla 200)
- Reguła 200cm: +10cm do `length` (dla podwójnej +5cm na połówkę)

### N2 (Narożnik Elma)
- **Sofa-part** (SIEDZISKO sofy + OPARCIE sofy): mirror S2 (sekcje skopiowane 1:1)
- **Szezlong-part**:
  - SIEDZISKO szezlongu → sekcja `SZEZLONG SIEDZISKO` (Model/Stelaż/Modyfikacja/Sprężyna) + `PIANKI SZEZLONG SIEDZISKO` (pojedyncza bullet_list)
  - OPARCIE szezlongu → sekcja `SZEZLONG OPARCIE` (Model/Stelaż, sprężyna wywalona) + `PIANKI SZEZLONG OPARCIE` w stylu `bullet_list_grouped` z 4 grupami: BAZA / FRONT / BOCZNE / TYLNA
- **Header**: `NAROŻNIK Elma [N2]` (jak S1/S2, bez orientation)
- **Kolejność arkuszy**: SIEDZISKO sofy → OPARCIE sofy → SIEDZISKO szezlongu → OPARCIE szezlongu
- `show_meta_row=false` (usunięta duplikowana linia "190 cm" pod headerem)

### Decoder (`skuDecoderGeneric.ts`)
- **Live inheritance pianek**: `resolveFoamSourceId()` — jeśli produkt ma `properties.copies_from`, decoder bierze pianki z source (matchuje width + category). Obejmuje seat + backrest.
- **Chest auto-resolve**: gdy brak SK w SKU, decoder pyta `product_relations` o `allowed_chest` dla serii — jeśli tylko 1 unikalny kod (S2/N2 → SK23), bierze automatycznie i dopasowuje width.
- **foam.role** dołączony do `DecodedSKU.seat.foams / backrest.foams / chaise.*`.

### LabelsV2 (`labelsV2.ts`)
- Nowy styl `cut_with_header` — cut-line + pełny nagłówek (reuse header_template + order#) + plain content
- Nowy styl `bullet_list_grouped` — jeden outer title + sub-grupy (label + bullets) bez kresek, puste grupy pomijane
- `bullet_list` rewrite: najpierw zbiera bullets, jak pusto nie rysuje tytułu (skip całej pustej sekcji)
- `formatFoamsDetailed` bullet_list nie dokleja już prefiksu "Pianki:" dla `*.foamsList`
- Interpolation: nowe `{width_raw}` / `{backrest.height_raw}` (raw number, bez auto "cm")

### Admin
- **Dropdown "Kopia modelu"** teraz dla seat + backrest + chaise (wcześniej tylko chaise)
- `handleRevertToFallback`: ustawia `copies_from=baseCode` + usuwa pianki → etykiety też zadziałają
- `handleEnableCustomFoams`: kopiuje pianki + zdejmuje `copies_from`
- `FoamSubTable.readOnly` triggered przez `copies_from` (wcześniej tylko chaise)
- **Nowa rola pianki "tylna" (back)** w dropdown FoamSubTable

### Labels Lab presety (poprawione)
- `S2 Elma`: `S2-T12A-SD1-B3-OP68A-AT1-P3A-J3-W1` (bez SK, auto-resolve)
- `N2 narożnik L`: `N2-T12A-190L-SD1-B3-OP68A-AT1-P3A-J3-W1`

## Do zrobienia

### Krótka lista
- **S1**: bez zmian w tej sesji. Układ SIEDZISKO/OPARCIE inny niż S2 (ma cut-sheet z bokami). Ew. ujednolicić po ustaleniu z userem.
- **Szezlong diagram prostokąta**: user chciał rysunek z góry, odłożone na rzecz split pianek po roli (mniejszy scope). Wątek otwarty.
- **Rozszerzenie `bullet_list_grouped` na seat/backrest S1/S2**: obecnie tylko N2 OPARCIE szezlongu. Siedzisko też ma role (base/front/side) — można zgrupować jeśli user poprosi.
- **Fotel jako osobna kategoria** (`seat_fotel` per seria): zapis z poprzedniego handoffu, odłożone.
- **N2 seed danych**: chaise N2-SZ-* mają częściowo wypełnione specs, role pianek do ustawienia w adminie (user używa nowej "tylna" gdzie trzeba).

## Kluczowe pliki

- `src/utils/pdfGenerators/labelsV2.ts` — style `cut_with_header`, `bullet_list_grouped`, raw interpolation
- `src/utils/pdfGenerators/decodingFieldResolver.ts` — resolvery per-rola (`*.foamsList_base/_front/_side/_back`, `*.Foams_base/...`)
- `src/utils/skuDecoderGeneric.ts` — `resolveFoamSourceId`, chest auto-resolve, foam.role
- `src/utils/foamHelpers.ts` — `formatFoamsByRole`
- `src/utils/fieldLabels.ts` — `seat.modelName`
- `src/pages/AdminPanel/spec/plugins/FoamSubTable.tsx` — "tylna" option + copies_from sync
- `src/pages/AdminPanel/spec/GenericSpecSection.tsx` — dropdown "Kopia modelu" dla seat/backrest
- `src/pages/AdminPanel/spec/specSectionConfigs.ts` — `copies_from` w seat+backrest propertyKeys
- `src/pages/LabelsLab.tsx` — presety S2/N2 poprawne

## Migracje (2026-04-22 — 2026-04-23)

Wszystkie puszczone ręcznie w Supabase SQL Editor. Lista chronologiczna:

- `20260422_s2_no_fotel_skrzynia_in_oparcie.sql`
- `20260422_s2_siedzisko_title_model.sql`
- `20260422_s2_seat_frame_unified.sql`
- `20260422_s2_siedzisko_model_line.sql`
- `20260422_s2_siedzisko_add_frame_mod.sql`
- `20260422_s2_siedzisko_remove_uwagi.sql`
- `20260422_s2_copy_d_seat_specs.sql`
- `20260422_s2_d_variants_live_inherit.sql`
- `20260422_s2_sd5d_revert_inherit.sql`
- `20260422_s2_sd5_sd5d_czapa_foams.sql`
- `20260422_s1_s2_oparcie_title_width_height.sql`
- `20260422_s2_skrzynia_automat_format.sql`
- `20260422_automat_remove_double_spaces.sql`
- `20260422_s2_oparcie_skrzynia_cut_header.sql`
- `20260422_n2_sofa_part_mirror_s2.sql`
- `20260422_n2_header_template_like_s1_s2.sql`
- `20260422_n2_hide_meta_row.sql`
- `20260422_n2_reorder_sheets.sql`
- `20260423_n2_siedzisko_szezlongu_align.sql`
- `20260423_n2_oparcie_szezlongu_align.sql` *(idempotentnie zastąpiona przez `_final`)*
- `20260423_n2_szezlong_pianki_grouped.sql` *(częściowo — SIEDZISKO szezlongu rewert)*
- `20260423_n2_oparcie_szezlongu_final.sql` — finalny stan OPARCIE szezlongu
- `20260423_n2_oparcie_szezlongu_add_tylna.sql` — 4-ta grupa TYLNA
- `20260423_n2_oparcie_szezlongu_add_model.sql` — Model nad Stelażem

## Konwencje
- Migracje puszczone ręcznie w Supabase SQL Editor (Lovable nie odpala auto)
- Code na `main`, Lovable auto-sync → prod deploy
- Po restarcie dev servera sesja Supabase w Claude Preview może zniknąć (lokalnie zostaje)
- User NIE chce ASCII schematów etykiet w chacie — weryfikuje w Labels Lab (`/labels-lab`)
