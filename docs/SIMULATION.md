# 📊 Symulacja Danych

## Co robi?
Symuluje zmieniające się wartości w czasie rzeczywistym (np. temperatura, prędkość).

## Jak działa?
1. Szuka komponentów z:
   - `parameters.value`
   - `parameters.minValue`, `maxValue`
   - `isActive === true`
2. Co sekundę losuje nową wartość
3. Aktualizuje:
   - SVG (`#value`)
   - Metadane
   - Panel symulacji

## Jak przygotować komponent?

```json
"parameters": {
  "value": 25,
  "minValue": 0,
  "maxValue": 100,
  "unit": "°C"
}
```

```xml
<text id="value">25°C</text>
```

## Sterowanie
- ▶️ **Start** – uruchamia symulację
- ⏸️ **Stop** – zatrzymuje

## Rozszerzenia
Można dodać:
- Wykres czasu rzeczywistego
- Integrację z MQTT
- Historię wartości