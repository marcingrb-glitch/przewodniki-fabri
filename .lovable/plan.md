

## Proporcjonalne skalowanie zdjecia w PDF

### Problem
Zdjecie wariantu sofy jest rozciagane do pelnych wymiarow pola (180x90mm), co znieksztalca proporcje obrazu.

### Rozwiazanie
Zmienimy logike wyswietlania zdjecia w `src/utils/pdfGenerators/decodingPDF.ts` (linie 33-49):

1. Po zaladowaniu zdjecia jako base64, odczytamy jego naturalne wymiary za pomoca `Image()` w przegladarce
2. Obliczymy proporcje (aspect ratio) zdjecia i porownamy z proporcjami dostepnego pola (180x90mm)
3. Jesli zdjecie jest szersze proporcjonalnie - skalujemy do szerokosci, centrujemy w pionie
4. Jesli zdjecie jest wyzsze proporcjonalnie - skalujemy do wysokosci, centrujemy w poziomie
5. Pole (ramka) pozostaje 180x90mm, ale zdjecie wewnatrz jest proporcjonalne i wycentrowane

### Szczegoly techniczne

Zmiana dotyczy jednego pliku: `src/utils/pdfGenerators/decodingPDF.ts`, sekcja ladowania obrazu (linie 33-49).

Nowa logika:
- Ladujemy base64 do obiektu `Image` zeby poznac `naturalWidth` i `naturalHeight`
- Obliczamy `imageAspectRatio = naturalWidth / naturalHeight`
- Obliczamy `areaAspectRatio = imageW / imageH` (180/90 = 2.0)
- Jesli `imageAspectRatio > areaAspectRatio`: zdjecie dopasowane do szerokosci, wycentrowane w pionie
- W przeciwnym razie: zdjecie dopasowane do wysokosci, wycentrowane w poziomie
- Rysujemy szare tlo pola, potem zdjecie na srodku, potem ramke

Reszta PDF (tabele, layout) bez zmian.

