

## Plan: Nowa zakładka "Etykiety" w panelu admina — konfiguracja szablonów etykiet

### Obecny stan — co jest na etykietach (hardcoded w `labels.ts`)

**SOFA** (6-7 etykiet):
1. Siedzisko + Automat (kod siedziska, kod automatu)
2. Oparcie (kod + wykończenie)
3. Boczek x2 (kod + wykończenie)
4. Skrzynia + Automat (kod skrzyni, kod automatu)
5. Noga skrzynia (typ nogi, wysokość, ilość)
6. Noga siedzisko (opcjonalnie — typ, wysokość, ilość)

**PUFA** (2-3 etykiet):
1. Siedzisko + Pianka (kod siedziska, pianka z seats_pufa)
2. Skrzynka (box z seats_pufa)
3. Noga (opcjonalnie — kod, wysokość, ilość)

**FOTEL** (2-3 etykiet):
1. Siedzisko (kod)
2. Boczek (kod + wykończenie)
3. Noga (opcjonalnie — kod, wysokość, ilość)

Każda etykieta zawiera nagłówek: seria (kod/nazwa/kolekcja) + typ produktu + numer zamówienia.

---

### Co zbudować

Nowa strona `/admin/label-templates` z linkiem "Etykiety" w sidebarze (sekcja "Konfiguracja SKU" dla adminów).

**Widok strony**: Tabela z szablonami etykiet pogrupowana po typie produktu (SOFA / PUFA / FOTEL), z kolumnami:

| Typ produktu | Nazwa etykiety | Komponent | Dane na etykiecie | Ilość sztuk | Kolejność |
|---|---|---|---|---|---|
| SOFA | Siedzisko | seat | `{seat.code}`, `Automat: {automat.code}` | 1 | 1 |
| SOFA | Oparcie | backrest | `{backrest.code}{backrest.finish}` | 1 | 2 |
| SOFA | Boczek | side | `{side.code}{side.finish}` | 2 | 3 |
| ... | ... | ... | ... | ... | ... |

**Funkcjonalność**:
- Wyświetlenie aktualnych szablonów (seed z obecnych hardcode'ów)
- Edycja inline: zmiana nazwy, danych wyświetlanych, ilości sztuk, kolejności
- Dodawanie / usuwanie etykiet
- Filtr po typie produktu (SOFA / PUFA / FOTEL)

### Kroki implementacji

**Krok 1: Migracja — tabela `label_templates`**

```sql
CREATE TABLE public.label_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_type text NOT NULL, -- 'sofa', 'pufa', 'fotel'
  label_name text NOT NULL,   -- np. 'Siedzisko', 'Oparcie'
  component text NOT NULL,    -- np. 'seat', 'backrest', 'side', 'chest', 'leg_chest', 'leg_seat'
  content_template text NOT NULL, -- szablon treści, np. 'Siedzisko: {seat.code}'
  quantity integer NOT NULL DEFAULT 1,
  sort_order integer NOT NULL DEFAULT 0,
  is_conditional boolean NOT NULL DEFAULT false, -- czy etykieta pojawia się warunkowo
  condition_field text, -- np. 'legHeights.sofa_seat' — jeśli null/brak, nie drukuj
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.label_templates ENABLE ROW LEVEL SECURITY;
-- RLS: admins CRUD, authenticated SELECT
```

Seed z obecnymi szablonami (insert 12 rekordów odpowiadających obecnej logice).

**Krok 2: Strona `LabelTemplates.tsx`**

- Fetch z `label_templates` zamówione po `product_type`, `sort_order`
- Tabela z grupowaniem po `product_type`
- Inline edit na polach: `label_name`, `content_template`, `quantity`, `sort_order`
- Przyciski dodaj/usuń

**Krok 3: Link w sidebarze**

Dodać `{ to: "/admin/label-templates", label: "Etykiety" }` do `skuConfigLinks` w `AdminLayout.tsx`.

**Krok 4: Route w `App.tsx`**

Dodać route `/admin/label-templates` → `LabelTemplates`.

### Co się NIE zmienia (na razie)

Generator PDF (`labels.ts`) dalej używa obecnej logiki. Przejście na dynamiczne szablony z bazy to osobny krok — najpierw trzeba ustalić co dokładnie ma być na każdej etykiecie, a potem podmienić generowanie.

