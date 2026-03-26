# Kobik DB Refactor — Progress Tracker

*Wersja 3.6.0 • 20 marca 2026 (sesja popołudniowa)*

## Etap 1 — Nowe tabele + seed data — DONE ✓

Wszystkie migracje danych kompletne. Seed brakujących danych (1.5) wykonany. N2 narożnik przesunięty na po Etapie 3.

## Etap 2 — Refaktor kodu — DONE ✓

- [x] 2.1–2.4 — Parser, decoder, ściągawki, admin panel — DONE ✓
- [x] 2.5 — Decoder: zero-padding normalizacja ✓
- [x] 2.5b — Fix parsowanie boczków ✓
- [x] 2.5c — Zunifikowane aliasy SKU ✓
- [x] 2.5d — Admin panel UI cleanup ✓ (Aliasy SKU rename, Format SKU reference page)
- ~~2.6 — Dokumentacja 3D~~ → odroczone, do zrobienia gdy będą pliki z Shapr3D
- ~~2.7 — Type updates~~ → wchłonięte w Etap 3 cleanup

## Etap 3 — Cleanup — DONE ✓

- [x] 3.A — Przełączenie `from("series")` + finishValidator na `products` ✓
- [x] 3.A SQL — FK `guide_sections` + `label_templates` przepięte z `series` → `products` ✓
- [x] 3.B — Preview/mock data refaktor (GuidePreview, LabelConfigurator, DecodingTemplates) ✓
- [x] 3.C — DROP 22 starych tabel ✓
- [x] 3.D — Code cleanup (DisplayFieldsSelector source strings) ✓
- [x] Lovable: SWC→Babel migration (infrastruktura, nie migracja DB) ✓

### Weryfikacja końcowa Etap 3
- Zero queries do starych tabel w `src/`
- 22 starych tabel usunięte z DB
- Stare pliki (skuParser.ts, skuDecoder.ts, mappings.ts, stare admin komponenty) usunięte
- FK guide_sections + label_templates wskazują na `products`
- Typy TypeScript — SeriesConfig i SewingVariant zamienione na lokalne interfejsy
- Build: zero błędów

---

## MIGRACJA ZAKOŃCZONA ✅

Cały codebase działa na zunifikowanym schemacie:
- **`products`** — wszystkie produkty i komponenty (zamiast 13+ osobnych tabel)
- **`product_specs`** — specyfikacje techniczne (pianki, wymiary)
- **`product_relations`** — relacje między komponentami (automaty, kompatybilność, poduszki, aliasy SKU, warianty szycia)
- **`sku_segments`** — reguły parsowania SKU (zamiast hardcoded regex)
- **`workstations`** + **`cheatsheet_sections`** — ściągawki data-driven

---

## Etap 4 — Audyt spójności danych — DONE ✓

### 4.1 — seat_type zunifikowane ✓
### 4.2 — commercial_name + collection ✓
### 4.3 — Boczki name → produkcyjne ✓
### 4.4 — Brak admin config dla globalnych kategorii — ZAPARKOWANE
### 4.5 — Braki do uzupełnienia
- [ ] `commercial_name` w admin panelu dla seat i backrest (brief wrzucony, Lovable zrobił tylko side)

---

## Etap 5 — Etykiety — DONE ✓

### 5.1 — WYSIWYG podgląd etykiet ✓
### 5.2 — Fix ilość nóżek pufy/fotela ✓
### 5.3 — Dynamiczny model w lewej strefie ✓ (deployed)
### 5.4 — Uproszczenie czcionek lewej strefy ✓ (w briefie 5.3)
### 5.5 — Fix nagłówek auto-font ✓ (deployed w brief-fix-magazyn-v2)
### 5.6 — Default SKU z PF/FT ✓ (w briefie 5.3)

---

## Etap 6 — Przewodniki PDF — DONE ✓ (sesja 19.03.2026)

### 6.1 — Dead code cleanup ✓
### 6.2 — WYSIWYG podgląd przewodników ✓
### 6.3 — Przewodnik Magazyn — hardcoded layout ✓
### 6.4 — Przewodnik Produkcja — hardcoded layout ✓
### 6.5 — Admin cleanup ✓
### 6.6 — Fixy decodera ✓

---

## Etap 7 — Admin CRUD + Nóżki + Ściągawki (sesja 19.03.2026 popołudnie)

### 7.1 — PillowMapping CRUD ✓
### 7.2 — Usunięcie taba "Wyjątki boczków" ✓
### 7.3 — Edytowalne nóżki pufy/fotela ✓
### 7.4 — Fix tabeli "Kto co kompletuje" ✓
### 7.5 — Fix ściągawek nóżek ✓
### 7.6 — Ściągawka magazynu stolarki i pianek ✓ (WarehouseFullRenderer deployed)

---

## Etap 8 — Redesign ściągawek + PDF (sesja 19.03.2026 wieczorna)

### 8.1 — Fix WarehouseFullRenderer ✓
### 8.2 — Tytuł i layout ✓
### 8.3 — PDF generator ściągawek ✓
### 8.4 — Fix etykiety header auto-fit ✓
### 8.5 — Fix ściągawki krojowni ✓
### 8.6 — Fix ściągawki nóżek ✓
### 8.7 — KierownikFullRenderer ✓ (deployed)
### 8.8 — Checkbox "Własne pianki" dla dzielonych siedzisk ✓ (deployed)
### 8.9 — Fix danych ✓
### 8.10 — Zużycie tkaniny na zamówieniach ✓ (deployed)
### 8.11 — UI zamówienia — fixy ✓ (deployed)

---

## Etap 9 — Fixy ściągawek + UX (sesja 20.03.2026)

### 9.1 — Overflow ściągawek ✓ (deployed)
- SkuVisualizer: `flex flex-wrap` zamiast `inline-flex` (ucięcie legendy SKU)
- KierownikFullRenderer: `table-fixed` + `break-words` na tabelach
- CheatsheetRenderer: `overflow-hidden` na kontenerze

### 9.2 — Materiał pianki w foamLine kierownika ✓ (deployed)
- KierownikFullRenderer: `foamLine` z materiałem (np. `Nakrywkowa 9×78×190 VPPT 30-40 Pionier`)
- WarehouseFullRenderer: bez zmian (celowo bez materiału)

### 9.3 — Label boczka "Model" ✓ (deployed)
- DisplayFieldsSelector: `side.name` label zmieniony z "Boczek" na "Model"

### 9.4 — PDF info-box adaptive layout ✓ (deployed)
- `cheatsheetPdf.ts`: adaptive 1-col/2-col (mierzy szerokość tekstu)
- Nota "* Sprężyna inna niż domyślna" przeniesiona do footera ostatniej strony

### 9.5 — Usunięcie kolumny "Pianki" z tabel siedzisk ✓ (deployed)
- Usunięta z WarehouseFullRenderer, KierownikFullRenderer, cheatsheetPdf.ts
- Pianka bazowa zostaje w info-boxie
- Usunięta funkcja `computeShowPiankiCol` i prop `showPianki`

### 9.6 — Fix pianka bazowa w info-boxie ✓ (deployed)
- SQL fix literówki: SD01N materiał "Pioner" → "Pionier" (psyło `specsAreEqual`)
- SQL backfill `foam_role` na istniejących piankach (ALTER TABLE DEFAULT nie backfilluje)
- Info-box: wymiary + materiał bez nazwy "Baza" (redundantne z labelem)

### 9.7 — Debug logs usunięte ✓ (deployed)
### 9.8 — Legenda SKU auto-scale + filename PDF ✓ (deployed)
- SkuVisualizer: `transform: scale()` + ResizeObserver (zawsze 1 linia, skalowana do szerokości)
- Filename PDF: `sciagawka-{stanowisko}-{seria}.pdf`

### 9.9 — Collapsible sidebar ✓ (deployed)
- Menu boczne domyślnie schowane, overlay z toggle button
- Content na pełną szerokość, sidebar nie drukuje się

---

## Hardcoded — ROZWIĄZANE ✓

| Co | Status |
|----|--------|
| SK22→SK23 | ✅ → sku_alias w DB |
| SK23→N4 | ✅ → override_leg w properties SK23 |
| pufa_leg=16 | ✅ → z series properties |
| fotel_leg=15 | ✅ → z series properties (fotel_leg_height_cm) |
| B6S/B6W/B6D exceptions | ✅ → sku_alias + admin CRUD |
| Validator bez exceptions | ✅ → fetchSkuAliases przed validateSKU |
| seat_type hardcoded 'Dzielone' | ✅ → zunifikowane wartości w DB |
| pufa/fotel leg count | ✅ → z series properties |
| Śruby zamkowe | ✅ → hardcoded w warehouseGuide + ściągawkach (seria×automat) |
| Pasek środkowy | ✅ → hardcoded 1.5×19×50 T-21-25 |

## Decyzje architektoniczne (sesja 17.03.2026)

- **sku_alias** — jeden generyczny relation_type dla aliasów Shopify→Produkcja
- **Dwa tryby aliasu** — Alias (B6S→B6): dopisuje finish. Exact (B6D→B6C): zamienia cały segment
- **Pufa nóżki = sofa seat legs** — z automat_config (wysokość), count z series properties
- **SK23 override_leg** — w properties produktu
- **Regex boczka** — `^B(\d+)([A-D])?$`. Kody Shopify przez sku_alias
- **pillow_finish_rules** — w properties relacji seat_pillow_map
- **SD02NB** — osobny rekord seat_pufa
- **normalizeComponentCode** — P01→P1 w decoderze

## Decyzje architektoniczne (sesja 18.03.2026 rano)

- **"Reguły parsowania" → "Format SKU"** — read-only referencja z `sku_segments` + `product_types`
- **Etap 3 rozbity na 4 kroki** — A (series switch + finishValidator), B (preview mock data), C (DROP SQL), D (code cleanup)
- **guide_sections + label_templates FK** — migracja z `series.id` na `products.id` (SQL przed kodem)
- **SWC→Babel** — Lovable Nix env miał problem z musl detection; przełączenie na @vitejs/plugin-react

## Decyzje architektoniczne (sesja 18.03.2026 wieczór — audyt)

- **seat_type zunifikowane** — 3 wartości: Gładkie, Wciąg, Dzielone. Globalne.
- **center_strip = pochodna seat_type** — Wciąg/Dzielone → true, Gładkie → false
- **name = produkcyjna, commercial_name = handlowa**
- **model_name na boczkach S1** — "Viena" (kolekcja)
- **collection S2** — "Elma" (fix: było "Modena")
- **source: "field" w SpecColumnDef**

## Decyzje architektoniczne (sesja 18.03.2026 wieczór — etykiety)

- **WYSIWYG podgląd etykiet** — jsPDF → pdf.js canvas
- **Podgląd z prawdziwego decodera**
- **Pufa/fotel leg count = z series properties**
- **component.model_name** — dynamiczne pole lewej strefy
- **1 czcionka lewej strefy** — auto-shrink
- **Nagłówek etykiety = auto-fit** — header i content osobny auto-shrink

## Decyzje architektoniczne (sesja 19.03.2026 — przewodniki PDF)

- **Hardcoded layout obu przewodników** — guide_sections nie używane przez żaden generator. Data-driven zostawione w DB na przyszłość, ale admin UI wyczyszczony.
- **Przewodnik Magazyn = 1 PDF** — sofa + pufa + fotel na jednej kartce (kierownik dostaje jedną kartkę per zamówienie)
- **Przewodnik Produkcja = osobne PDF-y** — sofa, pufa, fotel osobno (bo inny tapicer może robić pufę/fotel)
- **Rename: Przewodnik Magazyn / Przewodnik Produkcja** — dawniej "Przewodniki" / "Dekodowanie". Kod: warehouseGuide / productionGuide
- **Boczek na Przew. Magazyn: Kod + Stelaż + Piankowanie** — nazwa produkcyjna = piankarz wie jak piankować
- **Boczek na Przew. Produkcja: Nazwa + Wykończenie** — krawcowa/tapicer potrzebują wykończenie
- **Pufa/fotel bez kolumny Typ** — zawsze gładkie
- **Kody w nagłówkach sekcji (Przew. Produkcja)** — bold nazwa sekcji + normal kod. Oszczędza kolumnę w tabeli.
- **Nóżki: ilość w nagłówku kolumny** — "Pod skrzynię (4 szt)" zamiast wartości z "(4 szt)" która się łamie
- **White trim zdjęcia wariantu** — canvas-based przycięcie białego tła (próg RGB > 245)
- **Wariant szycia z product_relations** — decoder fetchuje sewing_variant zamiast properties.top. Match po wykończeniu + modelu siedziska.
- **productColors obsługuje array format** — `[{code, name}]` → `Record<string, string>`

## Decyzje architektoniczne (sesja 19.03.2026 popołudnie — admin CRUD + nóżki + ściągawki)

- **PillowMapping model** — seat_pillow_map w product_relations. Wyjątek per boczek = osobny rekord z `exception_side_code` w properties. pillow_finish_rules = mapa `{seatFinish: pillowFinish}` w properties.
- **Nóżki pufa/fotel source of truth** — series properties (pufa_leg_height_cm, fotel_leg_height_cm etc.). Edycja w tabeli "Kto co kompletuje" (inline). Taby Pufa/Fotel = read-only.
- **Typ nóżek siedziskowych** — wyliczany z wysokości w automat_config (height ≤ 2.5 → plastikowe), nie z series properties.seat_leg_type.
- **S1 seat_leg_type fix** — zmiana z "plastic_2_5" na "from_sku" (bug: AT1 ma 15cm nóżki, nie plastikowe)
- **foam_role w product_specs** — nowe pole TEXT: 'base' (pianka bazowa/nakrywkowa/czapa/boczna) lub 'front' (front/półwałek/pasek)
- **foam_set w products.properties** — flaga boolean na siedziskach z setami pianek. Label "Set pianek" (bez Barga).
- **Ściągawka magazynu = 1 uniwersalny renderer** — zastępuje 4 sekcje. Kolumny dynamiczne per seria. + Skrzynie + Automaty.
- **Oparcia S2 grupowanie** — warianty z identycznymi piankami w jednym wierszu.

## Decyzje architektoniczne (sesja 19.03.2026 wieczór — redesign ściągawek)

- **Tytuł "SPECYFIKACJA TECHNICZNA | SOFA Sx KOLEKCJA"** — uppercase, dla wszystkich stanowisk
- **Sprężyny exception = bold + underline** — nie czerwone (drukarka czarno-biała)
- ~~**Kolumna "Pianki" ukryta gdy pusta**~~ → **USUNIĘTA** (9.5) — pianka bazowa w info-boxie wystarczy
- **foamLine magazyn = nazwa + wymiary** — bez materiału (piankarz wie po nazwie)
- **foamLine kierownik = nazwa + wymiary + materiał** — kierownik potrzebuje pełną info
- **Pianka bazowa w info-boxie = wymiary + materiał** — bez nazwy "Baza" (redundantne z labelem)
- **Sortowanie naturalne** — B1...B9, B10 (nie tekstowe)
- **Krojownia: "Dozwolone szwy"** — label zmieniony z "Dozwolone"
- **Krojownia: bez kolumny "Domyślne"** — zbędna dla krawcowej
- **Krojownia: warianty szycia dezaktywowane** — zduplikowane wiersze, mało czytelne
- **Poduszki: Typ + Szycie** — zamiast kolumny "Wykończenie" (zawsze "dziedziczone")
- **sewing_technique** — nowe pole w properties poduszek (pikowana, wciąg, gładka)
- **production_notes** — nowe pole w properties boczków (B7 = "sztanga doszywana")
- **Nóżki S2: jeden box** — "Wszystkie nóżki N4 plastikowa. Nie kompletować."
- **Tabelka nóżek wbudowana w LegCompletionRenderer** — warunkowo ukryta gdy allPlastic
- **KierownikFullRenderer** — nowy renderer, 9 sekcji, kolejność jak segmenty SKU
- **Legendy SKU + wykończeń pod sobą** — nie obok siebie
- **Info-box w sekcji siedzisk** — nie jako osobna sekcja na górze
- **Checkbox "Własne pianki"** — dla dzielonych siedzisk w admin panelu. OFF = fallback (read-only), ON = kopiuje specs
- **SD5D własne specs** — jedyne dzielone z innymi piankami (czapy 2×79×91 vs SD5 1×79×186.5)
- **Zużycie tkaniny** — nowe pole `fabric_usage_mb` na `orders`. Inline edit na liście, filtr "Bez metrażu".

## Decyzje architektoniczne (sesja 20.03.2026 — fixy ściągawek + UX)

- **SkuVisualizer auto-scale** — `transform: scale()` + ResizeObserver zamiast flex-wrap. Legenda zawsze 1 linia, skalowana do szerokości kontenera.
- **Kolumna "Pianki" usunięta z tabel siedzisk** — pianka bazowa w info-boxie, reszta (sety, dzielone) domena kierownika. `computeShowPiankiCol` usunięta.
- **PDF info-box adaptive** — mierzy czy 2 kolumny mieszczą się; jeśli nie → 1 kolumna. Nota sprężynowa w footerze.
- **Label etykiety boczka** — "Model" zamiast "Boczek" (redundantne z nagłówkiem)
- **Sidebar admin panelu** — chowane domyślnie, overlay z toggle button (do wdrożenia)
- **foam_role backfill** — ALTER TABLE DEFAULT nie aktualizuje istniejących wierszy w PostgreSQL. Wymagany ręczny UPDATE.

---

## Następne kroki

1. **KOBIK-PRODUCTS.md update** — poprawki: S2 collection=Elma, sprężyna Bargi 63A (nie 54A), foam_role, sewing_technique, production_notes
2. **commercial_name w admin seat/backrest** — Lovable brief do ponownego wrzucenia
3. **Etap 1.4** — seed N2 narożnik
4. **Wspólny widok CRUD** — edycja globalnych produktów poza kontekstem serii
5. **Bundle size** — code-splitting AdminPanel + pdfGenerators (non-blocking)

## Pliki z sesji 17.03.2026 (wieczór)

- `sql-seed-missing-data.sql` — executed ✓
- `brief-decoder-zero-padding.md` — deployed ✓
- `brief-fix-side-exceptions-v2.md` — deployed ✓
- `brief-unified-sku-aliases.md` — deployed ✓

## Pliki z sesji 18.03.2026 (rano)

- `brief-sku-format-reference.md` — deployed ✓
- `brief-fix-sku-visualizer.md` — deployed ✓
- `brief-etap3-krok-a-series-switch.md` — deployed ✓
- `brief-etap3-krok-b-preview-mock-refactor.md` — deployed ✓
- `sql-etap3-krok-c-drop-old-tables.md` — executed ✓
- `brief-etap3-krok-d-code-cleanup.md` — deployed ✓

## Pliki z sesji 18.03.2026 (wieczór — audyt)

- `sql-fix-seat-type-center-strip.sql` — executed ✓
- `brief-fix-seat-type-cheatsheets.md` — deployed ✓
- `sql-add-commercial-name.sql` — executed ✓
- `brief-add-commercial-name.md` — deployed (częściowo — side OK, seat/backrest TBD)
- `sql-fix-side-names.sql` — executed ✓
- `brief-fix-side-admin-columns.md` — deployed ✓
- `KOBIK-PRODUCTS.md` v1.3 — zaktualizowany

## Pliki z sesji 18.03.2026 (wieczór — etykiety)

- `brief-label-preview-wysiwyg.md` — deployed ✓
- `brief-fix-pufa-fotel-leg-count.md` — deployed ✓
- `brief-left-zone-dynamic-model.md` — deployed ✓
- `brief-fix-header-font-size.md` — deployed ✓ (w brief-fix-magazyn-v2)

## Pliki z sesji 19.03.2026 (przewodniki PDF)

- `brief-guide-cleanup-wysiwyg-preview.md` — deployed ✓
- `brief-guide-pdf-redesign.md` — deployed ✓
- `brief-fix-guide-spacing.md` — deployed ✓
- `brief-fix-guide-spacing-v2.md` — deployed ✓
- `brief-fix-separator-overlap.md` — deployed ✓
- `brief-fix-midstrip-dimensions.md` — deployed ✓
- `brief-production-guide-redesign.md` — deployed ✓
- `brief-admin-cleanup-and-rename.md` — deployed ✓
- `brief-fix-production-warehouse-v2.md` — deployed ✓
- `brief-fix-fotel-boczek-warehouse.md` — deployed ✓
- `brief-fix-decoder-sewing-variant.md` — deployed ✓
- `brief-fix-decoder-colors-array.md` — deployed ✓
- `brief-fix-legs-count-in-header.md` — deployed ✓
- `brief-fix-capitalize-pillow.md` — deployed ✓

## Pliki z sesji 19.03.2026 (popołudnie — admin CRUD + nóżki + ściągawki)

- `sql-seed-pillow-mapping.sql` — executed ✓
- `brief-pillow-mapping-crud.md` — deployed ✓
- `brief-fix-pillow-ux.md` — deployed ✓
- `brief-fix-pillow-width-v2.md` — deployed ✓
- `brief-remove-side-exceptions-tab.md` — deployed ✓
- `sql-seed-fotel-leg-properties.sql` — executed ✓
- `brief-editable-pufa-fotel-legs.md` — deployed ✓
- `brief-fix-leg-completion-bugs.md` — deployed ✓
- `brief-fix-cheatsheet-legs.md` — deployed ✓
- `brief-fix-leg-units.md` — deployed ✓
- `sql-foam-role-and-fixes.sql` — executed ✓
- `brief-warehouse-cheatsheet-renderer.md` — deployed ✓

## Pliki z sesji 19.03.2026 (wieczór — redesign ściągawek)

- `sql-fix-sd5-cap-foam.sql` — executed ✓ (fix SD5 czapa 1×186.5)
- `sql-sd5d-own-specs.sql` — executed ✓ (pełny komplet specs SD5D z czapą 2×91)
- `sql-fix-s2-collection.sql` — executed ✓ (Modena → Elma)
- `sql-fix-krojownia-sections.sql` — executed ✓ (columns + dezaktywacja wariantów)
- `sql-dozwolone-szwy-label.sql` — executed ✓
- `sql-kierownik-full-section.sql` — executed ✓
- `sql-deactivate-nozki-typy.sql` — executed ✓
- `brief-cheatsheet-pdf-and-fixes.md` — deployed ✓ (PDF generator + WarehouseFullRenderer fixes + etykiety header auto-fit)
- `brief-fix-magazyn-v2.md` — deployed ✓ (ukrycie Pianki, info-box, sortowanie, sprężyny, tytuł, PDF portrait)
- `brief-fix-krojownia.md` — deployed ✓ (PillowMappingRenderer + FinishesTable fixes)
- `brief-fix-nozki.md` — deployed ✓ (AT1/AT2, allPlastic box, usunięcie kolorów)
- `brief-kierownik-full-renderer.md` — deployed ✓ (KierownikFullRenderer 9 sekcji)
- `brief-custom-foams-checkbox.md` — deployed ✓ (checkbox "Własne pianki" w FoamSubTable)
- `brief-fabric-usage.md` — deployed ✓ (zużycie tkaniny + UI zamówienia)
- `S1-model-techniczny.md` — dokumentacja techniczna modelu S1 (dla Moldo)
- `S1-sql-dump-queries.md` — SQL queries do dumpa danych S1

## Pliki z sesji 20.03.2026 (fixy ściągawek + UX)

- `brief-fix-cheatsheet-overflow.md` — deployed ✓ (SkuVisualizer flex-wrap, table-fixed, overflow-hidden)
- `brief-kierownik-foam-material.md` — deployed ✓ (materiał w foamLine kierownika)
- `brief-label-side-name-model.md` — deployed ✓ (label "Model" zamiast "Boczek")
- `brief-fix-pdf-infobox-overflow.md` — deployed ✓ (adaptive info-box + nota footer)
- `brief-remove-pianki-column.md` — deployed ✓ (usunięcie kolumny Pianki z 3 plików)
- `brief-fix-baza-name-infobox.md` — deployed ✓ (wymiary+materiał bez "Baza")
- `sql-fix-foam-role-backfill.sql` — executed ✓ (backfill foam_role base/front)
- `SQL fix literówki Pioner→Pionier` — executed ✓
- `brief-remove-debug-logs.md` — deployed ✓
- `brief-sku-autofit-and-filename.md` — deployed ✓ (legenda SKU auto-scale + filename PDF)
- `brief-collapsible-sidebar.md` — deployed ✓ (chowane menu boczne)
