# 🧩 API Komponentów SVG

Każdy komponent to plik `.svg` z metadanymi i edytowalnymi elementami.

## 📄 Struktura

```xml
<svg ...>
  <metadata>
  {
    "id": "unikalny",
    "name": "Nazwa",
    "type": "sensor",
    "parameters": {
      "label": "Temp",
      "color": "#e74c3c",
      "value": 25
    }
  }
  </metadata>

  <rect id="body" fill="#e74c3c" ... />
  <text id="label">Temp</text>
  <text id="value">25</text>
</svg>
```

## 🔧 Parametry

| Parametr | Typ | Efekt |
|--------|-----|-------|
| `color` | `#hex` | Suwak koloru, zmienia `fill` |
| `value` | `number` | Symulacja, wyświetlanie |
| `minValue` / `maxValue` | `number` | Zakres symulacji |
| `isActive` | `boolean` | Włącza/wyłącza komponent |
| `size` | `number` | Skalowanie grafiki |

## 🖼️ Elementy z `id`

| `id` | Zastosowanie |
|-----|---------------|
| `body` | Tło, obudowa |
| `label` | Nazwa komponentu |
| `value` | Aktualna wartość |
| `param-*` | Dowolne pole (np. `param-pressure`) |

## 🛠️ Jak stworzyć?

1. Utwórz plik w `components/`
2. Dodaj `<metadata>` z JSON-em
3. Nadaj `id` kluczowym elementom
4. Dodaj do `index.html` w bibliotece