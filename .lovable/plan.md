

## Problem

Nie wiesz kiedy checkbox "Warunkowa" powinien być zaznaczony. To normalne — system tego nie wyjaśnia.

## Jak to działa

"Warunkowa" = **drukuj tę etykietę tylko jeśli dany element istnieje w zamówieniu**.

Przykład: Sofa może mieć nóżki przy siedzisku, ale nie musi. Jeśli etykieta "Noga siedzisko" nie jest warunkowa, wydrukuje się zawsze — nawet gdy sofa nie ma nóżek. Z warunkiem `legHeights.sofa_seat` etykieta drukuje się **tylko gdy** zamówienie faktycznie ma nóżki siedziska.

Obecnie warunkowe są tylko etykiety nóżek (bo nie każdy produkt je ma):
- Noga siedzisko (sofa) → warunek: `legHeights.sofa_seat`
- Noga (pufa) → warunek: `pufaLegs`
- Noga (fotel) → warunek: `fotelLegs`

**Reguła**: Jeśli komponent **zawsze** występuje w danym typie produktu (np. siedzisko, oparcie) → **nie zaznaczaj**. Jeśli komponent jest **opcjonalny** (np. nóżki) → **zaznacz** i wybierz pole warunku.

## Propozycja usprawnienia

Zamiast zostawiać to do ręcznej decyzji, system może **automatycznie ustawiać warunek** na podstawie komponentu:
- Komponenty `leg_*` → automatycznie `is_conditional = true` z odpowiednim polem
- Pozostałe komponenty → `is_conditional = false`

Albo prostsze: **ukryć checkbox** i wyświetlić przy nóżkach info "⚡ Drukowana tylko gdy produkt ma nóżki" — bo w praktyce warunkowe są tylko etykiety nóżek.

### Zmiany

**`LabelTemplates.tsx`**:
- Ukryć ręczny checkbox warunkowy
- Automatycznie pokazywać badge "⚡ Warunkowa" przy komponentach `leg_*`
- Logikę `is_conditional` ustawiać automatycznie przy zmianie komponentu na `leg_*`

**`labels.ts`**: Bez zmian — `shouldShow()` nadal działa tak samo.

