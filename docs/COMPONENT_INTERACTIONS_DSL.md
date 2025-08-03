# System interakcji komponentów SVG - Dokumentacja DSL

## Wprowadzenie

System interakcji komponentów SVG (Component Interactions DSL) to lekki, deklaratywny język opisu powiązań i interakcji między komponentami w środowisku Digital Twin IDE. Pozwala na definiowanie reakcji i zależności między komponentami bezpośrednio w metadanych XML, co zapewnia transparentność, łatwą edycję i eksport/import całych układów z zachowaniem logiki interakcji.

## Koncepcja

System DSL opiera się na trzech głównych koncepcjach:

1. **Źródła zdarzeń (Event Sources)** - komponenty, które generują zdarzenia (np. przyciski, przełączniki)
2. **Odbiorcy zdarzeń (Event Targets)** - komponenty, które reagują na zdarzenia (np. silniki, diody LED)
3. **Powiązania (Bindings)** - deklaratywne definicje relacji między źródłami a odbiorcami

## Struktura metadanych XML

Interakcje są definiowane w sekcji `<interactions>` w metadanych komponentu:

```xml
<metadata>
    <component id="button-001" name="Push Button" type="button">
        <parameters>
            <!-- Standardowe parametry komponentu -->
        </parameters>
        <interactions>
            <binding targetId="motor-001" event="press" action="start" />
            <binding targetId="motor-001" event="release" action="stop" />
        </interactions>
    </component>
</metadata>
```

## Elementy DSL

### Element `<interactions>`

Kontener dla wszystkich definicji interakcji komponentu.

### Element `<binding>`

Definiuje pojedyncze powiązanie między komponentem źródłowym a docelowym.

Atrybuty:
- `targetId` (wymagany) - ID komponentu docelowego
- `event` (wymagany) - Nazwa zdarzenia generowanego przez komponent źródłowy
- `action` (wymagany) - Nazwa akcji do wykonania na komponencie docelowym
- `parameter` (opcjonalny) - Parametr przekazywany do akcji
- `condition` (opcjonalny) - Warunek logiczny, który musi być spełniony, aby powiązanie zadziałało

## Standardowe zdarzenia (Events)

Każdy typ komponentu może generować specyficzne zdarzenia:

### Button (Przycisk)
- `press` - Wciśnięcie przycisku
- `release` - Zwolnienie przycisku
- `toggle` - Przełączenie stanu (dla przycisków bistabilnych)

### Switch (Przełącznik)
- `on` - Przełączenie w stan włączony
- `off` - Przełączenie w stan wyłączony
- `toggle` - Przełączenie stanu

### Slider/Knob (Suwak/Pokrętło)
- `change` - Zmiana wartości
- `min` - Osiągnięcie wartości minimalnej
- `max` - Osiągnięcie wartości maksymalnej

## Standardowe akcje (Actions)

Akcje, które mogą być wykonywane na komponentach docelowych:

### Motor (Silnik)
- `start` - Uruchomienie silnika
- `stop` - Zatrzymanie silnika
- `setSpeed` - Ustawienie prędkości (wymaga parametru)
- `toggle` - Przełączenie stanu pracy

### LED (Dioda)
- `on` - Włączenie diody
- `off` - Wyłączenie diody
- `blink` - Włączenie migania
- `setColor` - Zmiana koloru (wymaga parametru)

### Counter (Licznik)
- `increment` - Zwiększenie wartości
- `decrement` - Zmniejszenie wartości
- `reset` - Resetowanie do wartości początkowej
- `setValue` - Ustawienie konkretnej wartości (wymaga parametru)

## Przykłady użycia

### Przykład 1: Przycisk uruchamiający silnik

```xml
<!-- W metadanych przycisku -->
<metadata>
    <component id="button-001" name="Start Button" type="button">
        <parameters>
            <label>Start</label>
            <color>#27ae60</color>
            <momentary>true</momentary>
        </parameters>
        <interactions>
            <binding targetId="motor-001" event="press" action="start" />
            <binding targetId="motor-001" event="release" action="stop" />
        </interactions>
    </component>
</metadata>
```

### Przykład 2: Przełącznik sterujący diodą LED

```xml
<!-- W metadanych przełącznika -->
<metadata>
    <component id="switch-001" name="Light Switch" type="switch">
        <parameters>
            <label>Light</label>
            <state>false</state>
        </parameters>
        <interactions>
            <binding targetId="led-001" event="on" action="on" />
            <binding targetId="led-001" event="off" action="off" />
        </interactions>
    </component>
</metadata>
```

### Przykład 3: Suwak sterujący prędkością silnika

```xml
<!-- W metadanych suwaka -->
<metadata>
    <component id="slider-001" name="Speed Control" type="slider">
        <parameters>
            <label>Speed</label>
            <min>0</min>
            <max>100</max>
            <value>50</value>
        </parameters>
        <interactions>
            <binding targetId="motor-001" event="change" action="setSpeed" parameter="value" />
            <binding targetId="led-001" event="max" action="on" />
            <binding targetId="led-001" event="min" action="off" />
        </interactions>
    </component>
</metadata>
```

## Implementacja w JavaScript

System DSL jest obsługiwany przez moduł `interactions.js`, który:

1. Wykrywa i przetwarza definicje interakcji w metadanych komponentów
2. Rejestruje odpowiednie nasłuchiwacze zdarzeń
3. Wykonuje akcje na komponentach docelowych w odpowiedzi na zdarzenia

## Rozszerzanie systemu

System można rozszerzać poprzez:

1. Dodawanie nowych typów zdarzeń dla istniejących komponentów
2. Dodawanie nowych typów akcji dla istniejących komponentów
3. Definiowanie zdarzeń i akcji dla nowych typów komponentów

## Najlepsze praktyki

1. Używaj jednoznacznych identyfikatorów komponentów
2. Unikaj cykli w powiązaniach (A → B → A)
3. Grupuj powiązane komponenty w logiczne jednostki
4. Dokumentuj złożone interakcje w komentarzach
5. Testuj interakcje przed eksportem układu
