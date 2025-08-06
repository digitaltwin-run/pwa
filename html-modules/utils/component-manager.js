/**
 * Component Manager
 * Handles loading and managing UI components based on the manifest
 */

export class ComponentManager {
  constructor() {
    this.components = new Map();
    this.manifest = null;
    this.initialized = false;
  }

  /**
   * Initialize the component manager by loading the manifest
   * @returns {Promise<boolean>} True if initialization was successful
   */
  async initialize() {
    if (this.initialized) {
      console.log('[ComponentManager] Already initialized');
      return true;
    }

    try {
      const response = await fetch('/html-modules/manifest.json');
      if (!response.ok) {
        throw new Error(`Failed to load manifest: ${response.status} ${response.statusText}`);
      }
      
      this.manifest = await response.json();
      this.initialized = true;
      console.log('[ComponentManager] Initialized successfully');
      return true;
    } catch (error) {
      console.error('[ComponentManager] Initialization failed:', error);
      return false;
    }
  }

  /**
   * Get component information from the manifest
   * @param {string} componentId - The ID of the component to get
   * @returns {Object|null} The component info or null if not found
   */
  getComponentInfo(componentId) {
    if (!this.initialized || !this.manifest?.components?.[componentId]) {
      return null;
    }
    return { ...this.manifest.components[componentId], id: componentId };
  }

  /**
   * Load a component and its dependencies
   * @param {string} componentId - The ID of the component to load
   * @returns {Promise<boolean>} True if the component and its dependencies were loaded successfully
   */
  async loadComponent(componentId) {
    if (!this.initialized) {
      const initialized = await this.initialize();
      if (!initialized) return false;
    }

    // Check if component is already loaded
    if (this.components.has(componentId)) {
      console.log(`[ComponentManager] Component already loaded: ${componentId}`);
      return true;
    }

    const componentInfo = this.getComponentInfo(componentId);
    if (!componentInfo) {
      console.error(`[ComponentManager] Component not found in manifest: ${componentId}`);
      return false;
    }

    try {
      // Load dependencies first
      const dependencies = this.getDependencies(componentId);
      for (const depId of dependencies) {
        if (!this.components.has(depId)) {
          const loaded = await this.loadComponent(depId);
          if (!loaded) {
            throw new Error(`Failed to load dependency: ${depId} for component: ${componentId}`);
          }
        }
      }

      // Load the component
      const response = await fetch(componentInfo.path);
      if (!response.ok) {
        throw new Error(`Failed to load component: ${response.status} ${response.statusText}`);
      }

      const html = await response.text();
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      
      // Add the template to the document
      const template = doc.querySelector('template');
      if (!template) {
        throw new Error(`No template found in component: ${componentId}`);
      }
      
      // Check if the template already exists
      if (!document.getElementById(template.id)) {
        document.body.appendChild(template.content.cloneNode(true));
      }

      // Register the component if it's a custom element
      const componentName = template.id.replace('-template', '');
      if (!customElements.get(componentName)) {
        const componentClass = customElements.get(componentName) ||
          class extends HTMLElement {
            constructor() {
              super();
              this.attachShadow({ mode: 'open' });
              const template = document.getElementById(`${componentName}-template`);
              if (template) {
                this.shadowRoot.appendChild(template.content.cloneNode(true));
              }
            }
          };
        
        customElements.define(componentName, componentClass);
      }

      this.components.set(componentId, {
        ...componentInfo,
        loaded: true,
        timestamp: new Date().toISOString()
      });

      console.log(`[ComponentManager] Component loaded: ${componentId}`);
      return true;
    } catch (error) {
      console.error(`[ComponentManager] Error loading component ${componentId}:`, error);
      return false;
    }
  }

  /**
   * Get all dependencies for a component
   * @param {string} componentId - The ID of the component
   * @returns {string[]} Array of component IDs that are dependencies
   */
  getDependencies(componentId) {
    if (!this.initialized || !this.manifest) return [];
    
    const component = this.manifest.components[componentId];
    if (!component) return [];
    
    const dependencies = new Set();
    
    // Add explicit dependencies
    if (Array.isArray(component.dependencies)) {
      component.dependencies.forEach(dep => dependencies.add(dep));
    }
    
    // Add category dependencies
    if (this.manifest.dependencies) {
      const categoryDeps = this.manifest.dependencies[component.category] || [];
      categoryDeps.forEach(depCategory => {
        // Find all components in the dependent category
        Object.entries(this.manifest.components)
          .filter(([_, comp]) => comp.category === depCategory)
          .forEach(([id]) => dependencies.add(id));
      });
    }
    
    return Array.from(dependencies);
  }

  /**
   * Load multiple components
   * @param {string[]} componentIds - Array of component IDs to load
   * @returns {Promise<boolean>} True if all components were loaded successfully
   */
  async loadComponents(componentIds) {
    if (!Array.isArray(componentIds)) return false;
    
    const results = await Promise.all(
      componentIds.map(id => this.loadComponent(id))
    );
    
    return results.every(Boolean);
  }

  /**
   * Load all components in a category
   * @param {string} category - The category to load components from
   * @returns {Promise<boolean>} True if all components in the category were loaded successfully
   */
  async loadCategory(category) {
    if (!this.initialized || !this.manifest?.categories?.[category]) {
      console.error(`[ComponentManager] Invalid category: ${category}`);
      return false;
    }
    
    const componentIds = Object.entries(this.manifest.components)
      .filter(([_, comp]) => comp.category === category)
      .map(([id]) => id);
    
    return this.loadComponents(componentIds);
  }

  /**
   * Get all loaded components
   * @returns {Array} Array of loaded component information
   */
  getLoadedComponents() {
    return Array.from(this.components.entries()).map(([id, info]) => ({
      id,
      ...info
    }));
  }
}

// Create and export singleton instance
const componentManager = new ComponentManager();

export default componentManager;
