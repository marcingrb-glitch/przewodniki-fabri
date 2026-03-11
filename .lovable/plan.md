

## Plan: Dodanie pola "Siedzisko" jako grupy głównej

### Co robimy
Dodajemy nowe pole `seat.summary` w selektorze pól (grupa "Siedzisko") wyświetlające: **"SD1 - Modena - Gładkie"** (kod + model + typ).

### Zmiany

#### 1. Typ `DecodedSKU` — `src/types/index.ts`
Dodanie `modelName?: string` do obiektu `seat` w interfejsie `DecodedSKU`.

#### 2. Dekoder SKU — `src/utils/skuDecoder.ts`
Przekazanie `seatSofaRes.data?.model_name` do wyniku `seat.modelName`.

#### 3. Grupy pól — `src/pages/AdminPanel/fieldResolver.ts`
- Dodanie nowej grupy `{ key: "seat", label: "Siedzisko" }` **przed** grupami "Stolarka" i "Pianki"
- Dodanie pola `{ value: "seat.summary", label: "Kod + model + typ", group: "seat" }`

#### 4. Resolver — `src/utils/pdfGenerators/decodingFieldResolver.ts`
Dodanie case:
```typescript
case "seat.summary":
  return [decoded.seat.code, decoded.seat.modelName, decoded.seat.type]
    .filter(Boolean).join(" - ") || "-";
```

#### 5. Podgląd (fieldResolver.ts)
Dodanie przykładowej wartości dla `seat.summary` w `resolveField`.

