

## Wizualny konfigurator etykiet pod tabelą

### Koncept

Klikasz wiersz w tabeli etykiet → pod tabelą pojawia się panel konfiguratora z:
1. **Mini podgląd etykiety** (100x30mm skalowany do ~400x120px) — HTML/CSS mockup pokazujący jak etykieta wygląda z przykładowymi danymi
2. **Builder linii** — pola podzielone na linie (linia 1, linia 2...), każda linia ma swój selektor pól + możliwość dodania/usunięcia linii

### Obecna struktura etykiety (100x30mm)

```text
┌──────┬────────────────────────────────────────┐
│  S1  │    SOFA | Zam: 12345                   │
│ Sofa │    Siedzisko: S1-01 HR35/T25           │
│[Vie] │                                         │
└──────┴────────────────────────────────────────┘
 16mm              84mm
 (auto)          (konfigurowalny)
```

- **Lewa strefa** (16mm, obrócona) — zawsze automatyczna: kod serii, nazwa, kolekcja
- **Linia 1** — zawsze automatyczna: `"SOFA | Zam: 12345"`
- **Linia 2+** — konfigurowalny z `display_fields`: `"Siedzisko: KOD PIANKA"`

### Zmiany w strukturze danych

`display_fields` zmieni format z `string[]` na `string[][]` (tablica tablic):
```json
// Stare: ["seat.code", "seat.foamsList"]
// Nowe: [["seat.code", "seat.foamsList"], ["seat.finish", "seat.finishName"]]
```
Każda pod-tablica = osobna linia na etykiecie. Backward compatible — jeśli to flat array, traktujemy jak jedną linię.

### Nowe pliki

**`src/pages/AdminPanel/labels/LabelConfigurator.tsx`** — główny panel konfiguratora:
- Przyjmuje wybraną `LabelTemplate` + callbacks do zapisu
- Sekcja "Podgląd" — mini HTML etykieta z przykładowymi danymi
- Sekcja "Linie" — lista linii, każda z `DisplayFieldsSelector`
- Przycisk "+ Dodaj linię" / "Usuń linię"
- Automatyczne linie (seria, zamówienie) pokazane jako nieedytowalne

### Zmiany w istniejących plikach

**`src/pages/AdminPanel/LabelTemplates.tsx`**:
- Dodać state `selectedTemplateId`
- Kliknięcie wiersza ustawia `selectedTemplateId`
- Pod tabelą renderować `<LabelConfigurator>` gdy jest zaznaczony szablon
- Przenieść edycję `display_fields` z kolumny tabeli do konfiguratora (w tabeli zostaje tylko badge z liczbą pól)

**`src/pages/AdminPanel/labels/DisplayFieldsSelector.tsx`**:
- Wyeksportować `COMPONENT_FIELDS` żeby konfigurator mógł go użyć
- Komponent nadal używany wewnątrz konfiguratora per linia

**`src/utils/pdfGenerators/labels.ts`**:
- `buildLabelLines` — obsługa `string[][]`: każda pod-tablica generuje osobną linię z prefixem `label_name` tylko na pierwszej
- Backward compatible: flat `string[]` → traktuj jako `[fields]`

### Wygląd konfiguratora

```text
╔══════════════════════════════════════════════════════════╗
║  Konfigurator: "Siedzisko"                    [✕ Zamknij]║
╠══════════════════════════════════════════════════════════╣
║                                                          ║
║  PODGLĄD (100x30mm)                                      ║
║  ┌──────┬──────────────────────────────────┐             ║
║  │  S1  │  SOFA | Zam: 12345              │             ║
║  │ Sofa │  Siedzisko: S1-01 HR35/T25      │             ║
║  │[Vie] │  Wykończenie: Matowy             │             ║
║  └──────┴──────────────────────────────────┘             ║
║                                                          ║
║  LINIE TREŚCI                                            ║
║  ── Nagłówek (auto): "SOFA | Zam: {nr}"                 ║
║  ── Linia 1: [Kod siedziska ×] [Pianki siedziska ×] [+] ║
║  ── Linia 2: [Wykończenie (nazwa) ×]              [+ 🗑] ║
║                                            [+ Dodaj linię]║
╚══════════════════════════════════════════════════════════╝
```

### Schemat zmian

1. Wyeksportować `COMPONENT_FIELDS` z `DisplayFieldsSelector.tsx`
2. Utworzyć `LabelConfigurator.tsx` z podglądem HTML + line builder
3. Zmodyfikować `LabelTemplates.tsx` — selekcja wiersza + render konfiguratora pod tabelą
4. Zaktualizować `buildLabelLines` w `labels.ts` — obsługa `string[][]`

Brak zmian w schemacie DB — `display_fields` to `jsonb`, więc obsłuży nested arrays bez migracji.

