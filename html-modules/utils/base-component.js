/**
 * Base Component
 * Provides common functionality for all UI components
 */

export class BaseComponent extends HTMLElement {
  constructor() {
    super();
    this.initialized = false;
    this._shadowRoot = this.attachShadow({ mode: 'open' });
    this._state = {};
    this._eventListeners = [];
  }

  /**
   * Component lifecycle method: called when the component is connected to the DOM
   */
  connectedCallback() {
    if (this.initialized) return;
    
    // Load the component's template
    const templateId = this.getAttribute('template-id') || `${this.tagName.toLowerCase()}-template`;
    const template = document.getElementById(templateId);
    
    if (template) {
      this._shadowRoot.appendChild(template.content.cloneNode(true));
      this.initialized = true;
      
      // Initialize the component
      this.initialize();
      
      // Set initial state
      this.render();
      
      // Dispatch initialized event
      this.dispatchEvent(new CustomEvent('component:initialized', { 
        bubbles: true,
        detail: { component: this } 
      }));
    } else {
      console.error(`[${this.tagName}] Template not found: ${templateId}`);
    }
  }

  /**
   * Component lifecycle method: called when the component is disconnected from the DOM
   */
  disconnectedCallback() {
    // Clean up event listeners
    this._eventListeners.forEach(({ target, event, handler, options }) => {
      target.removeEventListener(event, handler, options);
    });
    this._eventListeners = [];
    
    // Call onDisconnect if defined
    if (typeof this.onDisconnect === 'function') {
      this.onDisconnect();
    }
    
    this.dispatchEvent(new CustomEvent('component:disconnected', { 
      bubbles: true,
      detail: { component: this } 
    }));
  }

  /**
   * Initialize the component
   * Override this method in child classes
   */
  initialize() {
    // To be implemented by child classes
  }

  /**
   * Render the component
   * Override this method in child classes
   */
  render() {
    // To be implemented by child classes
  }

  /**
   * Update the component's state and re-render
   * @param {Object} newState - The new state to merge with the existing state
   */
  setState(newState) {
    this._state = { ...this._state, ...newState };
    this.render();
  }

  /**
   * Get the current state
   * @returns {Object} The current state
   */
  getState() {
    return { ...this._state };
  }

  /**
   * Add an event listener that will be automatically removed when the component is disconnected
   * @param {EventTarget} target - The target to add the listener to
   * @param {string} event - The event name
   * @param {Function} handler - The event handler
   * @param {Object} [options] - Event listener options
   */
  addAutoRemoveEventListener(target, event, handler, options) {
    if (!target || !event || !handler) return;
    
    target.addEventListener(event, handler, options);
    this._eventListeners.push({ target, event, handler, options });
  }

  /**
   * Query a selector within the component's shadow DOM
   * @param {string} selector - The CSS selector
   * @returns {Element|null} The first matching element, or null if not found
   */
  $(selector) {
    return this._shadowRoot.querySelector(selector);
  }

  /**
   * Query all elements matching a selector within the component's shadow DOM
   * @param {string} selector - The CSS selector
   * @returns {NodeList} A NodeList of matching elements
   */
  $$(selector) {
    return this._shadowRoot.querySelectorAll(selector);
  }

  /**
   * Show the component
   */
  show() {
    this.style.display = '';
  }

  /**
   * Hide the component
   */
  hide() {
    this.style.display = 'none';
  }

  /**
   * Toggle the component's visibility
   * @param {boolean} [force] - Force show or hide
   */
  toggle(force) {
    if (typeof force === 'boolean') {
      this.style.display = force ? '' : 'none';
    } else {
      this.style.display = this.style.display === 'none' ? '' : 'none';
    }
  }
}

// Register the base component if not already registered
if (!customElements.get('base-component')) {
  customElements.define('base-component', BaseComponent);
}
