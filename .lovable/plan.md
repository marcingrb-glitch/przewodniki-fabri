

## Automatyczne mapowanie B6 na B6s

### Problem
Gdy w SKU pojawia się boczek `B6` (bez sufiksu `s` lub `w`), system traktuje go jako osobny kod. Użytkownik chce, żeby `B6` było automatycznie zamieniane na `B6s`.

### Rozwiązanie
Dodać jedną linię w parserze SKU: po sparsowaniu kodu boczka, jeśli kod to dokładnie `B6`, zamienić go na `B6s`.

### Szczegóły techniczne

**Plik: `src/utils/skuParser.ts`** (linia 51)

Po istniejącej zamianie sufiksów na małe litery, dodać mapowanie B6 -> B6s:

```typescript
const sideMatch = part.match(/^B(\d+(?:S|W)?)([A-C])$/);
if (sideMatch) {
  const rawCode = sideMatch[1];
  let code = rawCode.replace(/([SW])$/, (m) => m.toLowerCase());
  // B6 bez sufiksu -> automatycznie B6s
  if (code === "6") code = "6s";
  result.side = { code: `B${code}`, finish: sideMatch[2] };
  continue;
}
```

Dzięki temu:
- `B6C` w SKU -> sparsowane jako `B6s` z wykończeniem `C`
- `B6sC` w SKU -> nadal działa jak dotychczas
- `B6wA` w SKU -> nadal działa jak dotychczas
- Wszystkie dokumenty, przewodniki i etykiety automatycznie pokażą `B6s`

Zmiana dotyczy tylko jednego pliku, bo cała reszta systemu korzysta z wyniku parsera.

