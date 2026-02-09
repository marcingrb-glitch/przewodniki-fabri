
## Naprawa breadcrumbs - strona 404

### Problem
Na stronie np. `/order/abc123` breadcrumbs generuja posredni link `/order`, ktory nie istnieje jako trasa w aplikacji. Klikniecie w niego prowadzi do strony 404.

Analogicznie, na stronach admina np. `/admin/fabrics` klikniecie w "Panel Admin" prowadzi do `/admin` co jest poprawne (jest redirect), ale `/order` nie ma takiego zabezpieczenia.

### Rozwiazanie
Zmodyfikowac `src/components/Breadcrumbs.tsx` aby posrednie segmenty, ktore nie odpowiadaja samodzielnym trasom, nie byly klikalne.

Konkretne zmiany:

1. **Dodac liste tras, ktore nie sa klikalne** - segmenty takie jak `order` nie powinny byc linkami, bo `/order` bez `:id` nie istnieje
2. **Zmienic logike generowania crumbs** - jesli segment jest w liscie "niekliikalnych", nie nadawac mu `path`

### Szczegoly techniczne

**Plik: `src/components/Breadcrumbs.tsx`**

- Dodac zestaw segmentow, ktore nie sa samodzielnymi trasami:
  ```typescript
  const nonNavigableSegments = new Set(["order"]);
  ```
- W petli `forEach` zmienic warunek nadawania `path`:
  ```typescript
  const isLast = i === segments.length - 1;
  const isNonNavigable = nonNavigableSegments.has(seg);
  crumbs.push({ label, path: (isLast || isNonNavigable) ? undefined : currentPath });
  ```

Dzieki temu "Zamowienie" w breadcrumbs bedzie widoczne ale nie jako link - uzytkownik nie bedzie mogl w nie kliknac i trafic na 404.
