

## Plan: Uprość typy nóżek — usuń `built_in_plastic`, zostaw tylko 2 typy

### Kontekst
Użytkownik potwierdził, ze istnieją tylko **2 typy nóżek**:
1. **`from_sku`** — nóżka z kodu SKU (drewniane), kompletacja: dziewczyny od nóżek
2. **`plastic_2_5`** — N4 plastikowe, kompletacja: tapicer na stanowisku

Typ `built_in_plastic` nie istnieje w rzeczywistości — to zawsze `plastic_2_5`.

### Zmiany

**1. Migracja bazy danych** — zamień wszystkie `built_in_plastic` na `plastic_2_5`:
```sql
UPDATE series_config SET seat_leg_type = 'plastic_2_5' WHERE seat_leg_type = 'built_in_plastic';
UPDATE series_config SET pufa_leg_type = 'plastic_2_5' WHERE pufa_leg_type = 'built_in_plastic';
```

**2. Pliki do edycji** — usuń wszystkie referencje do `built_in_plastic` w 5 plikach:

- **`src/pages/AdminPanel/spec/SeriesLegs.tsx`** — usuń `built_in_plastic` z `LEG_TYPE_LABELS` i uprość logikę mountRows (2 ścieżki zamiast 3)
- **`src/pages/AdminPanel/spec/SeriesOverview.tsx`** — usuń case `built_in_plastic` z switch i z `LEG_COMPLETION_LABELS`
- **`src/pages/AdminPanel/spec/SeriesPufa.tsx`** — usuń `built_in_plastic` z `LEG_TYPE_LABELS` i uprość badge kompletacji
- **`src/pages/AdminPanel/cheatsheets/NozkiSheet.tsx`** — usuń warunki `built_in_plastic`, zostaw tylko `plastic_2_5` vs `from_sku`
- **`src/pages/AdminPanel/cheatsheets/KierownikSheet.tsx`** — usuń case `built_in_plastic` z switch

### Wynik
- 2 typy nóżek w całym systemie: `from_sku` i `plastic_2_5`
- Prostsze etykiety i logika
- Brak zmian w `skuParser`, `skuDecoder`, `pdfGenerators`

