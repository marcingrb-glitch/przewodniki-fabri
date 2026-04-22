# Handoff: Labels V2 — stan 2026-04-22

## Co zrobione (S1)

### Architektura
- V3 ukryte w UI (tylko kod zostaje)
- **Labels Lab** (`/labels-lab`) — szybka iteracja SKU → PDF, HMR auto-regen
- **Admin: /admin/header-variables** — tabela wszystkich zmiennych (header + display_fields) z wartościami per seria
- PDFPreview renderuje przez **pdf.js canvas** (działa też w Claude Preview)

### Generator V2 (labelsV2.ts)
- **Auto-fit font per linia** + wspólny font per sekcja (najmniejszy wymagany)
- **Global scale-up/down**: content zawsze na 1 stronie arkusza (skaluje od `BODY_MIN=10` do `BODY_HARD_CAP=26`)
- **Section titles** wspierają interpolację: `{width}`, `{backrest.height}`, `{series.*}`, `{orientation}` + fallback do `resolveDecodedField`
- **Header layout**: LEFT = rozwinięty `header_template`, RIGHT = big order# (32pt)
- **Section dividers** — czarne grube linie (0.5mm)
- **legs_list** section style — nóżki z cut-line + mini-header (tylko order# + czarna kreska, bo uniwersalne)
- `formatFoamsDetailed`: pianki z SKU-like sufiksem (Półwałek SD04) bez wymiarów

### Etykiety S1
- **SIEDZISKO**: title `SIEDZISKO {width}`, AUTOMAT scalony z SIEDZISKO
- **OPARCIE**: title `OPARCIE {backrest.height}`, NOGI jako legs_list (cut-line)
- **FOTEL** (osobny arkusz): SIEDZISKO + PIANKI + OPARCIE + PIANKI + NOGI (tylko fotel-legs)
- **Cut-sheet S1**: 3 sekcje BOCZEK/BOCZEK/SKRZYNIA, każda z main-header styleem

### Fotel dekodowanie
- `hasFotel` = `FT` w extras
- `fotelSKU` = `FT-{series}-{fabric}-{seat}-{side}-{jaski}-{legs}`
- `fotelLegs` = legs code + series properties `fotel_leg_height_cm` (def 15) + `fotel_leg_count` (def 4)
- Wszystkie komponenty (seat/backrest/side/foams) SHARED z sofą

### Pufa
- Header: `PUFA {series.collection} [{series.code}]`, show_meta_row=false
- Diagram box: mniejszy (40mm default), auto-fit, wymiary z 'x' → najmniejsza liczba
- Pufa NIE dokleja się już do sofa PDF (osobny generator)

### UI
- "Pobierz wszystkie etykiety (1 PDF)" — V2 sofa + pufa + fotel scalone (pdf-lib)
- "Pobierz przewodniki produkcji":
  - sofa PDF (zawsze)
  - pufa/fotel PDF (scalone gdy oba są) — **sofa osobno**, dodatki razem
- Warehouse guide: orphan-prevention dla section title + tabela

## Do zrobienia

### S2 (w nowej sesji)
- **Migracja S2 mirror S1** zapisana: `supabase/migrations/20260422_s2_mirror_s1.sql` (puszczona w DB)
- Zweryfikować S2 w Labie, ustalić różnice vs S1
- S2 nie ma cut-sheetu (tylko S1 ma V1 templates dla side/chest)
- Brak chaise w S2 (chaise = N2)

### Fotel — osobna specyfikacja
Użytkownik chce fotel jako osobny byt (nie klejony z sofy):
- Nowa kategoria `seat_fotel` w DB (jak `seat_pufa`)
- Per seria (S1 fotel inne niż S2)
- Własne wymiary, pianki, szerokość fotela
- Dekoder wciąga fotel-specific komponenty gdy `hasFotel`

### N2 (narożnik) — później
Już ma 4 arkusze V2 z orientation. Do weryfikacji po S2.

## Kluczowe pliki
- `src/utils/pdfGenerators/labelsV2.ts` — cały generator V2
- `src/utils/pdfGenerators/decodingFieldResolver.ts` — resolvery pól
- `src/utils/fieldLabels.ts` — SHORT_FIELD_LABELS (nazwy pól)
- `src/pages/LabelsLab.tsx` — test harness
- `src/pages/AdminPanel/HeaderVariables.tsx` — zmienne z wartościami per seria
- `supabase/migrations/20260420_*`/`20260421_*`/`20260422_*` — migracje S1

## Konwencje
- Migracje puszczone ręcznie w Supabase SQL Editor (Lovable nie odpala auto)
- Code na `main`, Lovable auto-sync
- Po restarcie dev servera — sesja Supabase w Claude Preview może zniknąć (lokalnie zostaje)
