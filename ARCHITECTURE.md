# Digital Twin IDE - Architecture

## Overview

This document outlines the architecture of the Digital Twin IDE frontend, focusing on the component-based architecture and module organization.

## Directory Structure

```
├── html-modules/           # Self-contained UI components
│   ├── components/         # Reusable UI components (HTML+CSS+JS)
│   └── utils/              # Shared utilities and helpers
├── hmi/                    # HMI layer for component integration
│   └── index.js            # Main HMI controller
├── assets/                 # Static assets (images, fonts, etc.)
└── index.html              # Main entry point
```

## Component Architecture

### 1. HTML Modules (`html-modules/components/`)

Each component is a self-contained unit with:
- **HTML**: Structure and content
- **CSS**: Scoped styles
- **JavaScript**: Behavior and interactivity

**Example Structure:**
```html
<template id="my-component-template">
  <div class="my-component">
    <!-- Component content -->
  </div>

  <style>
    /* Scoped styles */
    .my-component { ... }
  </style>

  <script type="module">
    class MyComponent extends HTMLElement {
      // Component implementation
    }
    customElements.define('my-component', MyComponent);
  </script>
</template>
```

### 2. Component Loading

Components are loaded dynamically using `ComponentLoader`:

```javascript
// Load a single component
await ComponentLoader.loadComponent('component-name');

// Load multiple components
await ComponentLoader.loadComponents(['comp1', 'comp2']);
```

### 3. HMI Layer (`hmi/`)

The HMI layer is responsible for:
- Initializing components
- Managing component communication
- Handling global application state
- Coordinating between different parts of the UI

## Component Communication

Components communicate through DOM events:

```javascript
// Dispatching an event
document.dispatchEvent(new CustomEvent('component:selected', {
  detail: { componentId: '123', data: { ... } }
}));

// Listening for events
document.addEventListener('component:selected', (event) => {
  const { componentId, data } = event.detail;
  // Handle event
});
```

## Development Guidelines

1. **Component Creation**:
   - Use the `_component-template.html` as a starting point
   - Keep components focused and single-responsibility
   - Use semantic HTML and ARIA attributes for accessibility

2. **Styling**:
   - Use CSS custom properties for theming
   - Prefer flexbox/grid for layouts
   - Mobile-first responsive design

3. **JavaScript**:
   - Use ES modules
   - Follow web component best practices
   - Handle errors gracefully

## Best Practices

- **Performance**: Lazy load non-critical components
- **Accessibility**: Ensure keyboard navigation and screen reader support
- **Testing**: Write unit tests for component logic
- **Documentation**: Document component props, events, and usage examples

# Architektura Frontendu

## Modularne Komponenty UI (`html-modules/components/`)

- Każdy plik `.html` zawiera kompletnego komponenta:
  - `template` — struktura HTML
  - `style` — style CSS (zależności tematyczne, osadzone lub importowane)
  - `script` — logika JS związana z komponentem
  
- Komponenty rejestrowane i wykorzystywane niezależnie, samowystarczalne
- Pola i zdarzenia emitowane przez komponenty służą do komunikacji z warstwą HMI

## Warstwa HMI (`hmi/`)

- Moduły odpowiedzialne za sterowanie, integrację z urządzeniami, kontrolę i koordynację komponentów UI
- Zapewniają ustandaryzowane API do komunikacji i wymiany danych między modułami UI

## `index.html`

- Punkt startowy aplikacji
- Ładuje i osadza komponenty z `html-modules/components/`
- Inicjuje warstwę sterowania z `hmi/`
- Brak luźnych skryptów JS poza `hmi` i utils

## Zasady Modularności

- Unikaj duplikatów funkcji między modułami
- Używaj `html-modules/utils/` do wspólnych funkcji i helperów
- Stosuj jednolite nazwy i konwencje importów
```

## 3.3. TODO.md

# TODO – Refaktoryzacja i optymalizacja projektu

2. Refaktoryzować wszystkie UI związane skrypty JS w modularne pliki `.html` w `html-modules/components/`
3. Usunąć duplikaty i zastąpić je modułami HTML+JS
4. Zmodyfikować `index.html` do ładowania wyłącznie modułów HTML i inicjalizacji `hmi/`
5. Zaktualizować dokumentację (`README.md`, `ARCHITECTURE.md`), opisując modularność i wzorce
6. Wdrożyć ESLint i testy jednostkowe dla `hmi/` i komponentów
7. Przygotować skrypt do wykrywania i usuwania duplikatów JS
8. Monitorować i usuwać stare, nieużywane pliki (np. `.bak`, duplikaty)
```

# 4. Dodatkowe rekomendacje i optymalizacje

- Rozważ wykorzystanie **Web Components** lub natywnego mechanizmu Shadow DOM dla izolacji stylów i logiki komponentów.
- Automatyzuj budowanie i testowanie dzięki `npm scripts` lub systemowi CI.
- Używaj standardu eventów CustomEvent do komunikacji komponentów z warstwą HMI.
- Dokumentuj standardy kodowania i modularności, by ułatwić onboarding nowych deweloperów.
- Jeśli rozmiar aplikacji rośnie, rozważ zastosowanie bundlera z obsługą ES Modules (Rollup, Vite itp.).

Jeśli potrzebujesz mogę pomóc przygotować:

- Dynamiczny loader modułów HTML w `index.html`.
- Szablon modularnego komponentu HTML+CSS+JS (zgodnego z Twoim wzorcem).
- Konfigurację ESLint dla takiego projektu.
- Przykładowy plik `hmi/index.js` do zarządzania modułami i ich komunikacją.

