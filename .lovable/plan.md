

## Przeniesienie pól `seat.front` i `seat.midStrip_yn` do grupy `seat_foam`

Użytkownik chce, aby pola **Front** i **Pasek środek** były w podgrupie **Siedzisko — Pianki** zamiast **Siedzisko — Stolarka**.

### Zmiana w `src/pages/AdminPanel/GuideTemplates.tsx`

Linie 67-68 — zmienić `group` z `"seat_frame"` na `"seat_foam"`:

```typescript
{ value: "seat.front", label: "Front", group: "seat_foam" },
{ value: "seat.midStrip_yn", label: "Pasek środek", group: "seat_foam" },
```

### Pliki do edycji
- `src/pages/AdminPanel/GuideTemplates.tsx` — 2 linie

