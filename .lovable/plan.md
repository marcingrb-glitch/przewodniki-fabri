

## Selektor pól w sekcjach przewodnika — styl jak etykiety

### Obecny stan

Panel `GuideTemplates` wymaga ręcznego dodawania kolumn jedna po drugiej (nagłówek + Select z polem). Etykiety używają `DisplayFieldsSelector` z checkboxami pogrupowanymi po komponentach — znacznie wygodniej.

### Plan

Zastąpić obecny edytor kolumn w dialogu sekcji selektorem checkboxowym analogicznym do `DisplayFieldsSelector`, z następującą logiką:

1. **Selektor pól z checkboxami** — pogrupowane po komponentach (Siedzisko, Oparcie, Boczek, Skrzynia, Nóżki, Poduszka, Jaśki, Wałek, Pufa, Fotel, Dodatki). Zaznaczenie pola = dodanie kolumny z domyślnym nagłówkiem.

2. **Lista wybranych kolumn** — pod selektorem, z możliwością:
   - Zmiany nagłówka (Input)
   - Zmiany kolejności (strzałki góra/dół)
   - Usunięcia (Trash)

3. **Przepływ**: zaznacz pole w selektorze → pojawia się na liście z domyślnym nagłówkiem z `AVAILABLE_FIELDS.label` → admin może zmienić nagłówek → kolejność drag/strzałkami.

### Zmiany

**`src/pages/AdminPanel/GuideTemplates.tsx`**:
- Pogrupować `AVAILABLE_FIELDS` po prefixie (seat, backrest, side, chest, legs, pillow, jaski, walek, pufa, fotel, extras)
- Zamienić sekcję "Kolumny tabeli" na Popover z checkboxami (wzorzec z `DisplayFieldsSelector`) + lista wybranych pól z edycją nagłówka
- Zaznaczenie checkboxa dodaje kolumnę `{ header: defaultLabel, field: value }`, odznaczenie usuwa

### Pliki

- `src/pages/AdminPanel/GuideTemplates.tsx` — jedyna zmiana

