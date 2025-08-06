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

## Migration Guide

When migrating existing code to the new architecture:

1. Move UI logic from `.js` files to component modules
2. Update imports to use the new component structure
3. Replace direct DOM manipulation with component methods
4. Use events for cross-component communication
