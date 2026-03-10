

## Nagłówek etykiety: `{TYPE} | {LABEL} | {ORDER}`

Użytkownik chce, żeby nagłówek etykiety wyglądał np.: **SOFA | Siedzisko | 12345** — typ pierwszy, potem nazwa szablonu, potem sam numer zamówienia (bez "Zam:").

### Zmiany w `src/utils/pdfGenerators/labels.ts`

1. **`buildLabelLines`** — dodać `.replace("{LABEL}", tpl.label_name)` do linii generującej header (linia ~146-148)
2. **Domyślny `headerTemplate`** w `fetchLabelSettings` (linia ~113) — zmienić z `"{TYPE} | Zam: {ORDER}"` na `"{TYPE} | {LABEL} | {ORDER}"`
3. **Fallback header** (~linia 184) — analogicznie dodać `.replace("{LABEL}", ...)` z pustym stringiem

### Zmiany w `src/pages/AdminPanel/labels/LabelSettings.tsx`

4. **Opis dostępnych zmiennych** — dodać `{LABEL}` do opisu pod polem wzorca nagłówka
5. **Preview** — dodać `.replace("{LABEL}", "Siedzisko")` do podglądu

### Efekt

Na etykiecie nóżek skrzyni: **SOFA | Noga skrzynia | 12345**
Na etykiecie siedziska: **SOFA | Siedzisko | 12345**

2 pliki, ~6 zmian.

