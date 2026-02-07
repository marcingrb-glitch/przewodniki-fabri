# KNOWLEDGE FILE - System Przewodników Produkcyjnych i Etykiet

## 1. PRZEGLĄD SYSTEMU

Aplikacja służy do automatycznego generowania przewodników produkcyjnych i etykiet dla mebli tapicerowanych (sofy, pufy, fotele) na podstawie SKU produktu.

### Główne funkcjonalności:
1. **Dekodowanie SKU** - rozkodowanie kodu produktu na komponenty
2. **Generowanie przewodników** - tworzenie dokumentów dla działu produkcji i magazynu
3. **Generowanie etykiet** - tworzenie etykiet 10x3cm do druku dla komponentów
4. **Panel administracyjny** - zarządzanie komponentami i zależnościami

---

## 2. STRUKTURA SKU

### Format podstawowy SKU:
```
S[seria]-T[tkanina][kolor]-SD[siedzisko][wykończenie]-B[boczek][wykończenie]-OP[oparcie][wykończenie]-SK[skrzynia]-AT[automat]-N[nóżka][kolor]-[OPCJONALNE_DODATKI]
```

### Przykład pełnego SKU:
```
S1-T3D-SD1N-B1A-OP62A-SK15-AT1-N1A-P1-J1-W1-PF
```

### Dekodowanie:
- **S1** - Seria (Sofa Mar)
- **T3D** - Tkanina (Cloud, kolor 83)
- **SD1N** - Siedzisko (SD01 Niskie, wykończenie A - Stebnówka)
- **B1A** - Boczek (B1 Roland, wykończenie A - Stebnówka)
- **OP62A** - Oparcie (OP62 62cm, wykończenie A - Stebnówka)
- **SK15** - Skrzynia 15
- **AT1** - Automat zwykły
- **N1A** - Nóżka (N1 Stożek prosty drewniany, kolor A - Buk)
- **P1** - Poduszka oparciowa kwadratowa
- **J1** - Jaśek kwadratowy
- **W1** - Wałek
- **PF** - Pufa normalna

---

## 3. TABELE MAPOWANIA KOMPONENTÓW

### 3.1 SERIE
| SKU | Nazwa |
|-----|-------|
| S1  | Sofa Mar |
| S2  | Sofa Elma |

### 3.2 TKANINY (T)

| SKU | Nazwa Tkaniny | Grupa Cenowa | Kolory |
|-----|---------------|--------------|---------|
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

### 3.3 SIEDZISKA (SD)

#### Typy siedzisk:
- **N** = Niskie
- **ND** = Niskie dzielone
- **W** = Wysokie

#### Wykończenia szwów (dla wszystkich komponentów):
- **A** = Stebnówka
- **B** = Szczypanka
- **C** = Dwuigłówka
- **D** = Zwykły

#### WAŻNE: SD04 vs SD04D
```
SD04  = SD04 + wykończenie inne niż D (A, B lub C)
SD04D = SD04 + wykończenie D (szew zwykły)
```
Ostatnia litera ZAWSZE oznacza wykończenie szwu!

#### Tabela siedzisk - SOFA:

| SKU | Stelaż | Pianka | Front | Pasek środek |
|-----|--------|--------|-------|--------------|
| SD01N | S1-SD-190 [Viena] | 78 x 190 x 9 VPPT 30-40 [Viena] | 17 x 190 x 2 VP30 [Viena] | NIE |
| SD01ND | S1-SD-190 [Viena] | 78 x 190 x 9 VPPT 30-40 [Viena] | 17 x 190 x 2 VP30 [Viena] | TAK |
| SD01W | S1-SD-190 [Viena] | 78 x 190 x 9 VPPT 30-40 [Viena] | 23 x 190 x 2 VP30 | NIE |
| SD02N | S1-SD-190 [Viena] | 78 x 190 x 9 VPPT 30-40 [Viena] | Półwałek SD02N | NIE |
| SD02ND | S1-SD-190 [Viena] | 78 x 190 x 9 VPPT 30-40 [Viena] | Półwałek SD02N | TAK |
| SD02W | S1-SD-190 [Viena] | 78 x 190 x 9 VPPT 30-40 [Viena] | Półwałek SD02W | NIE |
| SD03 | S1-SD-190 [Viena] | 78 x 190 x 9 VPPT 30-40 [Viena] | 17 x 190 x 2 VP30 [Viena] | NIE |
| SD04 | S1-SD-190 [Viena] | 78 x 190 x 9 VPPT 30-40 [Viena] | Półwałek SD04 | NIE |

#### Tabela siedzisk - PUFA:

| Siedzisko | Front / Tył | Boki | Pianka bazowa | Skrzynka |
|-----------|-------------|------|---------------|----------|
| SD01N | 17 x 63 x 1 | 17 x 63 x 1 | 16 x 62 x 62 | 13 cm |
| SD01ND | 17 x 63 x 1 | 17 x 63 x 1 | 16 x 62 x 62 | 13 cm |
| SD01W | 23 x 63 x 1 | 23 x 63 x 1 | 18 x 62 x 62 | 8 cm |
| SD02N | Półwałek SD02N | 17 x 63 x 1 | 16 x 62 x 62 | 13 cm |
| SD02ND | Półwałek SD02N | 17 x 63 x 1 | 16 x 62 x 62 | 13 cm |
| SD02NB | Półwałek SD02N | Półwałek SD02N | 16 x 62 x 62 | 13 cm |
| SD02W | Półwałek SD02W | 23 x 63 x 1 | 18 x 62 x 62 | 8 cm |
| SD03 | 17 x 63 x 1 | 17 x 63 x 1 | 16 x 62 x 62 | 13 cm |
| SD04 | Półwałek SD04 | Półwałek SD04 | 16 x 62 x 62 | 13 cm |

### 3.4 OPARCIA (OP)

| SKU | Stelaż | Pianka | Góra |
|-----|--------|--------|------|
| OP62 | S1-OP62-190 | 62.5 x 190 x 9 VPPT 30-40 [Viena] | 19 x 190 x 2 VP30 [Viena] |
| OP68 | S1-OP68-190 | 68 x 190 x 9 VPPT 30-40 [Viena] | 19 x 190 x 2 VP30 [Viena] |

Wykończenia: A, B, C (Stebnówka, Szczypanka, Dwuigłówka)

### 3.5 BOCZKI (B)

| SKU | Stelaż | Nazwa |
|-----|--------|-------|
| B1 | B1 [Roland] | Roland |
| B2 | B2 [Arte] | Arte |
| B3 | B3 [Urano] | Urano |
| B4 | B4 [Nord] | Nord |
| B5 | B5 [Herford] | Herford |
| B6 | B6/B8 [Iga\Vamos] | Iga A |
| B7 | B7 [Iga I] | Iga B |
| B8 | B6/B8 [Iga\Vamos] | Iga C |
| B9 | B9 [Viena] | Viena |

Wykończenia: A, B, C (Stebnówka, Szczypanka, Dwuigłówka)

### 3.6 SKRZYNIE (SK)

| SKU | Nazwa | Wysokość nóżek pod skrzynią |
|-----|-------|----------------------------|
| SK15 | SK15 - 190 | 10 cm (4 szt) |
| SK17 | SK17 - 190 | 8 cm (4 szt) |
| SK23 | SK23 - 190 | 2.5 cm plastikowe N4 (4 szt) |

### 3.7 AUTOMATY (AT)

| SKU | Nazwa | Opis | Nóżki pod siedziskiem |
|-----|-------|------|----------------------|
| AT1 | Zwykły | Automat zwykły | TAK - H 16cm (2 szt) |
| AT2 | Wyrzutkowy | Automat z nóżką | NIE |

### 3.8 NÓŻKI (N)

#### Typy nóżek:

| SKU | Nazwa | Materiał | Kolory |
|-----|-------|----------|--------|
| N1 | Stożek prosty | Drewniany | A=Buk, B=Brązowa, C=Czarna |
| N2 | Stożek skos | Drewniany | A=Buk, B=Brązowa, C=Czarna |
| N3 | Walec | Drewniany | A=Buk, B=Brązowa, C=Czarna |
| N4 | Plastikowa | Plastik | (bez wariantów - zawsze dla SK23) |
| N5 | Szpilka | Metalowa | A=Czarna, B=Złota |

#### REGUŁY WYSOKOŚCI NÓŻEK:

##### SOFA - Pod skrzynią (4 sztuki):
```
SK15 + N[typ][kolor] → H 10cm
SK17 + N[typ][kolor] → H 8cm
SK23 + N4            → H 2.5cm (plastikowe, NIE ma w SKU)
```

##### SOFA - Pod siedziskiem (2 sztuki):
```
AT1 + N[typ][kolor] → H 16cm
AT2                 → BRAK nóżek
```

##### PUFA - Nóżki (4 sztuki):
```
N[typ][kolor] → H 16cm (ZAWSZE)
```

##### FOTEL - Nóżki (4 sztuki):
```
N[typ][kolor] → H 16cm (ZAWSZE)
```

#### WAŻNA ZASADA - SK23 + AT2 + dodatki:
```
SKU: S1-T3D-SD1N-B1A-OP62A-SK23-AT2-N1A-PF

SOFA:
- Pod skrzynią: N4 H 2.5cm (4 szt) - ZAWSZE dla SK23
- Pod siedziskiem: BRAK (bo AT2)

PUFA/FOTEL:
- Nóżki: N1A H 16cm (4 szt) - typ z SKU jest DLA DODATKU, NIE dla sofy!
```

### 3.9 PODUSZKI OPARCIOWE (P)

| SKU | Nazwa | Wykończenie |
|-----|-------|-------------|
| P1 | Poduszka kwadratowa | ZAWSZE jak siedzisko |
| P2 | Poduszka zaokrąglona | ZAWSZE jak siedzisko |

**WAŻNE:** Poduszki NIE mają własnego wykończenia w SKU. Dziedziczą wykończenie od siedziska!

### 3.10 JAŚKI (J)

| SKU | Nazwa | Wykończenie |
|-----|-------|-------------|
| J1 | Jaśek kwadratowy | ZAWSZE jak poduszka oparciowa (czyli jak siedzisko) |
| J2 | Jaśek zaokrąglony | ZAWSZE jak poduszka oparciowa (czyli jak siedzisko) |

**DZIEDZICZENIE dla FOTELA:**
Jeśli sofa ma J1 lub J2 w SKU → fotel też automatycznie ma te jaśki!

### 3.11 WAŁKI (W)

| SKU | Nazwa | Wykończenie |
|-----|-------|-------------|
| W1 | Wałek | ZAWSZE jak poduszka oparciowa (czyli jak siedzisko) |

### 3.12 DODATKI

| SKU | Nazwa | Opis |
|-----|-------|------|
| PF | Pufa normalna | Dodatek - osobny przewodnik i etykiety |
| PFO | Pufa otwierana | Dodatek - osobny przewodnik i etykiety |
| FT | Fotel | Dodatek - osobny przewodnik i etykiety |

---

## 4. REGUŁY BIZNESOWE

### 4.1 Dziedziczenie komponentów

#### PUFA dziedziczy z SOFY:
```
Seria (S1)
Tkanina (T3D)
Siedzisko (SD1N)
Nóżki (N1A)
```

**SKU pufy generuje się jako:**
```
PF-S1-T3D-SD1N-N1A
lub
PFO-S1-T3D-SD1N-N1A
```

#### FOTEL dziedziczy z SOFY:
```
Seria (S1)
Tkanina (T3D)
Siedzisko (SD1N)
Boczki (B1A)
Nóżki (N1A)
Jaśki (J1/J2) - TYLKO jeśli są w sofie
```

**SKU fotela generuje się jako:**
```
Bez jaśków: FT-S1-T3D-SD1N-B1A-N1A
Z jaśkami: FT-S1-T3D-SD1N-B1A-J1-N1A
```

### 4.2 Wykończenia szwów - dziedziczenie

```
Siedzisko wykończenie → Podstawa dla wszystkiego

Poduszki oparciowe → jak siedzisko
Jaśki → jak poduszki oparciowe → jak siedzisko
Wałki → jak poduszki oparciowe → jak siedzisko
```

### 4.3 Informacje o dodatkach w przewodniku sofy

Jeśli w SKU znajduje się:
- **PF** lub **PFO** → dodaj informację: "Do zamówienia jest PUFA"
- **FT** → dodaj informację: "Do zamówienia jest FOTEL"

---

## 5. FORMATY PRZEWODNIKÓW

### 5.1 PRZEWODNIK SOFY

```
NUMER ZAMÓWIENIA: [numer]                    [S1 - Sofa Mar [Viena]]
Data złożenia zamówienia: [data]

┌──────────────────────────────────────────────────────────┐
│ SIEDZISKO                                                 │
├──────────────┬──────────────┬──────────────┬─────────────┤
│ Siedzisko    │ Stelaż       │ Pianka       │ Front       │
│ [SKU]        │ [z tabeli]   │ [z tabeli]   │ [z tabeli]  │
└──────────────┴──────────────┴──────────────┴─────────────┘

┌──────────────────────────────────────────────────────────┐
│ OPARCIE                                                   │
├──────────────┬──────────────┬──────────────┬─────────────┤
│ Oparcie      │ Stelaż       │ Pianka       │ Góra        │
│ [SKU]        │ [z tabeli]   │ [z tabeli]   │ [z tabeli]  │
└──────────────┴──────────────┴──────────────┴─────────────┘

┌──────────────────────────────────────────────────────────┐
│ BOCZEK                                                    │
├──────────────┬──────────────┬──────────────┬─────────────┤
│ Boczek       │ Stelaż       │ Pianka       │             │
│ [SKU]        │ [z tabeli]   │ -            │             │
└──────────────┴──────────────┴──────────────┴─────────────┘

┌──────────────────────────────────────────────────────────┐
│ SKRZYNIA + AUTOMAT                                        │
├──────────────┬──────────────┬──────────────┬─────────────┤
│ Skrzynia+    │ Skrzynia     │ Automat      │             │
│ Automat      │              │              │             │
│ [SKU]        │ [z tabeli]   │ [z tabeli]   │             │
└──────────────┴──────────────┴──────────────┴─────────────┘

┌──────────────────────────────────────────────────────────┐
│ NÓŻKA                                                     │
├──────────────┬──────────────┬──────────────┬─────────────┤
│ Nóżka        │ Skrzynia     │ Siedzisko    │             │
│ [SKU]        │ [N+H]        │ [N+H lub     │             │
│              │              │  BRAK]       │             │
└──────────────┴──────────────┴──────────────┴─────────────┘

[Jeśli P1 lub P2 w SKU]
┌──────────────────────────────────────────────────────────┐
│ PODUSZKI OPARCIOWE                                        │
├──────────────┬──────────────┬──────────────┬─────────────┤
│ Poduszka     │ Typ          │ Wykończenie  │             │
│ [P1/P2]      │ [z tabeli]   │ [jak         │             │
│              │              │  siedzisko]  │             │
└──────────────┴──────────────┴──────────────┴─────────────┘

[Jeśli J1 lub J2 w SKU]
┌──────────────────────────────────────────────────────────┐
│ JAŚKI                                                     │
├──────────────┬──────────────┬──────────────┬─────────────┤
│ Jaśki        │ Typ          │ Wykończenie  │             │
│ [J1/J2]      │ [z tabeli]   │ [jak         │             │
│              │              │  siedzisko]  │             │
└──────────────┴──────────────┴──────────────┴─────────────┘

[Jeśli W1 w SKU]
┌──────────────────────────────────────────────────────────┐
│ WAŁKI                                                     │
├──────────────┬──────────────┬──────────────┬─────────────┤
│ Wałek        │ Typ          │ Wykończenie  │             │
│ W1           │ Wałek        │ [jak         │             │
│              │              │  siedzisko]  │             │
└──────────────┴──────────────┴──────────────┴─────────────┘

[Jeśli PF lub PFO lub FT w SKU]
┌──────────────────────────────────────────────────────────┐
│ INFORMACJA                                                │
│ Do zamówienia jest [PUFA/FOTEL]                          │
└──────────────────────────────────────────────────────────┘
```

### 5.2 PRZEWODNIK PUFY

```
PUFA | NUMER ZAMÓWIENIA: [numer]            [S1 - Sofa Mar [Viena]]
Data złożenia zamówienia: [data]
SKU: [PF/PFO]-S[x]-T[x][x]-SD[xxx]-N[x][x]

┌──────────────────────────────────────────────────────────┐
│ SIEDZISKO                                                 │
├──────────────┬──────────────┬──────────────┬─────────────┤
│ Siedzisko    │ Front/Tył    │ Boki         │ Pianka      │
│ [SKU]        │ [z tabeli    │ [z tabeli    │ bazowa      │
│              │  pufy]       │  pufy]       │ [z tabeli]  │
└──────────────┴──────────────┴──────────────┴─────────────┘

┌──────────────────────────────────────────────────────────┐
│ SKRZYNKA                                                  │
├──────────────┬──────────────┬──────────────┬─────────────┤
│ Skrzynka     │ Wysokość     │              │             │
│ [z tabeli]   │ [z tabeli]   │              │             │
└──────────────┴──────────────┴──────────────┴─────────────┘

┌──────────────────────────────────────────────────────────┐
│ NÓŻKI                                                     │
├──────────────┬──────────────┬──────────────┬─────────────┤
│ Nóżka        │ Ilość        │ Wysokość     │             │
│ [SKU]        │ 4 szt        │ H 16cm       │             │
└──────────────┴──────────────┴──────────────┴─────────────┘
```

### 5.3 PRZEWODNIK FOTELA

```
FOTEL | NUMER ZAMÓWIENIA: [numer]           [S1 - Sofa Mar [Viena]]
Data złożenia zamówienia: [data]
SKU: FT-S[x]-T[x][x]-SD[xxx]-B[x][x]-N[x][x]-[J1/J2]

┌──────────────────────────────────────────────────────────┐
│ SIEDZISKO                                                 │
├──────────────┬──────────────┬──────────────┬─────────────┤
│ Siedzisko    │ Stelaż       │ Pianka       │ Front       │
│ [SKU]        │ [z tabeli    │ [z tabeli    │ [z tabeli]  │
│              │  sofy]       │  sofy]       │             │
└──────────────┴──────────────┴──────────────┴─────────────┘

┌──────────────────────────────────────────────────────────┐
│ BOCZKI                                                    │
├──────────────┬──────────────┬──────────────┬─────────────┤
│ Boczek       │ Stelaż       │ Pianka       │             │
│ [SKU]        │ [z tabeli]   │ -            │             │
└──────────────┴──────────────┴──────────────┴─────────────┘

┌──────────────────────────────────────────────────────────┐
│ NÓŻKI                                                     │
├──────────────┬──────────────┬──────────────┬─────────────┤
│ Nóżka        │ Ilość        │ Wysokość     │             │
│ [SKU]        │ 4 szt        │ H 16cm       │             │
└──────────────┴──────────────┴──────────────┴─────────────┘

[Jeśli J1 lub J2 w SKU]
┌──────────────────────────────────────────────────────────┐
│ JAŚKI                                                     │
├──────────────┬──────────────┬──────────────┬─────────────┤
│ Jaśki        │ Typ          │ Wykończenie  │             │
│ [J1/J2]      │ [z tabeli]   │ [jak         │             │
│              │              │  siedzisko]  │             │
└──────────────┴──────────────┴──────────────┴─────────────┘
```

---

## 6. FORMATY ETYKIET (10x3 cm)

### 6.1 ETYKIETY SOFY

#### Wariant A: AT1 (są nóżki pod siedziskiem) - 6 etykiet

**1. Etykieta Siedzisko**
```
[S1 - Sofa Mar [Viena]]
SOFA | Numer zam: [numer]
Siedzisko: [SKU]
Automat: [SKU]
```

**2. Etykieta Oparcie**
```
[S1 - Sofa Mar [Viena]]
SOFA | Numer zam: [numer]
Oparcie: [SKU]
```

**3. Etykieta Boczek (x2 - drukować 2 razy)**
```
[S1 - Sofa Mar [Viena]]
SOFA | Numer zam: [numer]
Boczek: [SKU]
```

**4. Etykieta Skrzynia + Automat**
```
[S1 - Sofa Mar [Viena]]
SOFA | Numer zam: [numer]
Skrzynia: [SKU]
Automat: [SKU]
```

**5. Etykieta Nóżki pod skrzynią**
```
[S1 - Sofa Mar [Viena]]
Numer zam: [numer]
Noga skrzynia: [N-SKU] H=[wysokość]
Ilość: 4 szt
```

**6. Etykieta Nóżki pod siedziskiem**
```
[S1 - Sofa Mar [Viena]]
Numer zam: [numer]
Noga siedzisko: [N-SKU] H=16cm
Ilość: 2 szt
```

#### Wariant B: AT2 (brak nóżek pod siedziskiem) - 5 etykiet

Etykiety 1-5 jak wyżej, **BEZ** etykiety nr 6 (nóżki pod siedziskiem)

### 6.2 ETYKIETY PUFY - 3 etykiety

**1. Etykieta Siedzisko + Pianka**
```
[S1 - Sofa Mar [Viena]]
PUFA | Numer zam: [numer]
Siedzisko: [SKU]
Pianka bazowa: [z tabeli pufy]
```

**2. Etykieta Skrzynka**
```
[S1 - Sofa Mar [Viena]]
PUFA | Numer zam: [numer]
Skrzynka: [wysokość z tabeli pufy]
```

**3. Etykieta Nóżki**
```
[S1 - Sofa Mar [Viena]]
PUFA | Numer zam: [numer]
Noga: [N-SKU] H=16cm
Ilość: 4 szt
```

### 6.3 ETYKIETY FOTELA - 3 etykiety

**1. Etykieta Siedzisko**
```
[S1 - Sofa Mar [Viena]]
FOTEL | Numer zam: [numer]
Siedzisko: [SKU]
```

**2. Etykieta Boczki**
```
[S1 - Sofa Mar [Viena]]
FOTEL | Numer zam: [numer]
Boczek: [SKU]
```

**3. Etykieta Nóżki**
```
[S1 - Sofa Mar [Viena]]
FOTEL | Numer zam: [numer]
Noga: [N-SKU] H=16cm
Ilość: 4 szt
```

---

## 7. PANEL ADMINISTRACYJNY - ZARZĄDZANIE KOMPONENTAMI

### 7.1 Struktura danych - HIERARCHIA SERIE

**KRYTYCZNE:** Komponenty są przypisane do konkretnych serii!

```
Serie
├── S1 - Sofa Mar [Viena]
│   ├── Siedziska (SD01N-SD04)
│   ├── Oparcia (OP62, OP68)
│   ├── Boczki (B1-B9)
│   ├── Nóżki (N1-N5)
│   └── Dodatki (PF, PFO, FT)
│
├── S2 - Sofa Elma
│   ├── Siedziska (SD01N-SD04) ← INNE niż S1!
│   ├── Oparcia (OP62, OP68) ← INNE niż S1!
│   ├── Boczki (B1-B9) ← INNE bryły niż S1!
│   ├── Nóżki (N1-N5)
│   └── Dodatki (PF, PFO, FT)
│
└── WSPÓLNE DLA WSZYSTKICH SERII:
    ├── Tkaniny (T1-T13)
    ├── Skrzynie (SK15, SK17, SK23)
    ├── Automaty (AT1, AT2)
    ├── Poduszki oparciowe (P1, P2)
    ├── Jaśki (J1, J2)
    └── Wałki (W1)
```

**Przykład:**
- B1 w serii S1 = Roland (konstrukcja Vienna)
- B1 w serii S2 = [Inna nazwa] (inna konstrukcja Elma)

### 7.2 Tabele do zarządzania
### 7.2 Tabele do zarządzania

#### WSPÓLNE (dla wszystkich serii):
1. **Serie** (S1, S2, N1, N2...)
2. **Tkaniny** (T1-T13 + kolory A-F)
3. **Skrzynie** (SK15, SK17, SK23 + wysokości nóżek)
4. **Automaty** (AT1, AT2 + reguły nóżek)
5. **Poduszki oparciowe** (P1, P2 + nazwy)
6. **Jaśki** (J1, J2 + nazwy)
7. **Wałki** (W1 + nazwa)

#### SPECYFICZNE DLA SERII (osobne dla S1, S2, etc.):
8. **Siedziska - Sofa** (SD01N-SD04 + dane stelaż/pianka/front)
9. **Siedziska - Pufa** (SD01N-SD04 + dane front/tył/boki/pianka/skrzynka)
10. **Oparcia** (OP62, OP68 + dane stelaż/pianka/góra)
11. **Boczki** (B1-B9 + stelaż/nazwa)
12. **Nóżki** (N1-N5 + typ/materiał/kolory)
13. **Dodatki** (PF, PFO, FT)

**WAŻNE:** Przy wyborze serii w interfejsie admina, pokazuj tylko komponenty przypisane do tej serii!

### 7.3 Interfejs administracyjny

Dla każdej tabeli:
- **Widok listy** - wyświetlanie wszystkich rekordów
- **Dodaj** - formularz dodawania nowego komponentu
- **Edytuj** - formularz edycji istniejącego komponentu
- **Usuń** - usunięcie komponentu (z ostrzeżeniem)

### 7.4 Edycja zależności

Panel powinien umożliwiać edycję:

#### Reguły wysokości nóżek:
```javascript
{
  "sofa_pod_skrzynia": {
    "SK15": { "wysokość": 10, "ilość": 4 },
    "SK17": { "wysokość": 8, "ilość": 4 },
    "SK23": { "wysokość": 2.5, "ilość": 4, "typ": "N4" }
  },
  "sofa_pod_siedziskiem": {
    "AT1": { "wysokość": 16, "ilość": 2 },
    "AT2": { "wysokość": 0, "ilość": 0 }
  },
  "pufa": { "wysokość": 16, "ilość": 4 },
  "fotel": { "wysokość": 16, "ilość": 4 }
}
```

#### Reguły dziedziczenia:
```javascript
{
  "pufa": ["seria", "tkanina", "siedzisko", "nóżki"],
  "fotel": ["seria", "tkanina", "siedzisko", "boczki", "nóżki", "jaśki_opcjonalnie"]
}
```

#### Reguły wykończeń:
```javascript
{
  "wykończenia": {
    "A": "Stebnówka",
    "B": "Szczypanka",
    "C": "Dwuigłówka",
    "D": "Zwykły"
  },
  "dziedziczenie_wykończeń": {
    "poduszki": "siedzisko",
    "jaśki": "poduszki",
    "wałki": "poduszki"
  },
  "domyślne_wykończenia": {
    "SD01N": "A",
    "SD01ND": "A",
    "SD01W": "A",
    "SD02N": "A",
    "SD02ND": "A",
    "SD02W": "A",
    "SD03": "A",
    "SD04": "D"
  }
}
```

**Zasada domyślnych wykończeń:**
- Jeśli siedzisko w SKU nie ma litery na końcu (np. SD01N zamiast SD01NA)
- Aplikacja używa domyślnego wykończenia z tabeli powyżej
- Dla SD04 domyślnie D (zwykły)

---

## 8. PRZYKŁADY DEKODOWANIA

**WAŻNE:** Aplikacja powinna umożliwiać eksport dekodowania SKU jako PDF dla każdego zamówienia. PDF zawiera pełne rozbicie SKU na komponenty z opisami.

### Format PDF dekodowania:

```
┌────────────────────────────────────────────────────────┐
│ DEKODOWANIE SKU                                        │
│ [S1 - Sofa Mar [Viena]]                                │
├────────────────────────────────────────────────────────┤
│ SKU: S1-T3D-SD2NA-B8C-OP62A-SK15-AT1-N5A-P1-J1-W1-PF  │
│ Numer zamówienia: [numer]                              │
│ Data: [data]                                           │
├────────────────────────────────────────────────────────┤
│                                                        │
│ GŁÓWNE KOMPONENTY:                                     │
│ • Seria: S1 - Sofa Mar [Viena]                        │
│ • Tkanina: T3D - Cloud, kolor 83                      │
│ • Siedzisko: SD02N - Niskie                           │
│   Wykończenie: A (Stebnówka)                          │
│ • Boczek: B8C - Iga C                                 │
│   Wykończenie: C (Dwuigłówka)                         │
│ • Oparcie: OP62A - 62cm                               │
│   Wykończenie: A (Stebnówka)                          │
│ • Skrzynia: SK15                                      │
│ • Automat: AT1 - Zwykły                               │
│ • Nóżki: N5A - Szpilka metalowa, Czarna               │
│                                                        │
│ DODATKI:                                               │
│ • Poduszka oparciowa: P1 - Kwadratowa                 │
│   Wykończenie: A (jak siedzisko)                      │
│ • Jaśki: J1 - Kwadratowe                              │
│   Wykończenie: A (jak poduszka)                       │
│ • Wałek: W1                                           │
│   Wykończenie: A (jak poduszka)                       │
│ • Pufa: PF - Normalna                                 │
│                                                        │
│ NÓŻKI - SOFA:                                         │
│ • Pod skrzynią: N5A H 10cm (4 szt) - bo SK15         │
│ • Pod siedziskiem: N5A H 16cm (2 szt) - bo AT1       │
│                                                        │
│ DODATKI - PUFA:                                       │
│ • SKU pufy: PF-S1-T3D-SD02N-N5A                       │
│ • Nóżki pufy: N5A H 16cm (4 szt)                      │
└────────────────────────────────────────────────────────┘
```

### Przykład 1: Pełny SKU z dodatkami
```
SKU: S1-T3D-SD2NA-B8C-OP62A-SK15-AT1-N5A-P1-J1-W1-PF

DEKODOWANIE:
- Seria: S1 (Sofa Mar)
- Tkanina: T3D (Cloud, kolor 83)
- Siedzisko: SD02N (Niskie) + wykończenie A (Stebnówka)
- Boczek: B8C (Iga C) + wykończenie C (Dwuigłówka)
- Oparcie: OP62A (62cm) + wykończenie A (Stebnówka)
- Skrzynia: SK15
- Automat: AT1 (zwykły)
- Nóżki: N5A (Szpilka metalowa, czarna)
- Poduszka: P1 (kwadratowa, wykończenie A jak siedzisko)
- Jaśki: J1 (kwadratowe, wykończenie A jak poduszka)
- Wałek: W1 (wykończenie A jak poduszka)
- Dodatek: PF (Pufa normalna)

NÓŻKI SOFY:
- Pod skrzynią: N5A H 10cm (4 szt) - bo SK15
- Pod siedziskiem: N5A H 16cm (2 szt) - bo AT1

SKU PUFY:
PF-S1-T3D-SD02N-N5A

NÓŻKI PUFY:
- N5A H 16cm (4 szt)
```

### Przykład 2: SK23 + AT2 + Pufa
```
SKU: S1-T2C-SD1N-B1A-OP62A-SK23-AT2-N1A-PF

DEKODOWANIE:
- Seria: S1 (Sofa Mar)
- Tkanina: T2C (Portland, Moss)
- Siedzisko: SD01N (Niskie) + wykończenie A (Stebnówka)
- Boczek: B1A (Roland) + wykończenie A (Stebnówka)
- Oparcie: OP62A (62cm) + wykończenie A (Stebnówka)
- Skrzynia: SK23
- Automat: AT2 (wyrzutkowy)
- Nóżki: N1A (Stożek prosty, Buk) - TO DLA PUFY!
- Dodatek: PF (Pufa normalna)

NÓŻKI SOFY:
- Pod skrzynią: N4 H 2.5cm (4 szt) - ZAWSZE dla SK23 (plastikowe)
- Pod siedziskiem: BRAK - bo AT2

SKU PUFY:
PF-S1-T2C-SD01N-N1A

NÓŻKI PUFY:
- N1A H 16cm (4 szt) - N1A z SKU głównego!
```

### Przykład 3: Fotel z jaśkami
```
SKU główny: S1-T5B-SD3A-B2B-OP68B-SK17-AT1-N2B-J2

FOTEL dziedziczy J2 bo jest w sofie!

SKU FOTELA:
FT-S1-T5B-SD03-B2B-J2-N2B

DEKODOWANIE FOTELA:
- Seria: S1
- Tkanina: T5B (Brooklyn, Beige)
- Siedzisko: SD03 + wykończenie A (Stebnówka - z sofy)
- Boczek: B2B (Arte) + wykończenie B (Szczypanka)
- Jaśki: J2 (zaokrąglone, wykończenie A jak siedzisko)
- Nóżki: N2B H 16cm (4 szt)
```

---

## 9. VALIDACJA SKU

### Reguły walidacji:

1. **Format podstawowy:**
   - Musi zaczynać się od S[cyfra] (sofy) lub N[cyfra] (narożniki - w przyszłości)
   - Kolejność komponentów: S-T-SD-B-OP-SK-AT-[N]-[opcjonalne]

2. **Wymagane komponenty:**
   - Seria (S lub N)
   - Tkanina (T)
   - Siedzisko (SD)
   - Boczek (B)
   - Oparcie (OP)
   - Skrzynia (SK)
   - Automat (AT)

3. **Opcjonalne komponenty:**
   - **Nóżki (N)** - OPCJONALNE! 
     - BRAK jeśli: SK23 + AT2 + brak dodatków (PF/PFO/FT)
     - WYMAGANE jeśli: dodatki (PF/PFO/FT)
     - WYMAGANE jeśli: SK15 lub SK17
   - Poduszka oparciowa (P1 lub P2)
   - Jaśki (J1 lub J2)
   - Wałek (W1)
   - Dodatki (PF, PFO, FT)

4. **Wykończenia:**
   - **Siedzisko (SD):** Wykończenie (A, B, C, D) jest OPCJONALNE
     - Jeśli brak litery na końcu → użyj domyślnego wykończenia dla tego siedziska
     - Jeśli jest litera → to jest wykończenie
     - Przykład: SD01N może być bez A/B/C, wtedy domyślnie A
   - **Boczek (B):** MUSI mieć literę A, B lub C na końcu
   - **Oparcie (OP):** MUSI mieć literę A, B lub C na końcu
   - **Wyjątek: SD04D** - D jest częścią nazwy, ale też wykończeniem

5. **Nóżki - szczególne przypadki:**
   - Dla SK23: NIE ma nóżek w SKU (używamy N4 plastikowe automatycznie)
   - Dla SK15/SK17 + AT1: MUSI być N[cyfra][litera]
   - Dla SK15/SK17 + AT2 bez dodatków: NIE MUSI być N
   - Dla SK23 + AT2 + dodatki: N w SKU jest dla dodatku, nie dla sofy

6. **Logika:**
   - Jeśli PF lub PFO lub FT → musi być N w SKU (dla dodatku)
   - Jeśli SK23 + AT2 + dodatki → N w SKU jest dla dodatku, nie dla sofy

7. **Narożniki (w przyszłości):**
   - Format: N1-... (N = narożnik, 1 = seria Mar)
   - N1 = Narożnik z serii Mar
   - N2 = Narożnik z serii Elma (w przyszłości)

8. **Serie z własnymi komponentami:**
   - **S1 (Sofa Mar [Viena]):** ma własne B1-B9, SD01N-SD04, OP62-OP68
   - **S2 (Sofa Elma):** ma INNE B1-B9, INNE SD01N-SD04, INNE OP62-OP68
   - B1 w S1 ≠ B1 w S2 (inne bryły, konstrukcje)
   - Komponenty są RÓŻNE między seriami!

---

## 10. TECHNOLOGIE I ARCHITEKTURA

### Rekomendowany stack (Lovable):
- **Frontend:** React 18 + TypeScript
- **Styling:** Tailwind CSS + shadcn/ui
- **PDF Generation:** jsPDF lub react-pdf
- **State Management:** Zustand lub React Context
- **Routing:** React Router
- **Database:** Supabase (dla panelu admin)

### Struktura komponentów:

```
/src
  /components
    /SKUDecoder - Dekoder SKU
    /GuideGenerator - Generator przewodników
    /LabelGenerator - Generator etykiet
    /Admin - Panel administracyjny
      /SeriesManager
      /FabricsManager
      /SeatsManager
      /BackrestsManager
      /SidesManager
      /ChestsManager
      /AutomatsManager
      /LegsManager
      /PillowsManager
      /JaskiManager
      /WalekManager
      /ExtrasManager
    /Preview - Podgląd przewodników/etykiet
  /data
    /mappings.ts - Wszystkie tabele mapowania
    /rules.ts - Reguły biznesowe
  /utils
    /skuParser.ts - Parser SKU
    /validator.ts - Walidator SKU
    /pdfGenerator.ts - Generator PDF
  /types
    /index.ts - TypeScript types
```

### Kluczowe funkcje:

```typescript
// Parser SKU
function parseSKU(sku: string): ParsedSKU {
  // Rozbija SKU na komponenty
}

// Walidator SKU
function validateSKU(sku: string): ValidationResult {
  // Sprawdza poprawność SKU
}

// Generator przewodnika
function generateGuide(sku: string, type: 'sofa' | 'pufa' | 'fotel'): Guide {
  // Generuje przewodnik
}

// Generator etykiet
function generateLabels(sku: string, type: 'sofa' | 'pufa' | 'fotel'): Label[] {
  // Generuje etykiety
}

// Generator SKU dla dodatków
function generateExtraSKU(mainSKU: string, type: 'PF' | 'PFO' | 'FT'): string {
  // Generuje SKU dla pufy/fotela na podstawie SKU sofy
}

// Export dekodowania jako PDF
function exportDecodingPDF(sku: string, orderNumber: string, date: string): Blob {
  // Generuje PDF z pełnym dekodowaniem SKU
}
```

---

## 11. NAJWAŻNIEJSZE ZASADY

### DO ZAPAMIĘTANIA:

1. **Seria na każdym dokumencie:**
   - Przewodnik: górny prawy róg "S1 - Sofa Mar [Viena]"
   - Etykiety: na górze każdej etykiety

2. **Serie mają własne komponenty:**
   - B1 w S1 ≠ B1 w S2 (różne bryły)
   - SD01N w S1 ≠ SD01N w S2 (różne konstrukcje)
   - Komponenty są ZAWSZE przypisane do konkretnej serii!
   - **WSPÓLNE dla wszystkich:** Tkaniny, Skrzynie, Automaty, Poduszki, Jaśki, Wałki

3. **Wykończenia dziedziczą się kaskadowo:**
   - Siedzisko → Poduszki → Jaśki → Wałki
   - Jeśli siedzisko bez litery (np. SD01N) → użyj domyślnego wykończenia (A)

4. **SK23 = plastikowe nóżki N4 (NIE w SKU):**
   - Dla SK23 NIGDY nie ma N w SKU, ale na przewodniku/etykietach dodajemy N4 H 2.5cm

5. **N w SKU przy SK23 + dodatki = nóżki dla dodatku:**
   - Jeśli SK23 + AT2 + N1A + PF → N1A to nóżki PUFY, nie sofy!

6. **Wysokości nóżek:**
   - Sofa pod skrzynią: 10cm/8cm/2.5cm (zależnie od SK)
   - Sofa pod siedziskiem: 16cm (tylko AT1)
   - Pufa: 16cm (zawsze)
   - Fotel: 16cm (zawsze)

7. **Fotel dziedziczy jaśki automatycznie:**
   - Jeśli sofa ma J1 lub J2 → fotel też ma!

8. **SD04 vs SD04D:**
   - Litera na końcu ZAWSZE = wykończenie, nawet dla SD04D

9. **Nóżki są opcjonalne w SKU:**
   - SK23 + AT2 bez dodatków → BRAK N w SKU
   - Dodatki (PF/PFO/FT) → MUSI być N w SKU

10. **Export dekodowania jako PDF:**
    - Każde zamówienie powinno mieć możliwość exportu dekodowania SKU jako PDF

11. **Narożniki w przyszłości:**
    - N1 = Narożnik seria Mar
    - N2 = Narożnik seria Elma

---

To jest kompletny KNOWLEDGE FILE dla aplikacji. 
Zawiera wszystkie reguły, mapowania i logikę biznesową potrzebną do automatyzacji generowania przewodników i etykiet.
