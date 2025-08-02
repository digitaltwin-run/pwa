# 🏗️ Architektura Digital Twin IDE

## 🔧 Główne komponenty

### 1. Lewy panel – Biblioteka komponentów
- Lista elementów SVG z `draggable="true"`
- `data-svg` wskazuje plik do załadowania

### 2. Środkowy panel – Plansza (canvas)
- SVG z siatką (pattern)
- Dynamiczne dodawanie komponentów
- Obsługa przeciągania, klikania, łączenia

### 3. Prawy panel – Edytor właściwości
- Generowany na podstawie `<metadata>`
- Obsługuje: tekst, liczby, kolory, boolean
- Zmiany aktualizują SVG i dane wewnętrzne

### 4. Panel symulacji
- Wykrywa komponenty z `value`, `minValue`, `maxValue`
- Symuluje zmieniające się dane
- Wizualizuje wartości

## 🔄 Przepływ danych

1. Użytkownik przeciąga komponent
2. `fetch()` ładuje SVG
3. Metadane są parsowane do JSON
4. Komponent umieszczany na planszy
5. Po kliknięciu – generowany formularz
6. Edycja → aktualizacja SVG + metadanych

## 💾 Eksport/Import
- Projekt zapisywany jako `.dtwin.json`
- Zawiera: komponenty, pozycje, połączenia, metadane
- Import odtwarza cały układ

## 🌐 PWA
- `manifest.json` – metadane aplikacji
- `sw.js` – Service Worker, cache plików
- Działa offline po pierwszym załadowaniu