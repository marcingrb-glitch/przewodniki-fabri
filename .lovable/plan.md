

## Ujednolicenie nazewnictwa: Rama → Stelaż + skrócenie nazw kontekstowych

### Zasada
Skoro pole jest przypisane do komponentu (siedzisko/boczek/oparcie), na etykiecie wystarczy sama nazwa cechy bez powtarzania komponentu. Nazewnictwo musi być spójne ze specyfikacją.

### Zmiany w `src/utils/fieldLabels.ts`

| Klucz | Obecna wartość | Nowa wartość |
|---|---|---|
| `seat.frame` | Rama siedziska | Stelaż |
| `side.frame` | Rama boczka | Stelaż |
| `backrest.frame` | Rama oparcia | Stelaż |
| `seat.type` | Typ siedziska | Typ |
| `seat.foamsList` | Pianki siedziska | Pianki |
| `seat.front` | Front siedziska | Front |
| `seat.midStrip` | Środkowy pasek | Środkowy pasek |
| `side.name` | Nazwa boczka | Nazwa |
| `backrest.height` | Wysokość oparcia | Wysokość |
| `backrest.foamsList` | Pianki oparcia | Pianki |
| `backrest.top` | Góra oparcia | Góra |
| `automat.name` | Nazwa automatu | Nazwa |
| `automat.type` | Typ automatu | Typ |
| `chest.name` | Nazwa skrzyni | Nazwa |
| `chest.legHeight` | Wys. nóżki skrzyni | Wys. nóżki |
| `chest.legCount` | Ilość nóżek skrzyni | Ilość nóżek |
| `pillow.name` | Nazwa poduszki | Nazwa |
| `pillow.finish` | Wykończenie poduszki (kod) | Wykończenie (kod) |
| `pillow.finishName` | Wykończenie poduszki (nazwa) | Wykończenie (nazwa) |
| `pufaSeat.frontBack` | Przód/Tył pufy | Przód/Tył |
| `pufaSeat.sides` | Boki pufy | Boki |
| `pufaSeat.foam` | Pianka pufy | Pianka |
| `pufaSeat.box` | Skrzynka pufy | Skrzynka |
| `legs.name` | Nazwa nogi | Nazwa |
| `legs.material` | Materiał nogi | Materiał |
| `legs.color` | Kolor nogi (kod) | Kolor (kod) |
| `legs.colorName` | Kolor nogi (nazwa) | Kolor (nazwa) |

Pola z kontekstem w nawiasie (np. "Noga (pufa)", "Typ nogi (skrzynia)") — **zostawiamy** bo te rozróżnienia są potrzebne gdy nogi różnych typów mogą pojawić się na tej samej etykiecie.

### Zmiany w `src/pages/AdminPanel/labels/DisplayFieldsSelector.tsx`

Analogiczne skrócenie labelek w `COMPONENT_FIELDS` — te same nazwy co wyżej, żeby selektor pól w panelu admina był spójny.

### Zakres
~27 zmian stringów w fieldLabels.ts + ~27 w DisplayFieldsSelector.tsx, 2 pliki.

