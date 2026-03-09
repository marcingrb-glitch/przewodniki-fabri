

## Etap 3: Przebudowa Sidebaru AdminLayout

### Zmiany w `src/pages/AdminPanel/AdminLayout.tsx`

1. **Nowe grupy linków**:
   - **Wspólne**: Użytkownicy, Tkaniny, Wykończenia, Poduszki, Jaśki, Wałki (usunięte: Serie, Skrzynie)
   - **Specyfikacje produktów**: dynamicznie z `seriesList` → `/admin/spec/S1`, `/admin/spec/S2`
   - **Konfiguracja SKU**: Reguły parsowania, Wyjątki boczków, Skrzynie
   - **Ściągawki**: Generator ściągawek → `/admin/cheatsheets` (placeholder, Etap 4)

2. **Usunięte z sidebaru**: dropdown selektor serii, linki do Automaty, Siedziska Sofa/Pufa, Oparcia, Boczki, Nóżki, Dodatki

3. **Zachowane**: `selectedSeriesId` w state + `Outlet context` (dla starych stron po URL), `Select` import usunięty

4. **Default redirect**: `/admin` → `/admin/spec/S1` (zamiast `/admin/series`)

5. **Active state**: NavItem sprawdza `location.pathname.startsWith(to)` dla spec linków (bo mają sub-routes)

### Bez zmian
- `App.tsx` — wszystkie Route elementy zostają
- Pliki starych stron — bez zmian
- `SeriesSpecification.tsx` — bez zmian

