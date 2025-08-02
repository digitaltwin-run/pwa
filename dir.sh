#!/bin/bash

# setup.sh - Automatyczne tworzenie struktury Digital Twin IDE

echo "🏗️ Tworzenie struktury projektu Digital Twin IDE..."

# Główne foldery
mkdir -p digital-twin-ide/{css,js,components,assets/icons,docs}

cd digital-twin-ide || exit

# Puste pliki – główny projekt
touch index.html
touch css/styles.css
touch js/script.js
touch manifest.json
touch sw.js

# Puste komponenty SVG
touch components/motor.svg
touch components/sensor.svg
touch components/valve.svg

# Puste pliki assets
touch assets/icons/icon-192.png
touch assets/icons/icon-512.png

# Dokumentacja
touch docs/README.md
touch docs/COMPONENTS.md
touch docs/ARCHITECTURE.md

echo "✅ Struktura folderów i plików została utworzona!"
echo "📁 Projekt: digital-twin-ide/"
echo "📌 Uruchom: cd digital-twin-ide && npx http-server"