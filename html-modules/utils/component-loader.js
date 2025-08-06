/**
 * Component Loader Utility
 * Handles dynamic loading and initialization of HTML components
 * Using Web Components pattern with Shadow DOM
 */

import { ComponentIconLoader } from '../../js/utils/component-icon-loader.js';

export class ComponentLoader {
  /**
   * Get the icon for a component by ID
   * @param {string} componentId - Component ID
   * @returns {Promise<string>} SVG content as string or emoji fallback
   */
  static async getComponentIcon(componentId) {
    try {
      return await ComponentIconLoader.loadIcon(componentId);
    } catch (error) {
      console.error(`[ComponentLoader] Error loading icon for ${componentId}:`, error);
      return '🔧'; // Default fallback
    }
  }
  
  /**
   * Load a component by name and register it as a custom element
   * @param {string} componentName - Name of the component (without extension)
   * @returns {Promise<boolean>} Success status
   */
  static async loadComponent(componentName) {
    try {
      // Create the element tag name (convert to kebab case if needed)
      const tagName = componentName.includes('-') ? componentName : `app-${componentName}`;
      
      // Check if component is already registered
      if (customElements.get(tagName)) {
        console.log(`[ComponentLoader] Component ${tagName} already registered`);
        return true;
      }

      // Load the component HTML
      const response = await fetch(`/html-modules/components/${componentName}.html`);
      if (!response.ok) {
        throw new Error(`Failed to load component: ${componentName}`);
      }

      const html = await response.text();
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      
      // Get template, style and script from the document
      const template = doc.querySelector('template');
      const style = doc.querySelector('style');
      const script = doc.querySelector('script');
      
      if (!template) {
        throw new Error(`No template found in ${componentName}.html`);
      }
      
      // Execute the component's script
      if (script) {
        // Create a new script element to ensure proper execution
        const newScript = document.createElement('script');
        newScript.textContent = script.textContent;
        document.head.appendChild(newScript);
      } else {
        // If no script is found, create a default Web Component class
        this._createDefaultComponent(tagName, template, style);
      }
      
      // For safety, also add the template to document.body
      // This ensures templates are available in the document
      if (template && !document.querySelector(`template[data-component="${componentName}"]`)) {
        const clonedTemplate = template.cloneNode(true);
        clonedTemplate.setAttribute('data-component', componentName);
        document.body.appendChild(clonedTemplate);
      }
      
      console.log(`[ComponentLoader] ${componentName} (${tagName}) loaded successfully`);
      return true;
    } catch (error) {
      console.error(`[ComponentLoader] Error loading ${componentName}:`, error);
      return false;
    }
  }
  
  /**
   * Create a default component class if none is provided in the HTML
   * @private
   */
  static _createDefaultComponent(tagName, template, style) {
    if (customElements.get(tagName)) return;
    
    class DefaultComponent extends HTMLElement {
      constructor() {
        super();
        this.attachShadow({ mode: 'open' });
      }
      
      connectedCallback() {
        // Clone the template content
        if (template) {
          this.shadowRoot.appendChild(template.content.cloneNode(true));
        }
        
        // Add the style if provided
        if (style) {
          const styleEl = document.createElement('style');
          styleEl.textContent = style.textContent;
          this.shadowRoot.appendChild(styleEl);
        }
        
        // Dispatch ready event
        this.dispatchEvent(new CustomEvent(`${tagName}-ready`, { 
          bubbles: true, 
          composed: true 
        }));
      }
    }
    
    customElements.define(tagName, DefaultComponent);
    console.log(`[ComponentLoader] Default class registered for ${tagName}`);
  }

  static async loadComponents(componentNames) {
    const results = await Promise.all(
      componentNames.map(name => this.loadComponent(name))
    );
    return results.every(Boolean);
  }

  static async initializeHMI() {
    // This would be called from the main HMI initialization
    const requiredComponents = [
      // Core utilities (load first)
      'canvas-placement-helper',     // Smart component positioning
      'hmi-integration',            // HMI integration module for multi-modal interactions
      'svg-text-editor',            // In-place text editing for SVG elements

      // UI Components
      'header',                      // Navbar and controls
      'menu',                        // Menu interactions and panel visibility
      'simple-component-loader',     // Simple component loader for left sidebar
      'components-library-sidebar',  // Component library sidebar
      'properties-panel',           // Properties panel for editing
      'simulation-panel',           // Simulation controls
    ];
    
    return this.loadComponents(requiredComponents);
  }
  
  /**
   * Extract component ID from various formats
   * @param {string|object} source - Component source (path, id, or object)
   * @returns {string} Extracted component ID
   */
  static extractComponentId(source) {
    return ComponentIconLoader.extractComponentId(source);
  }
}

// Make it globally available for easier debugging
window.ComponentLoader = ComponentLoader;
