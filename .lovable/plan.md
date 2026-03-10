

## Globalne ustawienia etykiet: lewa strefa + nagłówek

### Problem
Lewa strefa (kod serii, nazwa, kolekcja) i nagłówek (`"SOFA | Zam: 12345"`) sa zahardkodowane. Nie da sie wybrac co tam jest ani zmienic czcionek.

### Rozwiazanie
Nowa tabela `label_settings` (singleton, 1 wiersz) + panel ustawien w adminie nad tabela szablonow.

### Tabela `label_settings`

| Kolumna | Typ | Default | Opis |
|---|---|---|---|
| `left_zone_fields` | jsonb | `["series.code","series.name","series.collection"]` | Kolejnosc elementow w lewej strefie |
| `header_template` | text | `{TYPE} \| Zam: {ORDER}` | Wzorzec naglowka |
| `left_zone_width` | numeric | 16 | Szerokosc strefy w mm |
| `series_code_size` | numeric | 18 | Czcionka kodu serii |
| `series_name_size` | numeric | 9 | Czcionka nazwy |
| `series_collection_size` | numeric | 7 | Czcionka kolekcji |
| `content_max_size` | numeric | 14 | Max czcionka tresci |
| `content_min_size` | numeric | 7 | Min czcionka tresci |

Dostepne pola lewej strefy do wyboru:
- `series.code` — Kod serii (np. S1)
- `series.name` — Nazwa serii (np. Sofa Mar)  
- `series.collection` — Kolekcja (np. Vienne)
- `product_type` — Typ produktu (SOFA/PUFA/FOTEL)
- `order_number` — Numer zamowienia

### Nowy plik: `LabelSettings.tsx`
Zwijana sekcja "⚙️ Ustawienia globalne" nad tabela szablonow:
- Checkboxy + sortowanie pol lewej strefy (drag lub strzalki gora/dol)
- Pole tekstowe na wzorzec naglowka z podpowiedzia `{TYPE}`, `{ORDER}`
- Suwaki/inputy numeryczne na rozmiary czcionek
- Mini podglad etykiety aktualizowany na zywo

### Zmiany w istniejacych plikach

**`pdfHelpers.ts`** — `addLabel()` przyjmie obiekt settings:
```ts
interface LabelSettings {
  leftZoneWidth: number;
  leftZoneFields: string[];
  headerTemplate: string;
  seriesCodeSize: number;
  seriesNameSize: number;
  seriesCollectionSize: number;
  contentMaxSize: number;
  contentMinSize: number;
}
```
Zamiast hardkodowanych wartosci, uzyje przekazanych ustawien. Backward compatible — bez settings dziala jak teraz.

**`labels.ts`** — `generateLabelsPDF()` pobierze ustawienia z `label_settings` i przekaze do `addLabel()`. Naglowek budowany z `header_template` (zamiana `{TYPE}` i `{ORDER}`).

**`LabelConfigurator.tsx`** — podglad HTML odczyta te same ustawienia i wyswietli odpowiednie pola w lewej strefie.

**`LabelTemplates.tsx`** — doda `<LabelSettings>` jako Collapsible nad tabela.

### Migracja SQL
```sql
CREATE TABLE label_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  left_zone_fields jsonb DEFAULT '["series.code","series.name","series.collection"]',
  header_template text DEFAULT '{TYPE} | Zam: {ORDER}',
  left_zone_width numeric DEFAULT 16,
  series_code_size numeric DEFAULT 18,
  series_name_size numeric DEFAULT 9,
  series_collection_size numeric DEFAULT 7,
  content_max_size numeric DEFAULT 14,
  content_min_size numeric DEFAULT 7,
  updated_at timestamptz DEFAULT now()
);
INSERT INTO label_settings DEFAULT VALUES;
-- RLS: read for authenticated, write for admins
```

