

## Plan: Dodanie pola `spring_type` (sprężyna) do etykiet siedziska i oparcia

### Co trzeba zrobić

Pole `spring_type` istnieje w tabelach `seats_sofa` i `backrests`, ale nie jest pobierane w dekoderze SKU ani uwzględnione w typie `DecodedSKU`. Trzeba je przepuścić przez cały łańcuch: DB query → dekoder → typ → selektor pól etykiet.

### Zmiany w plikach

1. **`src/types/index.ts`** — dodać `springType` do interfejsów `seat` i `backrest` w `DecodedSKU`

2. **`src/utils/skuDecoder.ts`**:
   - Linia 130: dodać `spring_type` do SELECT z `seats_sofa`
   - Linia 136: dodać `spring_type` do SELECT z `backrests`
   - W sekcji mapowania seat (~l.190+): wyciągnąć `spring_type` z DB response
   - W obiekcie return seat (~l.430): dodać `springType`
   - W obiekcie return backrest (~l.442): dodać `springType`

3. **`src/pages/AdminPanel/labels/DisplayFieldsSelector.tsx`**:
   - Dodać pole `seat.springType` ("Sprężyna siedziska", source: `seats_sofa.spring_type`) do sekcji `seat`
   - Dodać pole `backrest.springType` ("Sprężyna oparcia", source: `backrests.spring_type`) do sekcji `backrest`

4. **Usunąć `typeName` z typu** — w poprzednim kroku usunęliśmy `type_name` z DB, ale `typeName` wciąż jest w `DecodedSKU.seat` — wyczyścić przy okazji.

