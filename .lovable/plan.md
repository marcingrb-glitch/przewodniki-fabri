

## Plan: Migracja parsingu SKU do bazy danych — ZREALIZOWANY ✅

### Zrealizowane kroki:

1. ✅ **Migracja SQL** — 3 nowe tabele (`sku_parse_rules`, `side_exceptions`, `seat_types`) z RLS i danymi początkowymi
2. ✅ **skuParser.ts** — usunięto hardkodowane `SIDE_EXCEPTIONS`, `parseSKU()` przyjmuje opcjonalny `sideExceptions` z DB
3. ✅ **skuDecoder.ts** — pobiera z DB: side_exceptions, sku_parse_rules (zero_padded), seat_types, extras; eksportuje `fetchSideExceptions()`
4. ✅ **Strona admina `/admin/sku-config`** — 3 tabki: Reguły parsowania, Wyjątki boczków, Typy siedzisk
5. ✅ **Routing + Sidebar** — dodano link i route
6. ✅ **mappings.ts** — oznaczono jako legacy fallback
