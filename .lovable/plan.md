

## Info o haku "Kod X → X" — gdzie umieścić

### Propozycja
Dodać krótki tekst informacyjny pod nagłówkiem strony `LabelTemplates.tsx`, w istniejącym paragrafie `text-muted-foreground`. Rozszerzyć go o wzmiankę o automatycznym skracaniu.

### Zmiana

**`src/pages/AdminPanel/LabelTemplates.tsx`** (linia 198-200):

Obecny tekst:
```
Konfiguracja etykiet generowanych dla każdego typu produktu
```

Nowy tekst:
```
Konfiguracja etykiet generowanych dla każdego typu produktu.
Pola zaczynające się od „Kod" (np. „Kod siedziska") są automatycznie skracane do samej nazwy (np. „Siedzisko: SD02ND").
```

Jeden plik, jedna linijka tekstu.

