

## Plan: Dodanie pola "Wykończenie" do grupy głównej "Siedzisko"

### Co robimy
Dodajemy pole `seat.finish_name` (Wykończenie) do grupy `seat` (Siedzisko) w selektorze pól. Pole to już istnieje w grupie `seat_frame` — wystarczy dodać duplikat w grupie `seat`.

### Zmiany

#### `src/pages/AdminPanel/fieldResolver.ts`
Dodanie nowego wpisu w `AVAILABLE_FIELDS` zaraz po `seat.summary`:
```typescript
{ value: "seat.finish_name", label: "Wykończenie", group: "seat" },
```

Resolver i `decodingFieldResolver.ts` nie wymagają zmian — `seat.finish_name` jest już obsługiwany (zwraca `decoded.seat.finishName`), a przykładowa wartość w `resolveExampleValue` też już istnieje.

