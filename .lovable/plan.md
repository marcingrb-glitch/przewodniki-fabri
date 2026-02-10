

## Dodanie obslugi zamowien Shopify

### Co zostanie zrobione

Dodanie zakladek (Tabs) na stronie nowego zamowienia: "Zamowienia Shopify" i "Zamowienia reczne". Zamowienia reczne to istniejacy `OrderForm`. Zamowienia Shopify to nowy formularz pobierajacy dane z Shopify.

### Nowe pliki

1. **`src/types/shopifyOrder.ts`** -- typy TypeScript dla danych zamowienia Shopify (ShopifyLineItem, ShopifyOrderResponse, ShopifyOrderFormData)

2. **`src/utils/fetchShopifyOrder.ts`** -- funkcja wywolujaca edge function `fetch-shopify-order` przez `supabase.functions.invoke` oraz helper `getImageForLineItem`

3. **`src/components/orders/ShopifyLineItemsSelector.tsx`** -- komponent listy pozycji zamowienia z checkboxami, podgladem zdjec, badge'ami (Mimeeq, SKU, shortcode) i rozwijanymi szczegolami konfiguracji (Collapsible)

4. **`src/components/orders/ShopifyOrderForm.tsx`** -- glowny formularz: pole numeru zamowienia Shopify, przycisk "Pobierz", pole numeru wewnetrznego, lista pozycji (ShopifyLineItemsSelector), przycisk "Generuj przewodnik" (z TODO placeholder na dekoder)

5. **`src/components/orders/OrderTabs.tsx`** -- komponent zakladek (Tabs) laczacy ShopifyOrderForm i istniejacy OrderForm

### Zmienione pliki

6. **`src/pages/NewOrderPage.tsx`** -- zamiana `<OrderForm />` na `<OrderTabs />`, zachowanie layoutu z RecentOrders w bocznej kolumnie

### Wazne uwagi techniczne

- Edge function `fetch-shopify-order` jeszcze NIE istnieje -- komponenty sa przygotowane do jej wywolania, ale funkcja zostanie utworzona w kolejnym kroku
- Komponent ShopifyOrderForm ma placeholder TODO w sekcji generowania -- dekoder SKU zostanie podlaczony pozniej
- Istniejacy OrderForm i RecentOrders pozostaja bez zmian
- Wszystkie nowe komponenty umieszczone w `src/components/orders/` dla spojnosci z istniejaca struktura

