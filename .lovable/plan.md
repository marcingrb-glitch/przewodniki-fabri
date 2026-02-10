

## Pełna Edge Function `get-variant-image` z integracją Shopify

### Co zostanie zrobione

Frontend (OrderForm) jest juz gotowy i wywoluje `POST /functions/v1/get-variant-image`. Brakuje samej funkcji backendowej i tabeli cache.

### Kroki implementacji

**1. Dodanie sekretow Shopify (4 sekrety)**

Potrzebne sa 4 sekrety w Lovable Cloud:
- `SHOPIFY_CLIENT_ID` -- Client ID z aplikacji Shopify
- `SHOPIFY_CLIENT_SECRET` -- Client Secret z aplikacji Shopify
- `SHOPIFY_STORE_DOMAIN` -- `0vpqnh-0p.myshopify.com`
- `SHOPIFY_API_VERSION` -- `2026-01`

Zostaniesz poproszony o podanie kazdego z nich.

**2. Tabela cache `variant_images`**

```text
variant_images
+-------------------+---------------------------+
| shortcode (PK)    | TEXT, NOT NULL, UNIQUE     |
| image_url         | TEXT, NOT NULL             |
| created_at        | TIMESTAMPTZ, DEFAULT now() |
+-------------------+---------------------------+
```

Polityka RLS: authenticated users moga SELECT; INSERT/UPDATE/DELETE tylko przez service role (edge function).

**3. Edge Function `get-variant-image/index.ts`**

Pelna logika:

```text
POST { shortcode } -->
  1. Weryfikacja JWT (getUser)
  2. Sprawdzenie cache (variant_images WHERE shortcode = ?)
     - Jesli znaleziono: zwroc { image_url, source: "cache" }
  3. Uzyskanie access token:
     POST https://shopify.com/authentication/oauth/token
     grant_type=client_credentials
     &client_id={SHOPIFY_CLIENT_ID}
     &client_secret={SHOPIFY_CLIENT_SECRET}
     &scope=read_files
  4. Zapytanie GraphQL Admin API:
     POST https://{store}/admin/api/{version}/graphql.json
     { files(first:1, query:"filename:*{shortcode}*") { edges { node { ... on MediaImage { image { url } } } } } }
  5. Zapis do cache variant_images
  6. Zwroc { image_url, source: "shopify" }
```

**4. Konfiguracja `supabase/config.toml`**

Dodanie sekcji `[functions.get-variant-image]` z `verify_jwt = false` (weryfikacja w kodzie).

### Szczegoly techniczne

- Edge function uzywa `SUPABASE_SERVICE_ROLE_KEY` do zapisu w cache (omija RLS)
- Shopify OAuth2 Client Credentials Grant nie wymaga interakcji uzytkownika
- Token Shopify jest pobierany przy kazdym uzyciu (krotkotrwale tokeny, bez cachowania)
- Timeout na zapytania Shopify: standardowy fetch (bez dodatkowego timeout)
- Obsluga bledow: jesli Shopify nie zwroci pliku, zwracany jest `{ image_url: null }`

