

## Skrócenie labelek nóg

Usunąć kontekst w nawiasach — szablony etykiet i tak są osobne per komponent.

### Zmiany w `fieldLabels.ts` i `DisplayFieldsSelector.tsx`

| Klucz | Obecna | Nowa |
|---|---|---|
| `legHeights.sofa_chest.leg` | Typ nogi (skrzynia) | Noga |
| `legHeights.sofa_chest.height` | Wysokość nogi (skrzynia) | H |
| `legHeights.sofa_chest.count` | Ilość nóg (skrzynia) | Ilość |
| `legHeights.sofa_seat.leg` | Typ nogi (siedzisko) | Noga |
| `legHeights.sofa_seat.height` | Wysokość nogi (siedzisko) | H |
| `legHeights.sofa_seat.count` | Ilość nóg (siedzisko) | Ilość |
| `pufaLegs.height` | Wysokość nogi (pufa) | H |
| `pufaLegs.count` | Ilość nóg (pufa) | Ilość |
| `fotelLegs.height` | Wysokość nogi (fotel) | H |
| `fotelLegs.count` | Ilość nóg (fotel) | Ilość |

### Formatowanie wysokości w `labels.ts` → `resolveField`

Gdy ścieżka kończy się na `.height` i wartość jest liczbą → zwracać `{value} cm`. Efekt na etykiecie: `H: 12 cm`.

3 pliki, ~15 zmian stringów + 3 linie logiki.

