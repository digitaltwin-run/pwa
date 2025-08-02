# 🏗️ Digital Twin IDE – Dokumentacja

To lekkie, offline-działające środowisko do tworzenia **cyfrowych bliźniaków (Digital Twin)** przy użyciu **SVG, HTML i JavaScript**. Projekt działa jako **PWA** i umożliwia budowanie interaktywnych schematów przemysłowych, układów czujników i symulacji.

## 🚀 Cechy
- Przeciąganie komponentów SVG
- Edycja parametrów z metadanych
- Łączenie komponentów liniami
- Eksport/Import `.dtwin.json`
- Eksport jako PNG/SVG
- Symulacja danych w czasie rzeczywistym
- PWA – działa offline

## 📁 Struktura projektu
```
digital-twin-ide/
├── index.html
├── css/styles.css
├── js/script.js
├── components/         # Komponenty SVG
├── assets/icons/       # Ikony dla PWA
├── manifest.json       # Konfiguracja PWA
├── sw.js               # Service Worker
└── docs/               # Ta dokumentacja
```

## 🛠️ Jak uruchomić?
1. Uruchom serwer: `npx http-server` lub `python -m http.server`
2. Otwórz: `http://localhost:8000`
3. Zainstaluj jako aplikację (Chrome: ikona instalacji)

> ⚠️ Nie działaj z `file://` – SVG nie załadują się przez `fetch`.

## 📬 Kontakt
Masz pomysł? Zgłoś błąd? Chcesz współtworzyć?
👉 kontakt@digitaltwin.run

