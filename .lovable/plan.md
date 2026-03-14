

## Etap 2.1 — Nowy Generic SKU Parser

### Zakres zmian

1. **Nowy plik `src/utils/skuParserGeneric.ts`** — async parser czytający reguły z `sku_segments` i side exceptions z `product_relations`. Kod dostarczony w briefie.

2. **Aktualizacja 3 plików konsumenckich** — zmiana importów i dodanie `await`:
   - `src/components/orders/OrderForm.tsx` — import `parseSKUGeneric` + `fetchSideExceptionsGeneric`, await na parsowaniu
   - `src/components/orders/ShopifyOrderForm.tsx` — analogicznie
   - `src/pages/OrderHistoryPage.tsx` — analogicznie

3. **`src/utils/skuValidator.ts`** — zmiana na async (Opcja A z briefu):
   - `validateSKU` → `async function validateSKU(...): Promise<ValidationResult>`
   - Import z `skuParserGeneric`
   - Aktualizacja callsites w OrderForm i ShopifyOrderForm (dodanie `await`)

4. **Bez zmian**: `skuParser.ts` (zostaje jako fallback), `skuDecoder.ts`, `types/index.ts`, `data/mappings.ts`, brak migracji SQL.

### Callsites do zaktualizowania

| Plik | Zmiana |
|---|---|
| `OrderForm.tsx` | `await validateSKU(sku)`, `await parseSKUGeneric(sku, sideExceptions)`, nowy import |
| `ShopifyOrderForm.tsx` | `await validateSKU(normalizedSku)`, `await parseSKUGeneric(normalizedSku, sideExceptions)`, nowy import |
| `OrderHistoryPage.tsx` | `await parseSKUGeneric(order.sku, sideExceptions)`, nowy import (validateSKU nie jest tu używane) |

### Kolejność implementacji

1. Utwórz `skuParserGeneric.ts`
2. Zmień `skuValidator.ts` na async
3. Zaktualizuj importy i await w OrderForm, ShopifyOrderForm, OrderHistoryPage

