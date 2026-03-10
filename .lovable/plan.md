

## Wizualny konfigurator przewodnika PDF

### Cel

Dodanie podgladu na zywo (mockup strony A4) w panelu `/admin/guide-templates`, ktory pokazuje jak bedzie wygladal wygenerowany przewodnik PDF — analogicznie do podgladu etykiet w `LabelConfigurator`.

### Jak to bedzie dzialac

Pod tabela sekcji (lub obok niej) pojawi sie karta "Podglad przewodnika" renderujaca miniature strony A4 z:
- Naglowkiem (numer zamowienia, seria, data) — tak jak w prawdziwym PDF
- Kolejnymi sekcjami jako mini-tabelkami z naglowkami kolumn i przykladowym wierszem danych
- Sekcje warunkowe oznaczone wizualnie (np. przerywanym obramowaniem + etykieta "warunkowa")
- Sekcje wylaczone (enabled=false) ukryte

Dane przykladowe beda pobierane z bazy (pierwszy rekord z kazdej tabeli komponentow) — identycznie jak w `LabelConfigurator` (`useExampleData`). Pola bedzie resolvowal uproszczony mapper z `AVAILABLE_FIELDS` + przykladowe wartosci.

### Szczegoly techniczne

**Nowy komponent: `src/pages/AdminPanel/GuidePreview.tsx`**
- Props: `sections: GuideSection[]` (przefiltrowane po aktywnej zakladce)
- Wewnatrz: `useExampleData()` (ten sam hook lub zblizony) do pobrania przykladowych wartosci
- Mapowanie pol: `resolveExampleValue(field: string, exampleData): string` — uproszczona wersja `resolveField` z guideGenerator, ale operujaca na surowych danych z bazy zamiast DecodedSKU
- Renderowanie: skalowana strona A4 (proporcje 210:297) w kontenerze np. 500px szerokosci

```text
+---------------------------------------+
| NUMER ZAMÓWIENIA: 12345    [S1 - ...]  |
| Data złożenia zamówienia: 2026-03-10   |
| SKU: EXAMPLE-SKU                       |
|                                        |
| +-----------------------------------+ |
| | Siedzisko | Stelaż | Pianka       | |  <-- sekcja 1
| | S01 (A)   | drewno | T25 40x...   | |
| +-----------------------------------+ |
|                                        |
| +-----------------------------------+ |
| | Oparcie   | Stelaż | Góra         | |  <-- sekcja 2
| | O01A (B)  | metal  | zaokr.       | |
| +-----------------------------------+ |
|                                        |
| +- - - - - - - - - - - - - - - - - + |
| | [warunkowa] Poduszka | Wyk.       | |  <-- sekcja warunkowa
| | PD01       | A (Zwykły)           | |
| +- - - - - - - - - - - - - - - - - + |
+---------------------------------------+
```

### Integracja w GuideTemplates.tsx

- Pod `<Tabs>` dodac `<GuidePreview sections={filtered} />`
- Podglad aktualizuje sie automatycznie przy zmianie zakladki i po zapisie sekcji
- Mozna tez podswietlic sekcje ktora jest aktualnie edytowana

### Pliki

- **Nowy**: `src/pages/AdminPanel/GuidePreview.tsx`
- **Edycja**: `src/pages/AdminPanel/GuideTemplates.tsx` — import + dodanie `<GuidePreview />`

