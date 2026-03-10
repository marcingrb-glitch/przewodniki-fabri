

## Użycie pełnych nazw pól zamiast skróconych + usunięcie prefiksu `label_name`

### Problem
Linia etykiety wygląda: `Siedzisko: Kod: SD02ND | Sprężyna: 66B` — redundancja ("Siedzisko" + "Kod"). Skrócone nazwy jak "Kod" bez kontekstu są niejasne.

### Rozwiązanie
1. **Usunąć prefix `label_name`** z pierwszej linii (w obu: preview i PDF)
2. **Zamienić `SHORT_FIELD_LABELS`** na pełne nazwy z `COMPONENT_FIELDS` (np. `"seat.code"` → `"Kod siedziska"`, `"seat.springType"` → `"Sprężyna siedziska"`)

Wynik: `Kod siedziska: SD02ND | Sprężyna siedziska: 66B`

### Zmiany

**`src/utils/fieldLabels.ts`**:
- Zmienić wartości w `SHORT_FIELD_LABELS` na pełne nazwy z `COMPONENT_FIELDS`, np.:
  - `"seat.code": "Kod"` → `"seat.code": "Kod siedziska"`
  - `"seat.springType": "Sprężyna"` → `"seat.springType": "Sprężyna siedziska"`
  - `"backrest.code": "Kod"` → `"backrest.code": "Kod oparcia"`
  - itd. dla wszystkich pól

**`src/pages/AdminPanel/labels/LabelConfigurator.tsx`** (~linia 193):
- Usunąć `const prefix = i === 0 ? \`${template.label_name}: \` : ""`
- Linie bez prefixu

**`src/utils/pdfGenerators/labels.ts`** (~linia 165):
- Analogicznie usunąć prefix `label_name` z pierwszej linii

3 pliki, proste zmiany.

