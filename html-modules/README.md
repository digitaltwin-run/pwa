# HTML Modules

This directory contains the modular UI components for the Digital Twin IDE, following a component-based architecture where each component is self-contained with its HTML structure, CSS styles, and JavaScript behavior.

## Directory Structure

```
html-modules/
├── components/           # Self-contained UI components
│   ├── _component-template.html  # Template for new components
│   ├── components-library-sidebar.html
│   ├── properties-panel.html
│   ├── simulation-panel.html
│   └── ...
├── utils/                # Shared utilities
│   ├── component-manager.js  # Manages component loading and dependencies
│   ├── base-component.js     # Base class for all components
│   └── i18n.js              # Internationalization manager
└── manifest.json         # Component metadata and dependencies
```

## Component Architecture

### Component Structure

Each component in the `components/` directory should follow this structure:

```html
<template id="component-name-template">
  <!-- HTML Structure -->
  <div class="component-name">
    <!-- Component content -->
  </div>

  <style>
    /* Scoped styles for this component */
    .component-name {
      /* Styles */
    }
  </style>

  <script type="module">
    import { BaseComponent } from '../utils/base-component.js';
    
    class ComponentName extends BaseComponent {
      constructor() {
        super();
        // Component initialization
      }
      
      initialize() {
        // Called when the component is connected to the DOM
        this.bindEvents();
        this.loadData();
      }
      
      bindEvents() {
        // Set up event listeners
      }
      
      loadData() {
        // Load any required data
      }
      
      render() {
        // Update the component's UI
      }
      
      // Lifecycle methods
      connectedCallback() {
        super.connectedCallback();
        console.log('ComponentName connected');
      }
      
      disconnectedCallback() {
        super.disconnectedCallback();
        console.log('ComponentName disconnected');
      }
    }
    
    // Register the custom element
    customElements.define('component-name', ComponentName);
  </script>
</template>
```

### Component Registration

All components must be registered in the `manifest.json` file with their metadata and dependencies:

```json
{
  "components": {
    "component-name": {
      "name": "ComponentName",
      "path": "/html-modules/components/component-name.html",
      "dependencies": ["other-component"],
      "category": "ui",
      "description": "Description of the component"
    }
  }
}
```

## Using Components

### Loading Components

Use the `ComponentManager` to load components dynamically:

```javascript
import componentManager from './utils/component-manager.js';

// Load a single component
await componentManager.loadComponent('component-name');

// Load multiple components
await componentManager.loadComponents(['component-1', 'component-2']);

// Load all components in a category
await componentManager.loadCategory('core');
```

### Internationalization (i18n)

All text in components should be internationalized using the `i18n` utility:

```javascript
import i18n from '../utils/i18n.js';

// In your component:
this.$.titleElement.textContent = i18n.t('component.title');

// With parameters
this.$.welcomeMessage.textContent = i18n.t('welcome.message', { username: 'John' });
```

In your HTML, use `data-i18n` attributes for static translations:

```html
<h1 data-i18n="component.title">Default Title</h1>
<p data-i18n="welcome.message" data-i18n-username="John">Welcome, {username}!</p>
```

## Development Guidelines

1. **Component Isolation**: Each component should be self-contained and not rely on global state.
2. **Event-Driven Communication**: Use custom events for inter-component communication.
3. **Responsive Design**: Ensure components work on all screen sizes.
4. **Accessibility**: Follow WCAG guidelines for accessibility.
5. **Performance**: Load resources asynchronously and minimize DOM manipulations.

## Adding a New Component

1. Create a new `.html` file in the `components/` directory.
2. Use the `_component-template.html` as a starting point.
3. Add your component to `manifest.json` with its dependencies.
4. Implement the component's functionality following the architecture guidelines.
5. Test the component in isolation and within the application.

## Best Practices

- **Single Responsibility**: Each component should have a single responsibility.
- **Reusability**: Design components to be reusable across the application.
- **Composition**: Compose complex UIs from simple, focused components.
- **Documentation**: Document component props, events, and usage examples.
- **Testing**: Write unit and integration tests for your components.

## Available Scripts

```bash
# Lint components
npm run lint:components

# Build components for production
npm run build:components

# Start development server
npm run dev
```

## Dependencies

- [Web Components](https://developer.mozilla.org/en-US/docs/Web/Web_Components)
- [Custom Elements](https://developer.mozilla.org/en-US/docs/Web/Web_Components/Using_custom_elements)
- [Shadow DOM](https://developer.mozilla.org/en-US/docs/Web/Web_Components/Using_shadow_DOM)
- [ES Modules](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules)
