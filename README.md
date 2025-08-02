# pwa
pwa app for Digital Twin runtime

Digital Twin IDE – Dokumentacja

To prosty, ale zaawansowany edytor webowy do tworzenia **cyfrowych bliźniaków (Digital Twin)**
przy użyciu **SVG, HTML, CSS i JavaScript**. Projekt działa jako **PWA (Progressive Web App)** i pozwala:

- Przeciągać komponenty SVG na planszę
- Edytować ich parametry w czasie rzeczywistym
- Zapisywać stan wewnętrzny komponentów w metadanym SVG
- Działać offline dzięki Service Worker

---

## 🧱 Główne cechy

- ✅ **Modułowe komponenty SVG** z metadanymi
- ✅ **Edytor właściwości po prawej stronie**
- ✅ **Siatka (grid) na planszy**
- ✅ **Zmiana wyglądu SVG na podstawie parametrów**
- ✅ **PWA – można zainstalować jak aplikację**
- ✅ **Brak serwera – działa lokalnie**

---

## 🗂️ Struktura projektu

```
digital-twin-ide/
├── index.html              # Główny plik – interfejs edytora
├── css/styles.css          # Stylowanie UI
├── js/script.js            # Logika: przeciąganie, edycja, metadane
├── components/             # Komponenty SVG (silniki, czujniki)
├── assets/icons/           # Ikony dla PWA
├── manifest.json           # Metadane PWA
├── sw.js                   # Service Worker (offline)
└── docs/                   # Dokumentacja
```

---

## 🚀 Jak uruchomić?

Uruchom serwer lokalny:
   ```bash
   npx http-server
   ```
   lub
   ```bash
   python3 -m http.server 8008
   ```
4. Otwórz w przeglądarce: `http://localhost:8008`

> ⚠️ Wymagane: dostęp do plików przez serwer (nie działaj z `file://`) – fetch SVG nie zadziała bez serwera.

---

## 📖 Dokumentacja

- [ARCHITECTURE.md](ARCHITECTURE.md) – jak działa edytor
- [COMPONENTS.md](COMPONENTS.md) – jak budować komponenty SVG

---

## 🌐 Technologie

- **HTML5** – struktura
- **CSS3** – stylowanie
- **JavaScript (ES6+)** – logika
- **SVG** – grafika wektorowa
- **PWA** – offline, instalacja
- **Fetch API** – ładowanie komponentów
- **DOMParser** – parsowanie SVG

---

## 🎯 Przeznaczenie

Idealny do:
- Symulacji przemysłowych układów
- Szkoleń operatorów
- Prototypowania UI dla IoT
- Edukacji (cyfrowe bliźniaki maszyn)


## 🖼️ Przykład komponentu SVG: `components/sensor.svg`

```xml
<!-- components/sensor.svg -->
<svg xmlns="http://www.w3.org/2000/svg" width="60" height="60" viewBox="0 0 60 60">
  <metadata>
  {
    "id": "sensor-001",
    "name": "Temperature Sensor",
    "type": "sensor",
    "parameters": {
      "label": "Temp",
      "color": "#e74c3c",
      "size": 50,
      "unit": "°C",
      "minValue": 0,
      "maxValue": 100,
      "isActive": true
    }
  }
  </metadata>

  <rect id="body" x="5" y="5" width="50" height="50" rx="8" fill="#e74c3c" stroke="#c0392b" stroke-width="2"/>
  <text id="label" x="30" y="35" font-size="14" text-anchor="middle" fill="white">Temp</text>
  <circle cx="30" cy="50" r="4" fill="#ecf0f1"/>
</svg>
```

### 🔍 Jak działa?

- **`color`** → zmienia `fill` prostokąta
- **`label`** → zmienia tekst
- **`size`** → zmienia rozmiar i pozycję prostokąta
- **`isActive`** → zmienia przezroczystość całego komponentu



- Ładuje komponenty SVG z dysku
- Wstawia je na planszę z siatką
- Czyta ich `<metadata>`
- Generuje panel edycji
- Aktualizuje SVG i dane wewnętrzne w czasie rzeczywistym


























## 📄 3. Przykład wygenerowanego pliku `.dtwin.json`

Po eksporcie otrzymasz plik np.:

```json
{
  "version": "1.0",
  "createdAt": "2025-04-05T12:34:56.789Z",
  "components": [
    {
      "id": "sensor-001",
      "svgUrl": "components/sensor.svg",
      "x": 300,
      "y": 200,
      "metadata": {
        "id": "sensor-001",
        "name": "Temperature Sensor",
        "type": "sensor",
        "parameters": {
          "label": "Temp",
          "color": "#e74c3c",
          "size": 50,
          "unit": "°C",
          "minValue": 0,
          "maxValue": 100,
          "isActive": true
        }
      }
    },
    {
      "id": "motor-001",
      "svgUrl": "components/motor.svg",
      "x": 500,
      "y": 300,
      "metadata": {
        "id": "motor-001",
        "name": "Rotating Motor",
        "type": "motor",
        "parameters": {
          "color": "#3498db",
          "speed": 2,
          "label": "M1",
          "rotation": true
        }
      }
    }
  ]
}
```

---

## 📁 4. Aktualizacja `docs/ARCHITECTURE.md` – dodaj sekcję eksportu

Dodaj na końcu:

```markdown
## 💾 4. Eksport i Import

### Eksport
- Kliknij "Eksportuj projekt"
- Generowany jest plik `.dtwin.json`
- Zawiera:
  - ID komponentów
  - URL SVG
  - Pozycje (x, y)
  - Pełne metadane (w tym parametry)

### Import
- Kliknij "Importuj projekt"
- Wybierz plik `.dtwin.json`
- Układ jest odtwarzany:
  - Komponenty są ponownie ładowane z URL-i
  - Metadane są nadpisywane
  - Pozycje są przywracane

> ⚠️ Uwaga: pliki SVG muszą być dostępne pod tymi samymi ścieżkami!
```

---

## ✅ Podsumowanie nowych funkcji

| Funkcja | Opis |
|-------|------|
| 📥 **Import** | Wczytuje zapisany projekt z pliku `.dtwin.json` |
| 📤 **Eksport** | Zapisuje aktualny stan do pliku JSON |
| 🔁 **Pełne odtworzenie** | Komponenty, pozycje, metadane, kolory, etykiety |
| 📂 **Format pliku** | `.dtwin.json` – czytelny, przenośny, łatwy do wersjonowania |

---

## 🚀 Co możesz dodać dalej?

| Funkcja | Opis |
|-------|------|
| 💾 **Zapis do `localStorage`** | Automatyczny zapis/odczyt przy odświeżeniu |
| 🔗 **Łączenie komponentów** | Linie między nimi (przewody, strzałki) |
| 🔄 **Symulacja danych** | Symuluj zmieniające się wartości (np. temperatura) |
| 🧩 **Edytor komponentów** | Umożliwia dodawanie nowych parametrów w UI |
| 📊 **Eksport do PNG/SVG** | Zapis całej planszy jako obraz |


Oczywiście! Poniżej znajduje się **pełna dokumentacja projektu w formacie `README.md`**, gotowa do umieszczenia w folderze projektu. Zawiera opis, funkcje, architekturę, sposób użycia, strukturę komponentów i instrukcje dla deweloperów.

---

# 🏗️ Digital Twin IDE – Web-based Editor for Digital Twins

**Digital Twin IDE** to lekkie, offline-działające środowisko do tworzenia **cyfrowych bliźniaków (Digital Twin)** przy użyciu **SVG, HTML i JavaScript**. Projekt działa jako **PWA (Progressive Web App)** i umożliwia budowanie interaktywnych schematów przemysłowych, układów czujników, symulacji i paneli HMI.

---

## 🚀 Cechy

| Funkcja | Opis |
|-------|------|
| 🔌 **Przeciąganie komponentów** | Przeciągaj gotowe komponenty SVG na planszę |
| 🧩 **Komponenty z metadanymi** | Każdy SVG zawiera konfigurację w `<metadata>` (JSON) |
| ⚙️ **Edycja parametrów w czasie rzeczywistym** | Edytuj kolor, etykietę, rozmiar, wartości |
| 🔗 **Łączenie komponentów** | Tryb łączenia: rysuj linie i strzałki między elementami |
| 💾 **Eksport projektu** | Zapisuj całość jako `.dtwin.json` (z pozycjami, danymi) |
| 📥 **Import projektu** | Wczytaj zapisany projekt i kontynuuj pracę |
| 🖼️ **Eksport jako obraz** | Zapisz planszę jako PNG lub SVG |
| 📊 **Symulacja danych** | Automatyczna zmiana wartości (np. temperatura, ciśnienie) |
| ➕ **Dynamiczne parametry** | Dodawaj własne parametry w UI (np. `vibration`) |
| 🌐 **PWA (Progressive Web App)** | Działa offline, można zainstalować jak aplikację |
| 📏 **Siatka (raster)** | Wspomaganie układania komponentów |
| 🧑‍💻 **Open-source & modularny** | Łatwo rozwijać, dodawać nowe komponenty |

---

## 🖼️ Zrzut ekranu (przykładowy układ)

```
+---------------------+------------------------------+-----------------------+
| Biblioteka          |                              | Właściwości           |
| komponentów         |                              | komponentu            |
|                     |                              |                       |
| • Czujnik           |                              | Nazwa: Temperature    |
| • Silnik            |                              | Kolor: █ #e74c3c      |
| • Zawór             |                              | Wartość: 37           |
|                     |                              | [ Dodaj parametr ]    |
|                     |                              | [ Usuń ]              |
|                     |                              |                       |
|                     |                              |                       |
|                     |       PLANSZA (CANVAS)       |                       |
|                     |                              |                       |
|                     |   ┌──────────┐               |                       |
|                     |   │  Czujnik │───────▶        |                       |
|                     |   └──────────┘               |                       |
|                     |                              |                       |
|                     |   ┌──────────┐               |                       |
|                     |   │  Silnik  │               |                       |
|                     |   └──────────┘               |                       |
|                     |                              |                       |
+---------------------+------------------------------+-----------------------+
```

---

## 📁 Struktura projektu

```
digital-twin-ide/
├── index.html                  # Główny plik – interfejs edytora
├── css/
│   └── styles.css              # Stylowanie (może być pusty)
├── js/
│   └── script.js               # Cała logika (opcjonalnie – obecnie inline)
├── components/                 # Komponenty SVG
│   ├── sensor.svg              # Przykład: czujnik z metadanymi
│   ├── motor.svg               # Przykład: silnik
│   └── valve.svg               # Przykład: zawór
├── assets/icons/               # Ikony dla PWA
│   ├── icon-192.png
│   └── icon-512.png
├── manifest.json               # Konfiguracja PWA
├── sw.js                       # Service Worker (offline)
└── README.md                   # Ta dokumentacja
```

---

## 🛠️ Jak uruchomić?

1. **Pobierz lub utwórz projekt** (np. przez `git clone` lub ręcznie)
2. **Uruchom serwer lokalny** (nie działaj z `file://` – fetch SVG nie zadziała):

```bash
# Wymagany serwer HTTP (np. http-server)
npx http-server

# Lub Python
python3 -m http.server 8000
```

3. Otwórz w przeglądarce: `http://localhost:8000`

4. **Zainstaluj jako aplikację** (opcjonalnie):
   - W Chrome: Kliknij ikonę „Zainstaluj” w pasku adresu
   - Działa offline!

---

## 🧱 Jak budować komponenty SVG?

Każdy komponent to plik `.svg` z dwoma częściami:

### 1. `<metadata>` – dane konfiguracyjne

```xml
<metadata>
{
  "id": "sensor-001",
  "name": "Temperature Sensor",
  "type": "sensor",
  "parameters": {
    "label": "Temp",
    "color": "#e74c3c",
    "size": 50,
    "value": 25,
    "minValue": 0,
    "maxValue": 100,
    "unit": "°C",
    "isActive": true
  }
}
</metadata>
```

### 2. Ciało SVG – grafika

```xml
<rect id="body" x="5" y="5" width="50" height="50" rx="8" fill="#e74c3c"/>
<text id="label" x="30" y="20" font-size="12" fill="white" text-anchor="middle">Temp</text>
<text id="value" x="30" y="38" font-size="14" fill="white" text-anchor="middle">25°C</text>
```

> Używaj `id` w elementach, które chcesz edytować (np. `#body`, `#value`).

---

## 🔧 Jak działają funkcje?

### 🔗 Łączenie komponentów
- Kliknij przycisk **🔗 Łącz komponenty**
- Kliknij dwa komponenty – pojawi się strzałka
- Linie są zapisywane w eksporcie

### 💾 Eksport/Import `.dtwin.json`
- **Eksport**: Zapisuje:
  - ID, pozycję, URL SVG
  - Pełne metadane (w tym parametry)
  - Wszystkie połączenia
- **Import**: Odtwarza cały układ

### 📊 Symulacja danych
- Szuka komponentów z parametrem `value`
- Co sekundę losuje nową wartość w zakresie `minValue` – `maxValue`
- Aktualizuje SVG i panel symulacji
- Obsługuje również własne parametry (np. `pressure`)

### ➕ Dynamiczne parametry
- Kliknij komponent → „Dodaj parametr”
- Wpisz nazwę i typ
- Nowy parametr będzie dostępny w edycji i symulacji

### 🖼️ Eksport jako obraz
- **PNG**: obraz rastrowy, gotowy do druku
- **SVG**: wektorowy, edytowalny w programach graficznych

---

## 🧪 Przykład użycia

1. Stwórz schemat kotłowni:
   - Umieść czujniki temperatury
   - Połącz je z zaworami
   - Dodaj symulację zmieniającej się temperatury
2. Zapisz jako `kotlownia.dtwin.json`
3. Udostępnij zespołowi
4. Otwórz na tablecie – działa offline!

---

## 🧩 Rozszerzenia (plany)

| Funkcja | Opis |
|-------|------|
| 📈 Wykres czasu rzeczywistego | Wyświetlanie historii wartości (Chart.js) |
| 🔌 Integracja z MQTT/WebSocket | Podłączenie do prawdziwych czujników |
| 🔁 Undo/Redo | Cofanie i ponawianie akcji |
| 📂 Folder projektów | Zarządzanie wieloma plikami |
| 🎨 Edytor SVG w UI | Modyfikacja kształtów w przeglądarce |

---

## 📄 Licencja

Ten projekt jest **open-source** i możesz go używać, modyfikować i rozwijać bez ograniczeń.  
Zachęcamy do współtworzenia i dzielenia się komponentami!

---

## 🙌 Autor

Digital Twin IDE stworzony przez [Twoje Imię]  
Dla potrzeb symulacji przemysłowej, IoT i edukacji.

---

## 📬 Kontakt / Współpraca

Masz pomysł? Znalazłeś błąd? Chcesz dodać funkcję?

👉 Otwórz issue na GitHubie lub napisz: `kontakt@digitaltwin-ide.dev`

---

> ✅ **Gotowy do użycia. Po prostu uruchom i twórz!**  
> 🌐 Działa w każdej nowoczesnej przeglądarce: Chrome, Edge, Firefox, Safari.

---

Chcesz, żebym:
- wygenerował **gotowy ZIP projektu** z przykładowymi komponentami?
- dodał **obsługę historii (undo/redo)**?
- stworzył **dokumentację API komponentów**?

