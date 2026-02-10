

## Utworzenie Edge Function `fetch-shopify-order`

### Problem
Frontend wywoluje `supabase.functions.invoke("fetch-shopify-order")`, ale ta funkcja nie istnieje -- brak katalogu `supabase/functions/fetch-shopify-order/` i brak wpisu w `config.toml`. Stad blad "Failed to send a request to the Edge Function".

### Rozwiazanie

Utworzenie nowej edge function ktora:
1. Przyjmuje `{ order_number: string }` w body
2. Uwierzytelnia sie w Shopify (Client Credentials Grant -- ten sam wzorzec co `get-variant-image`)
3. Pobiera zamowienie z Shopify REST Admin API (`GET /admin/api/{version}/orders.json?name={order_number}`)
4. Mapuje line items na format `ShopifyOrderResponse` (SKU, title, variant_title, quantity, image_url, product_id, shortcode, is_mmq_product, properties)
5. Zwraca dane do frontendu

### Nowe pliki

**`supabase/functions/fetch-shopify-order/index.ts`**
- CORS headers (identyczne jak w get-variant-image)
- OPTIONS handler
- JWT verification (autoryzacja uzytkownika)
- Shopify auth: `POST https://{storeDomain}/admin/oauth/access_token` z client_credentials grant (uzywa istniejacych sekretow SHOPIFY_CLIENT_ID, SHOPIFY_CLIENT_SECRET, SHOPIFY_STORE_DOMAIN)
- Fetch zamowienia: `GET https://{storeDomain}/admin/api/{version}/orders.json?name={orderNumber}&status=any`
- Mapowanie line_items:
  - `line_item_id` = line_item.id
  - `sku` = line_item.sku
  - `title` = line_item.title
  - `variant_title` = line_item.variant_title
  - `quantity` = line_item.quantity
  - `image_url` = line_item.image?.src (zdjecie produktu z Shopify)
  - `product_id` = line_item.product_id
  - `shortcode` = wyciagniete z properties (jesli istnieje klucz np. "_mmq_shortcode" lub "shortcode")
  - `is_mmq_product` = true jesli shortcode znaleziony
  - `properties` = line_item.properties jako Record
- Logi diagnostyczne (console.log) na kazdym etapie

### Zmienione pliki

**`supabase/config.toml`** -- dodanie wpisu:
```text
[functions.fetch-shopify-order]
verify_jwt = false
```

### Sekrety
Wszystkie potrzebne sekrety juz istnieja: SHOPIFY_CLIENT_ID, SHOPIFY_CLIENT_SECRET, SHOPIFY_STORE_DOMAIN, SHOPIFY_API_VERSION.

### Szczegoly techniczne

Struktura odpowiedzi edge function:
```text
{
  "success": true,
  "order_name": "#1001",
  "line_items": [
    {
      "line_item_id": 123,
      "sku": "S01-PLMJIOE-...",
      "title": "Sofa 3-osobowa",
      "variant_title": "Szary / Nogi dab",
      "quantity": 1,
      "image_url": "https://cdn.shopify.com/...",
      "product_id": 456,
      "shortcode": "PLMJIOE",
      "is_mmq_product": true,
      "properties": { "kolor": "szary" }
    }
  ]
}
```

W przypadku bledu:
```text
{
  "success": false,
  "order_name": null,
  "line_items": [],
  "error": "Order not found"
}
```

