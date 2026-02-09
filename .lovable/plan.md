

## Zachowanie małych liter "s" i "w" w kodach boczków

### Problem
Parser SKU na samym początku zamienia cały kod na wielkie litery (`toUpperCase()`), więc `B6sC` staje się `B6SC`. Kod boczka `B6S` jest potem wyświetlany wszędzie wielkimi literami.

### Rozwiązanie
Po sparsowaniu kodu boczka, zamienić sufiks `S` i `W` z powrotem na małe litery. Dzięki temu wewnętrznie kod będzie `B6s` / `B6w`, a we wszystkich miejscach (strona zamówienia, przewodniki PDF, etykiety) wyświetli się poprawnie z małą literą.

### Zmiany w plikach

**1. `src/utils/skuParser.ts`** (sekcja Side/Boczek, ok. linia 47)

Po dopasowaniu regexem, zamienić sufiks na małą literę:
```typescript
const sideMatch = part.match(/^B(\d+(?:S|W)?)([A-C])$/);
if (sideMatch) {
  // Zamień sufiks S/W na małą literę w kodzie boczka
  const rawCode = sideMatch[1];
  const code = rawCode.replace(/([SW])$/, (m) => m.toLowerCase());
  result.side = { code: `B${code}`, finish: sideMatch[2] };
  continue;
}
```

**2. `src/data/mappings.ts`** (sekcja SIDES)

Zmienić klucze z wielkich liter na małe:
- `B6S` na `B6s`
- `B6W` na `B6w`

```typescript
B6s: { frame: "B6/B8 [Iga\\Vamos]", name: "Iga A" },
B6w: { frame: "B10 [Iga\\Vamos Cienka]", name: "Iga A Wąska" },
```

### Efekt
Wszędzie gdzie pojawia się kod boczka (strona zamówienia, przewodniki sofy i fotela, etykiety, PDF dekodowania) będzie wyświetlany z małą literą: `B6sC`, `B6wA` itd. Nie trzeba zmieniać żadnych innych plików, bo wszystkie korzystają z `decoded.side.code` który już będzie miał poprawną formę.
