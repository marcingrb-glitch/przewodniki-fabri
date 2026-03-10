

## Plan: Dodaj pianki do oparcia OP68 (Ravenna / Barga, sprężyna 54A) w S2

Na podstawie screenshota — 3 rekordy pianek do dodania do backrest_id `1608086a-0b5e-4c09-a77e-1775478ce845`:

| Poz. | Nazwa | Wys. | Szer. | Dł. | Materiał | Ilość |
|------|-------|------|-------|-----|----------|-------|
| 5 | OPARCIE 6x68x191 | 6 | 68 | 191 | T-35-38 | 1 |
| 6 | OPARCIE 3x69x192 | 3 | 69 | 192 | T-35-38 | 1 |
| 7 | OPARCIE CZAPA 3D 2x64x187 | 2 | 64 | 187 | T-35-38 | 1 |

### Realizacja

Jedna migracja SQL — INSERT 3 rekordów do `product_foams` z:
- `series_id` = ID serii S2
- `seat_code` = `'OP68'`
- `component` = `'oparcie'`
- `backrest_id` = `'1608086a-0b5e-4c09-a77e-1775478ce845'`

Bez zmian w kodzie — dane pojawią się automatycznie w karcie OP68 Ravenna/Barga.

