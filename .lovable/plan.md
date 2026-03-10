

## Zmiana labelek "Nazwa" na nazwy komponentów

Tak jak przy kodach (np. `side.code` → "Boczek"), pola `.name` powinny też pokazywać nazwę komponentu zamiast generycznego "Nazwa".

### Zmiany w `fieldLabels.ts` i `DisplayFieldsSelector.tsx`

| Klucz | Obecna | Nowa |
|---|---|---|
| `automat.name` | Nazwa | Automat |
| `side.name` | Nazwa | Boczek |
| `chest.name` | Nazwa | Skrzynia |
| `pillow.name` | Nazwa | Poduszka |
| `legs.name` | Nazwa | Noga |

10 zmian stringów (5 w każdym pliku), 2 pliki.

