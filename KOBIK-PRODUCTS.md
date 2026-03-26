# Kobik — Katalog produktów

*Wersja 1.1 • 16 marca 2026*

---

## 1. Serie

| Kod | Nazwa sofy | Kolekcja | Oparcia | Skrzynie | Automaty | Nóżki | Pufa/Fotel |
|-----|-----------|----------|---------|----------|----------|-------|------------|
| S1 | Sofa Mar | Viena | OP62, OP68 | SK15, SK17, SK23 | AT1, AT2 | N1–N5 | PF, PFO, FT |
| S2 | Sofa Elma | Modena | OP68 (3 warianty) | SK23 tylko | AT1 tylko | N4 tylko | brak (planowane PF) |

---

## 2. Tkaniny (globalne, 13 szt.)

| Kod | Nazwa | Grupa cenowa | Kolory |
|-----|-------|-------------|--------|
| T1 | Guilty | 1 | A=Sand, B=Cement, C=Pearl |
| T2 | Portland | 1 | A=Cream, B=Ash, C=Moss, D=Taupe, E=Rust |
| T3 | Cloud | 1 | A=3, B=39, C=79, D=83, E=91 |
| T4 | Tribue | 2 | A=Ivory, B=Fog, C=Green, D=Pearl, E=Toffee |
| T5 | Brooklyn | 2 | A=Pearl, B=Beige, C=Mud, D=Fog, E=Cement |
| T6 | Bronx | 2 | A=Camel, B=Beige, C=Light Grey, D=Taupe, E=Ocean |
| T7 | Casino | 2 | A=Sand, B=Deep Green, C=Fog, D=Pearl, E=Terracotta |
| T8 | Seattle | 3 | A=Sand, B=Toffee, C=Cream, D=Camel, E=Light Grey |
| T9 | Macau | 3 | A=Sand, B=Gold, C=Ash, D=Pearl, E=Forrest |
| T10 | Puente | 1 | A=06, B=3, C=80, D=92, E=37 |
| T11 | Legend Natural - Ascot | 3 | A=Pearl, B=Cream/Nata, C=Taupe/Toffee, D=Deep Terra/Brick, E=Grey/Taupe |
| T12 | Bliss | 3 | A=Cream, B=Sand, C=Fog, D=Khaki, E=Stone |
| T13 | Zoom 1 | 1 | A=Cream, B=Mink, C=Toffee, D=Winter Moss, E=Dove, F=Ash |

---

## 3. Wykończenia (globalne, 4 szt.)

| Kod | Nazwa | Opis |
|-----|-------|------|
| A | Stebnówka | Szew ozdobny na wierzchu |
| B | Szczypanka | Szew ściskający tkaninę |
| C | Dwuigłówka | Podwójny szew |
| D | Zwykły | Szew standardowy, bez ozdoby |

---

## 4. Nóżki (globalne, 5 szt.)

| Kod | Nazwa | Materiał | Kolory |
|-----|-------|----------|--------|
| N1 | Stożek prosty | Drewniany | A=Buk, B=Brązowa, C=Czarna |
| N2 | Stożek skos | Drewniany | A=Buk, B=Brązowa, C=Czarna |
| N3 | Walec | Drewniany | A=Buk, B=Brązowa, C=Czarna |
| N4 | Plastikowa | Plastik | (brak kolorów) |
| N5 | Szpilka | Metalowa | A=Czarna, B=Złota |

Kompletacja: N1, N2, N3, N5 — dziewczyny od nóżek (do worka). N4 — tapicer montuje na stanowisku.

---

## 5. Skrzynie (globalne, 3 szt.)

| Kod | Nazwa | Wys. nóżek | Ilość nóżek |
|-----|-------|-----------|-------------|
| SK15 | SK15 - 190 | 10 cm | 4 |
| SK17 | SK17 - 190 | 8 cm | 4 |
| SK23 | SK23 - 190 | 2.5 cm | 4 |

**SK23 override:** nóżki skrzyni = zawsze N4 (plastikowa), niezależnie od nóżki w SKU.

---

## 6. Automaty (globalne, 2 szt.)

| Kod | Nazwa | Typ | Nóżki siedziskowe |
|-----|-------|-----|-------------------|
| AT1 | Zwykły | Automat zwykły | TAK |
| AT2 | Wyrzutkowy | Automat z nóżką | NIE |

Konfiguracja nóżek siedziskowych per seria:
- S1 + AT1: 2 szt., wys. 16 cm, model = nóżka z SKU
- S2 + AT1: 2 szt., wys. 2.5 cm, model = nóżka z SKU (= N4)
- AT2: brak nóżek siedziskowych

### Śruby zamkowe w stelażu (widok od tyłu ramy)

| Seria | Automat | Otwory w ramie | Śruby w pozycjach |
|-------|---------|---------------|-------------------|
| S1 | AT1 (zwykły) | 3 | 1 i 2 |
| S1 | AT2 (wyrzutkowy) | 3 | 1 i 3 |
| S2 | AT1 (zwykły) | 2 | 1 i 2 |

---

## 7. Poduszki oparciowe (globalne, 3 szt.)

| Kod | Nazwa | Dostępność |
|-----|-------|------------|
| P1 (P01) | Poduszka kwadratowa | S1, S2 |
| P2 (P02) | Poduszka zaokrąglona | S1, S2 |
| P3 (P03) | Poduszka (typ 3) | S2 |

**Wykończenie poduszek = determinowane przez siedzisko** (nie wolny wybór).

### Seat → pillow mapping S1

| Siedzisko | Poduszka | Wyjątek |
|-----------|----------|---------|
| SD01N | P1 | + B9 (Styl) → P2 |
| SD01ND | P1 | + B9 (Styl) → P2 |
| SD01W | P1 | + B9 (Styl) → P2 |
| SD02N | P2 | — |
| SD02ND | P2 | — |
| SD02W | P2 | — |
| SD03 | P1 | — |
| SD04 | P1 | — |

### Wykończenie poduszek S1

| Siedzisko | Wykoń. siedziska | Wykoń. poduszki |
|-----------|-----------------|-----------------|
| SD01N/ND/W | A | A |
| SD02N | A | C |
| SD02N | B | B |
| SD02ND | A | C |
| SD02W | A | C |
| SD03 | A | A |
| SD03 | B | B |
| SD04 | D | D |

### Seat → pillow mapping S2

| Siedzisko | Model | Poduszka | Wykończenie |
|-----------|-------|----------|-------------|
| SD1 | Modena | P02 | C |
| SD2 | Ravenna | P03 | A |
| SD3 | Sienna | P02 | C |
| SD4 | Porto | P01 | A, B |
| SD5 | Barga | P03 | A |

Poduszka wymuszana per model + obecna w SKU.

---

## 8. Jaśki (globalne, 3 szt.)

| Kod | Nazwa | Dostępność |
|-----|-------|------------|
| J1 | Jasiek kwadratowy | S1, S2 |
| J2 | Jasiek zaokrąglony | S1, S2 |
| J3 | Jasiek okrągły | tylko S2, opcjonalny, tylko z boczkiem B4 (Sola/Sienna) |

**Wykończenie jaśków = takie samo jak poduszka oparciowa.**

Uwaga: J1 szyty inaczej zależnie od siedziska (kształt ten sam — kwadratowy, ale szew zależy od wykończenia dziedziczonego z siedziska). Np. SD01→A (Stebnówka), SD04→D (Zwykły).

---

## 9. Wałki (globalne, 1 szt.)

| Kod | Nazwa | Dostępność |
|-----|-------|------------|
| W1 | Wałek | S1, S2 |

**Wykończenie wałków = takie samo jak poduszka oparciowa.**

---

## 10. Extras (per seria)

| Kod | Nazwa | Typ | S1 | S2 |
|-----|-------|-----|----|----|
| PF | Pufa normalna | pufa | ✅ | ❌ (planowane) |
| PFO | Pufa otwierana | pufa | ✅ | ❌ |
| FT | Fotel | fotel | ✅ | ❌ |

---

## 11. Siedziska S1 (8 kodów, zero-padded)

Stelaż: S1-SD-190 [Viena] (identyczny dla wszystkich)
Model: Viena (wszystkie)
Pianka bazowa: 78 × 190 × 9 VPPT 30-40 [Viena] (identyczna dla wszystkich)

| Kod | Typ | Front | Pasek środ. | Wykończenia | Domyślne |
|-----|-----|-------|-------------|-------------|----------|
| SD01N | Niskie | VP30 17×190×2 [Viena] | NIE | A | A |
| SD01ND | Niskie dzielone | VP30 17×190×2 [Viena] | TAK | A | A |
| SD01W | Wysokie | VP30 23×190×2 | NIE | A | A |
| SD02N | Niskie | Półwałek SD02N | NIE | A, B | A |
| SD02ND | Niskie dzielone | Półwałek SD02N | TAK | A | A |
| SD02W | Wysokie | Półwałek SD02W | NIE | A | A |
| SD03 | (standardowe) | VP30 17×190×2 [Viena] | NIE | A, B | A |
| SD04 | (standardowe) | Półwałek SD04 | NIE | D | D |

**Wyjątek montażowy:** SD01N + boczek B9 (Styl/Viena) → dodatkowa listwa z płyty dokręcana przez tapicera + poduszka zmiana P1→P2. Z innymi boczkami — normalna wersja.

### Kompatybilność boczków S1
Wszystkie boczki pasują do wszystkich siedzisk. Brak ograniczeń.

---

## 12. Siedziska S2 (9 kodów, BEZ zero-paddingu)

Stelaż: S2-SD-190 [Elma] (jedna rama, różne fronty per model)

| Kod | Nazwa handlowa | Model (stelaż) | Front | Sprężyna | Wykończenia | Domyślne |
|-----|---------------|----------------|-------|----------|-------------|----------|
| SD1 | Luma | Modena | 2× ćwierćwałek drewniany, przerwa 1.5cm | B | D | D |
| SD2 | Nova | Ravenna | 2× ćwierćwałek drewniany, przerwa 1.5cm | B | A | A |
| SD2D | Nova (dzielone) | Ravenna | 2× ćwierćwałek drewniany, przerwa 1.5cm | B | A | A |
| SD3 | Sola | Sienna | 2× ćwierćwałek drewniany, przerwa 1.5cm | B | A | A |
| SD3D | Sola (dzielone) | Sienna | 2× ćwierćwałek drewniany, przerwa 1.5cm | B | A | A |
| SD4 | Nora | Porto | 2× listewka drewniana 1.5×2cm | B | A, B | A |
| SD4D | Nora (dzielone) | Porto | 2× listewka drewniana 1.5×2cm | B | A, B | A |
| SD5 | Vero | Barga | 2× listewka 2×2.5cm, przerwa 1.5cm | A | A | A |
| SD5D | Vero (dzielone) | Barga | 2× listewka 2×2.5cm, przerwa 1.5cm | A | A | A |

**Uwaga:** Modena (SD1) nie ma wersji dzielonej.

### Pianki siedzisk S2

#### Grupa A: Modena (SD1) + Ravenna (SD2, SD2D)

| Poz | Nazwa | Wymiary (w×sz×dł) | Materiał | Ilość |
|-----|-------|-------------------|----------|-------|
| 1 | Pianka siedziska | 6 × 78.5 × 190 | T-35-38 | 1 |
| 2 | Pianka nakrywkowa | 3 × 118 × 190 | T-35-38 | 1 |
| 3 | Półwałek front | 5 × 34 × 190 | T-21-35 | 1 |
| 4 | Ćwierćwałek boczny | (TBD) | (TBD) | 2 |

Wersja dzielona (SD2D): + pasek środkowy pod wciąg (TBD).

#### Grupa B: Sienna (SD3, SD3D)

| Poz | Nazwa | Wymiary (w×sz×dł) | Materiał | Ilość |
|-----|-------|-------------------|----------|-------|
| 1 | Pianka siedziska | 6 × 78.5 × 190 | T-35-38 | 1 |
| 2 | Pianka nakrywkowa | 3 × 118 × 190 | T-35-38 | 1 |
| 3 | Półwałek front | 5 × 34 × 190 | T-21-35 | 1 |

Jak Grupa A, ale BEZ ćwierćwałków bocznych.
Wersja dzielona (SD3D): + pasek środkowy pod wciąg (TBD).

#### Grupa C: Porto (SD4, SD4D)

| Poz | Nazwa | Wymiary (w×sz×dł) | Materiał | Ilość |
|-----|-------|-------------------|----------|-------|
| 1 | Pianka siedziska | 9 × 80.5 × 190 | T-35-38 | 1 |
| 2 | Półwałek front | 2.5 × 30 × 190 | T-21-35 | 1 |

Wersja dzielona (SD4D): + pasek środkowy pod wciąg (TBD).

#### Grupa D: Barga (SD5, SD5D)

| Poz | Nazwa | Wymiary (w×sz×dł) | Materiał | Ilość |
|-----|-------|-------------------|----------|-------|
| 1 | Pianka siedziska | 6 × 80 × 191 | T-35-38 | 1 |
| 2 | Pianka nakrywkowa | 3 × 84 × 192 | T-35-38 | 1 |
| 3 | Front (pianka) | 3 × 33.5 × 190 | T-21-35 | 1 |
| 4 | Front (pianka) | 2 × 20 × 190 | T-21-35 | 1 |
| 5a | Czapa siedziska 3D (całe SD5) | 2 × 79 × 186.5 | T-35-38 | 1 |
| 5b | Czapa siedziska 3D (dzielone SD5D) | 2 × 79 × 91 | T-35-38 | 2 |

Wersja dzielona (SD5D): + pasek środkowy pod wciąg (TBD).

### Kompatybilność boczek × siedzisko S2

| Boczek \ Siedzisko | Modena (SD1) | Ravenna (SD2) | Sienna (SD3) | Porto (SD4) | Barga (SD5) |
|---------------------|:---:|:---:|:---:|:---:|:---:|
| B1 Luma 9 | ✅ | ✅ | ✅ | ✅ | ✅ |
| B2 Luma 15 | ✅ | ✅ | ✅ | ✅ | ✅ |
| B3 Nova (Ravenna) | ✅ | ✅ | ✅ | ❌ | ✅ |
| B4 Sola (Sienna) | ❌ | ❌ | ✅ | ✅ | ✅ |
| B5 Nora (Porto) | ❌ | ❌ | ✅ | ✅ | ✅ |
| B6 Vero (Barga) | ✅ | ✅ | ✅ | ✅ | ✅ |

---

## 13. Boczki S1 (10 kodów)

| Kod | Nazwa handlowa | Stelaż | Wykończenia |
|-----|---------------|--------|-------------|
| B1 | Manu | B1 [Roland] | A, B |
| B2 | Line | B2 [Arte] | A, B |
| B3 | Latu | B3 [Urano] | A, B |
| B4 | Orve | B4 [Nord] | A, B |
| B5 | Form | B5 [Herford] | A, B |
| B6 | Aera | B6/B8 [Iga\Vamos] | B, C |
| B7 | Lune | B7 [Iga I] | B, C |
| B8 | Arco | B6/B8 [Iga\Vamos] | B, C |
| B9 | Styl | B9 [Viena] | A, B |
| B10 | Aera Cienka | B10 [Iga\Vamos Cienka] | B, C |

### Side exceptions S1 (Shopify → wewnętrzny)
- B6S → B6
- B6W → B10
- B6WD → B6WC (legacy)
- B6D → B6C (legacy)

---

## 14. Boczki S2 (6 kodów)

| Kod | Nazwa handlowa | Stelaż | Wykończenia |
|-----|---------------|--------|-------------|
| B1 | Luma 9 | B1 [Modena 9] | B, C |
| B2 | Luma 15 | B2 [Modena 15] | B, C |
| B3 | Nova | B3 [Ravenna] | A |
| B4 | Sola | B4 [Sienna] | B, C |
| B5 | Nora | B5 [Porto] | A, B |
| B6 | Vero | B6 [Barga] | A, B |

**Uwaga:** Kody B1-B6 w S2 to INNE fizyczne produkty niż B1-B10 w S1. Rozróżniane przez `series_id` w DB.

---

## 15. Oparcia S1 (2 kody, model Viena)

| Kod | Wysokość | Stelaż | Sprężyna | Wykończenia |
|-----|----------|--------|----------|-------------|
| OP62 | 62 cm | S1-OP62-190 | 53B | A, B |
| OP68 | 68 cm | S1-OP68-190 | 57B | A, B |

### Warianty szycia S1 (dotyczy OP62 i OP68)
| Wykończenie | Wariant szycia |
|-------------|---------------|
| A (Stebnówka) | Przewinięte |
| B (Szczypanka) | Bodno na górze |

### Pianki oparć S1
| Oparcie | Nazwa | Wymiary (w×sz×dł) | Materiał | Ilość |
|---------|-------|-------------------|----------|-------|
| OP62 | Pianka oparcia | 9 × 62.5 × 190 | VPPT 30-40 [Viena] | 1 |
| OP68 | Pianka oparcia | 9 × 68 × 190 | VPPT 30-40 [Viena] | 1 |

---

## 16. Oparcia S2 (1 kod OP68, 3 warianty produkcyjne)

| Wariant | Modele siedzisk | Sprężyna | Szycie | Wykończenie |
|---------|----------------|----------|--------|-------------|
| 1 | Modena, Sienna, Porto | B | Przewinięte | A |
| 2 | Ravenna | B | Bodno na górze | A |
| 3 | Barga | 54A | Bodno na górze | A |

### Pianki oparć S2

**Wariant 1 + 2 (sprężyna B — Modena/Sienna/Porto + Ravenna):**

| Poz | Nazwa | Wymiary (w×sz×dł) | Materiał | Ilość |
|-----|-------|-------------------|----------|-------|
| 1 | Pianka oparcia | 9 × 69.5 × 190 | T-35-38 | 1 |

**Wariant 3 (sprężyna 54A — Barga):**

| Poz | Nazwa | Wymiary (w×sz×dł) | Materiał | Ilość |
|-----|-------|-------------------|----------|-------|
| 1 | Pianka oparcia | 6 × 68 × 191 | T-35-38 | 1 |
| 2 | Pianka oparcia nakrywkowa | 3 × 69 × 192 | T-35-38 | 1 |
| 3 | Czapa oparcia 3D | 2 × 64 × 187 | T-35-38 | 1 |

### Backrest model matching
Token-based bidirectional: split model_name po comma/space, match jeśli którykolwiek token seat.model_name matchuje token backrest.model_name.

Przykład: SD4 (model "Porto") → token "porto" matchuje "Modena, Sienna, Porto" → wariant 1.

---

## 17. Pufa S1

Siedziska pufy — dane per kod siedziska sofy:

| Kod | Przód/tył | Boki | Pianka bazy | Wys. skrzynki |
|-----|----------|------|-------------|---------------|
| SD01N | 17 × 63 × 1 | 17 × 63 × 1 | 16 × 62 × 62 | 13 cm |
| SD01ND | 17 × 63 × 1 | 17 × 63 × 1 | 16 × 62 × 62 | 13 cm |
| SD01W | 23 × 63 × 1 | 23 × 63 × 1 | 18 × 62 × 62 | 8 cm |
| SD02N | Półwałek SD02N | 17 × 63 × 1 | 16 × 62 × 62 | 13 cm |
| SD02ND | Półwałek SD02N | 17 × 63 × 1 | 16 × 62 × 62 | 13 cm |
| SD02NB | Półwałek SD02N | Półwałek SD02N | 16 × 62 × 62 | 13 cm |
| SD02W | Półwałek SD02W | 23 × 63 × 1 | 18 × 62 × 62 | 8 cm |
| SD03 | 17 × 63 × 1 | 17 × 63 × 1 | 16 × 62 × 62 | 13 cm |
| SD04 | Półwałek SD04 | Półwałek SD04 | 16 × 62 × 62 | 13 cm |

**SD02NB** — istnieje TYLKO jako siedzisko pufy, nie sofy.

Nóżki pufy: z SKU, ale inna wysokość (z series_config: `pufa_leg_height_cm`).

---

## 18. Fotel S1

Identyczne dane siedziskowe jak pufa, plus boczek + jasiek z SKU.

---

## 19. Format SKU

### Sofa S1
```
S1-T{kod}{kolor}-SD{kod}{wykończenie}-B{kod}{wykończenie}-OP{kod}{wykończenie}-SK{kod}-AT{kod}-N{kod}{kolor}-P{kod}-[J{kod}]-[W{kod}]-[extra...]
```
Przykład: `S1-T3D-SD2NA-B8C-OP62A-SK15-AT1-N5A-P1-J1-W1-PF`

### Sofa S2
```
S2-T{kod}{kolor}-SD{kod}{wykończenie}-B{kod}{wykończenie}-OP{kod}{wykończenie}-SK{kod}-AT{kod}-N{kod}-P{kod}-[J{kod}]-[W{kod}]
```
Przykład: `S2-T13C-SD4B-B5B-OP68A-SK23-AT1-N4-P01-J1-W1`

**Różnice S1 vs S2:**
- S1: zero-padded (SD01N), S2: bez zera (SD1)
- S2: zawsze SK23, AT1, N4
- Poduszka oparciowa obecna w obu (wymuszana per model)
- Jaśki i wałki opcjonalne w obu

### Narożnik N2 (przyszły)
```
N2-{szer}{orient}-T{kod}{kolor}-SD{kod}{wykończenie}-B{kod}{wykończenie}-OP{kod}{wykończenie}-SK{kod}-AT{kod}-[P{kod}]
```
Przykład: `N2-130P-T13C-SD4B-B5B-OP68A-SK23-AT1-P1B`

---

## 20. Reguły dziedziczenia wykończeń

### Hierarchia
1. **Siedzisko** — wykończenie z SKU (lub default)
2. **Poduszka oparciowa** — determinowana przez siedzisko (seat_pillow_mapping), wykończenie per reguły poniżej
3. **Jaśki** — wykończenie = jak poduszka oparciowa
4. **Wałki** — wykończenie = jak poduszka oparciowa

### Wykończenie poduszek per siedzisko S1

| Siedzisko | Wykoń. siedziska | Wykoń. poduszki |
|-----------|-----------------|-----------------|
| SD01N/ND/W | A | A |
| SD02N | A | C |
| SD02N | B | B |
| SD02ND | A | C |
| SD02W | A | C |
| SD03 | A | A |
| SD03 | B | B |
| SD04 | D | D |

### Wykończenie poduszek S2

Wykończenie poduszki jak w tabeli seat→pillow mapping S2 (sekcja 7).

---

## 21. Dane TBD (do uzupełnienia)

- [ ] Ćwierćwałek boczny (Modena/Ravenna) — wymiary, materiał
- [ ] Pasek środkowy pod wciąg (wersje dzielone S2) — wymiary, materiał
- [ ] Stelaże boczków S2 — szczegóły
- [ ] S2 side_exceptions (Shopify → wewnętrzny) — jeśli są
- [ ] Pianki boczków (jeśli istnieją)
- [ ] Nóżki pufy S1 — dokładna wysokość z series_config
- [ ] SD01N + B9 listwa z płyty — wymiary, materiał
- [ ] P3 (P03) — pełna nazwa / opis
- [ ] Walidacja decodera vs seat_pillow_mapping — decoder dziś nie sprawdza reguł wykończenia poduszek per siedzisko (np. SD02N+A → poduszka C). W SKU finish jest explicit więc nie blokuje, ale warto dodać jako check poprawności konfiguratora Shopify.
