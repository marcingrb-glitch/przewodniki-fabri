# Kobik — CLAUDE.md

Appka webowa generująca przewodniki produkcyjne, etykiety i ściągawki stanowiskowe dla fabryki mebli tapicerowanych. React 18 + TypeScript + Vite + Tailwind + shadcn/ui + Supabase. Hosting: Lovable.dev. Pilot systemu Moldo (AI-native ERP).

## Repo Structure

```
src/
  components/          — React components (UI)
  integrations/        — Supabase auto-generated types
  pages/
    AdminPanel/        — Admin CRUD + spec + cheatsheets
    OrderDetailsPage.tsx — Główny widok zamówienia
  types/index.ts       — ParsedSKU, DecodedSKU, ProductFoamItem
  utils/
    skuParserGeneric.ts  — Generic SKU parser (z sku_segments)
    skuDecoderGeneric.ts — Generic SKU decoder (z products + specs + relations)
    pdfGenerators/       — PDF generation (labels, guides, decoding)
docs/
  decisions/           — Architectural Decision Records (ADR)
  handoffs/            — Context transfer files between chats
public/fonts/          — Noto Sans (polskie znaki)
supabase/
  migrations/          — SQL migration files (chronologicznie)
  functions/           — Edge Functions (Deno runtime)
```

Key files: `TODO.md` (bieżące taski), `PROGRESS.md` (archiwum + decyzje), `KOBIK-PRODUCTS.md` (reguły biznesowe), `INSTRUCTIONS.md` (Instructions dla claude.ai).

## Tech Stack

- Frontend: React 18 + TypeScript (strict) + Vite
- Styling: Tailwind CSS + shadcn/ui
- Backend: Supabase (Postgres + Auth + Storage + Edge Functions)
- PDF: jsPDF (browser-side), fonty Noto Sans w `/public/fonts/`
- Deployment: Lovable.dev (auto-sync z GitHub repo)
- Integrations: Shopify (zamówienia), Mimeeq (zdjęcia wariantów)

## Architektura danych (post-migracja)

Zunifikowany schemat (22 starych tabel usunięte):
- **`products`** — wszystkie produkty i komponenty, z `category` enum
- **`product_specs`** — specyfikacje techniczne (pianki, wymiary)
- **`product_relations`** — relacje (automaty, kompatybilność, poduszki, aliasy SKU, warianty szycia)
- **`sku_segments`** — reguły parsowania SKU (zamiast hardcoded regex)
- **`workstations`** + **`cheatsheet_sections`** — ściągawki data-driven

Queries: `from("products").eq("category", "series")` — to poprawny pattern, NIE legacy.

## Git Workflow

- Commit convention: `feat:`, `fix:`, `refactor:`, `docs:`, `chore:`
- Auto-rebase: `git config pull.rebase true` (ustawione w repo). `git pull && git push` wystarczy — nie trzeba `--rebase`.
- Always commit after completing an edit. Push after session.
- Terminal commands: clean, no comments (#), no pagers, copy-paste ready.
- Download folder (fallback): `~/Downloads/Kobik_Git/` (mkdir -p on first use)

## Two-tool Workflow

| Chcę... | Narzędzie |
|---------|-----------|
| Dyskutować architekturę, decyzje | **claude.ai** |
| Edytować pliki projektowe (TODO, PROGRESS, CLAUDE.md) | **Code** |
| Edytować kod app + deploy | **Lovable** (na razie) |
| Quick fix, debug, analiza | **Code** |

**Kluczowa zasada:** Code nie widzi memory claude.ai. Claude.ai nie widzi zmian w repo. Bridge = pliki w repo (TODO.md, handoffy, CLAUDE.md).

## Context Window Management

- Efektywny budżet: ~96k tokenów (nie 200k)
- Po dużym pliku/fetchu: `/compact` od razu
- Długa sesja = Code "zapomina". Lepiej `/clear` i nowa sesja niż ciągnięcie.
- Compaction niszczy kontekst — po `/compact` weryfikuj że pamiętasz ustalenia.

## Core Rules

1. **Source of truth = kod w repo.** Claude.ai Project Files = snapshot — mogą być nieaktualne.
2. **TODO.md = bridge** między claude.ai i Code. Oba go czytają.
3. **Decisions w plikach, nie w chatach.** Ważne decyzje → `docs/decisions/` lub sekcja w PROGRESS.md.
4. **Nie wymyślaj danych.** Jeśli potrzebujesz faktu o biznesie (wymiary, pianki, dostawcy) — pytaj, nie zakładaj.
5. **TypeScript strict** — no `any` bez komentarza dlaczego.
6. **Komponenty funkcyjne + hooks** (no class components).
7. **React Query** dla server state, useState/useReducer dla local state.

## Supabase Rules

- Supabase: Lovable-hosted (project ID: `gvjthssbfiftbfeounhm`)
- Migracje SQL: ZAWSZE nowy plik w `supabase/migrations/`, nigdy edycja istniejącego
- RLS policies: authenticated read, admin write
- Edge Functions: Deno runtime, secrets w Lovable dashboard
- Storage: private buckets, upload via service_role

## PDF Generation

- **Ściągawki stanowiskowe**: `window.print()` — NIE html2pdf/html2canvas (vertical-align i JS nie działają w html2canvas). CSS print w `index.css`.
- **Przewodniki produkcyjne + etykiety**: jsPDF w przeglądarce (browser-side)
- Fonty: Noto Sans (`/public/fonts/`) — polskie znaki
- Formaty: przewodnik A4, etykiety 100×30mm, ściągawki A4 portrait
- Print CSS: `.no-print` na UI, `.print-area` na content
- Backward compat NIE jest potrzebny
- Przyszłość: jeśli potrzebny auto-download PDF bez dialogu → Puppeteer w Edge Function

## SKU Parsing & Decoding

- Parser cache (`segmentRulesCache` w skuParserGeneric.ts) jest in-memory — zmiany regex w `sku_segments` wymagają hard refresh przeglądarki
- Decoder ma 3-step seat fallback: exact → zero-padded (SD1→SD01) → strip finish. Aliasy SKU (`product_relations.sku_alias`) matchują surowy segment (bez zero-padding)
- `allowed_finishes` na produkcie wymusza valid finish — decoder fallbackuje do `default_finish` gdy parsed finish jest nieprawidłowy
- Warunkowe modyfikacje (np. listwa SD01N+B9B): tekst w `products.properties.frame_modification` z "(tylko z X)" — decoder stripuje na dokumentach, admin widzi pełny tekst

## Label Templates

- `is_conditional` + `condition_field` kontrolują kiedy etykieta się drukuje — check w `decodingFieldResolver.ts:checkDecodedCondition()`
- Dostępne warunki: `has_special_notes`, `extras_pufa_fotel`, `legHeights.*`, `pufaLegs`
- Admin panel: `LabelTemplates.tsx` — toggle "Warunkowa" + select z `CONDITION_LABELS` mapą
- Nowe warunki: dodaj do `checkDecodedCondition()` + `CONDITION_LABELS` w LabelTemplates.tsx

## Lovable Integration

- Migracje SQL z `supabase/migrations/` NIE wykonują się automatycznie przez Lovable — trzeba poprosić Lovable o uruchomienie lub wkleić ręcznie w Supabase SQL Editor
- Lovable może nadpisać dane w DB przy re-seedzie — weryfikuj stan bazy po zmianach

## Nie dotykaj

- Auth flow (login, registration, approval)
- Supabase config (`supabase/config.toml`)
- RLS na `user_roles`, `profiles`
- Edge function secrets (Shopify API key, Mimeeq)

## Format instrukcji z claude.ai

Instrukcje = jeden blok markdown, gotowy do wklejenia:
1. Cel jednym zdaniem
2. Zmiany per plik: dokładne OLD→NEW lub pełna treść nowego pliku
3. Commit message

Bez narracji, bez "rozważ", bez opcji — jednoznaczne polecenie.

## Produkty (skrót)

Pełne szczegóły w `KOBIK-PRODUCTS.md`. Najważniejsze:
- **S1** (Sofa Mar, kolekcja Viena) — sofy 190cm, pufy, fotele. Nóżki N1-N5, automaty AT1/AT2.
- **S2** (Sofa Elma, kolekcja Elma) — inne proporcje/pianki. Tylko N4 (plastikowa), tylko AT1.
- **N2** (Narożnik Elma) — narożniki, NOWY, seed danych do zrobienia.

SKU format: `S1-T3D-SD2NA-B8C-OP62A-SK15-AT1-N5A-P1-J1-W1-PF`

Key admin paths:
- `src/pages/AdminPanel/spec/specSectionConfigs.ts` — konfiguracja sekcji spec
- `src/pages/AdminPanel/spec/plugins/` — FoamSubTable, SewingVariants, CompatibilityMatrix, PillowMapping

## .claude/ Structure

```
.claude/
  rules/           — Path-scoped rules (Code ładuje automatycznie)
    supabase.md    — Migration rules, RLS patterns
    pdf.md         — jsPDF rules, font handling
    admin.md       — AdminPanel conventions
  skills/          — Procedural skills for repeatable tasks
    sql-migration/ — Jak pisać SQL migrację
    lovable-brief/ — Jak formatować brief do Lovable
```

## Language

Polski (kod i komentarze po angielsku, komunikacja i dokumentacja po polsku).
