# 💾 Eksport i Import projektu

## Eksport (.dtwin.json)
- Kliknij "Eksportuj (.dtwin)"
- Generowany jest plik z:
  - ID komponentów
  - URL SVG
  - Pozycje (x, y)
  - Pełne metadane
  - Połączenia (linie)

Przykład:
```json
{
  "version": "1.1",
  "components": [
    {
      "id": "sensor-001",
      "svgUrl": "components/sensor.svg",
      "x": 300,
      "y": 200,
      "metadata": { ... }
    }
  ],
  "connections": [
    { "x1": 330, "y1": 230, "x2": 500, "y2": 300 }
  ]
}
```

## Import
- Kliknij "Importuj (.dtwin)"
- Wybierz plik
- Układ jest odtwarzany
- SVG są ładowane z oryginalnych ścieżek

> ⚠️ Ścieżki do SVG muszą być takie same!