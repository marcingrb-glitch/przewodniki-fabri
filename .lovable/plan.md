

## Plan: Strona "Dekodowanie" w panelu administracyjnym

### Cel
Dodanie nowej strony `/admin/decoding-templates` w panelu admina z podglądem PDF dekodowania — analogicznie do strony Przewodników.

### Zmiana 1: AdminLayout.tsx — nowy link w sidebarze
Dodać `{ to: "/admin/decoding-templates", label: "🔍 Dekodowanie" }` w `skuConfigLinks` pod "Przewodniki".

### Zmiana 2: Nowy plik `src/pages/AdminPanel/DecodingTemplates.tsx`
Strona z:
- Wyborem serii (select) — pobiera przykładowe dane z DB dla wybranej serii
- Podglądem PDF dekodowania w `<iframe>` (jak w GuideTemplates/PDFPreview)
- Przyciskami "Podgląd" i "Pobierz" generującymi PDF przez `generateDecodingPDF`
- Przykładowe `DecodedSKU` budowane na podstawie danych z bazy (pierwszy rekord seats_sofa, sides, backrests itd. dla wybranej serii)

### Zmiana 3: App.tsx — routing
Dodać import `DecodingTemplates` i route `<Route path="decoding-templates" element={<DecodingTemplates />} />` wewnątrz admin routes.

### Pliki do edycji/utworzenia
- `src/pages/AdminPanel/AdminLayout.tsx` — 1 linia (nowy link)
- `src/pages/AdminPanel/DecodingTemplates.tsx` — nowy plik
- `src/App.tsx` — 2 linie (import + route)

