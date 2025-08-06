/**
 * Component Loader Utility
 * Handles dynamic loading and initialization of HTML components
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
  
  static async loadComponent(componentName) {
    try {
      // Check if component is already loaded
      if (customElements.get(componentName)) {
        console.log(`[ComponentLoader] ${componentName} already loaded`);
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
      
      // Import the template
      const template = doc.querySelector('template');
      if (!template) {
        throw new Error(`No template found in ${componentName}.html`);
      }
      
      // Add the template to the main document
      document.body.appendChild(template.content.cloneNode(true));
      
      console.log(`[ComponentLoader] ${componentName} loaded successfully`);
      return true;
    } catch (error) {
      console.error(`[ComponentLoader] Error loading ${componentName}:`, error);
      return false;
    }
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
      'components-library-sidebar',
      'properties-panel',
      'simulation-panel',
      // Add other core components here
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
