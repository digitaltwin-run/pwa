/**
 * Base HTML Module System for Digital Twin IDE PWA
 * Native HTML/JS/CSS modules without frameworks or build step
 * 
 * Features:
 * - Self-contained HTML modules
 * - i18n ready
 * - Event-driven communication
 * - CSS isolation via Shadow DOM
 * - No build step required
 */

export class ModuleBase extends HTMLElement {
    constructor() {
        super();
        
        // Create shadow DOM for CSS isolation
        this.attachShadow({ mode: 'open' });
        
        // Module state
        this.state = {};
        this.i18n = null;
        this.isInitialized = false;
        
        // Bind methods
        this.render = this.render.bind(this);
        this.setState = this.setState.bind(this);
        this.translate = this.translate.bind(this);
        
        console.log(`🧩 Module ${this.constructor.name} created`);
    }

    /**
     * Lifecycle: Called when element is connected to DOM
     */
    connectedCallback() {
        if (!this.isInitialized) {
            this.init();
            this.isInitialized = true;
        }
    }

    /**
     * Lifecycle: Called when element is disconnected from DOM
     */
    disconnectedCallback() {
        this.cleanup();
    }

    /**
     * Initialize module - override in subclasses
     */
    async init() {
        await this.loadI18n();
        this.render();
        this.bindEvents();
        console.log(`🧩 Module ${this.constructor.name} initialized`);
    }

    /**
     * Load i18n translations
     */
    async loadI18n() {
        if (window.i18nManager) {
            this.i18n = window.i18nManager;
        }
    }

    /**
     * Render module template - override in subclasses
     */
    render() {
        // Default empty render - subclasses should override
        this.shadowRoot.innerHTML = `
            <style>
                :host {
                    display: block;
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                }
            </style>
            <div class="module-placeholder">
                <p>Base module - override render() method</p>
            </div>
        `;
    }

    /**
     * Bind event listeners - override in subclasses
     */
    bindEvents() {
        // Override in subclasses
    }

    /**
     * Cleanup resources - override in subclasses
     */
    cleanup() {
        // Override in subclasses
    }

    /**
     * Update module state and re-render
     */
    setState(newState) {
        this.state = { ...this.state, ...newState };
        this.render();
        
        // Emit state change event
        this.dispatchEvent(new CustomEvent('state-changed', {
            detail: { state: this.state },
            bubbles: true
        }));
    }

    /**
     * Get current state
     */
    getState() {
        return { ...this.state };
    }

    /**
     * Translate text using i18n
     */
    translate(key, fallback = key) {
        if (this.i18n && this.i18n.translate) {
            return this.i18n.translate(key);
        }
        return fallback;
    }

    /**
     * Emit custom event
     */
    emit(eventName, detail = {}) {
        this.dispatchEvent(new CustomEvent(eventName, {
            detail,
            bubbles: true,
            composed: true // Pass through shadow DOM
        }));
    }

    /**
     * Listen to custom events
     * @param {string} eventName - Event name to listen for
     * @param {string|Function} selectorOrHandler - CSS selector for delegation or handler function
     * @param {Function} [handler] - Handler function (required if selector is provided)
     */
    on(eventName, selectorOrHandler, handler) {
        // Check if this is delegation pattern (3 arguments) or direct listener (2 arguments)
        if (typeof selectorOrHandler === 'string' && typeof handler === 'function') {
            // Event delegation pattern
            const selector = selectorOrHandler;
            this.addEventListener(eventName, (e) => {
                // Find all matching elements in shadow DOM
                const targets = this.shadowRoot.querySelectorAll(selector);
                // Check if the event target or any of its ancestors match the selector
                let currentElement = e.target;
                while (currentElement) {
                    if (Array.from(targets).includes(currentElement)) {
                        // Call handler with original event
                        handler.call(this, e);
                        return;
                    }
                    // Move up the DOM tree
                    currentElement = currentElement.parentElement;
                    // Stop when we reach shadowRoot
                    if (!currentElement || currentElement === this.shadowRoot) break;
                }
            });
        } else if (typeof selectorOrHandler === 'function') {
            // Standard event listener pattern
            this.addEventListener(eventName, selectorOrHandler);
        } else {
            console.error('Invalid arguments for on() method');
        }
    }

    /**
     * Remove event listener
     */
    off(eventName, handler) {
        this.removeEventListener(eventName, handler);
    }

    /**
     * Query selector within shadow DOM
     */
    $(selector) {
        return this.shadowRoot.querySelector(selector);
    }

    /**
     * Query selector all within shadow DOM
     */
    $$(selector) {
        return this.shadowRoot.querySelectorAll(selector);
    }

    /**
     * Create HTML element with attributes and content
     */
    createElement(tag, attributes = {}, content = '') {
        const element = document.createElement(tag);
        
        Object.entries(attributes).forEach(([key, value]) => {
            if (key === 'className') {
                element.className = value;
            } else if (key.startsWith('on') && typeof value === 'function') {
                element.addEventListener(key.slice(2).toLowerCase(), value);
            } else {
                element.setAttribute(key, value);
            }
        });
        
        if (content) {
            element.innerHTML = content;
        }
        
        return element;
    }

    /**
     * Apply i18n translations to all data-i18n elements
     */
    applyTranslations() {
        const elements = this.$$('[data-i18n]');
        elements.forEach(element => {
            const key = element.getAttribute('data-i18n');
            const translation = this.translate(key);
            if (translation !== key) {
                element.textContent = translation;
            }
        });
    }

    /**
     * Get module configuration from attributes
     */
    getConfig() {
        const config = {};
        Array.from(this.attributes).forEach(attr => {
            if (attr.name.startsWith('data-')) {
                const key = attr.name.replace('data-', '').replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
                config[key] = attr.value;
            }
        });
        return config;
    }

    /**
     * Validate required properties
     */
    validateConfig(requiredProps = []) {
        const config = this.getConfig();
        const missing = requiredProps.filter(prop => !(prop in config));
        
        if (missing.length > 0) {
            console.warn(`🧩 Module ${this.constructor.name} missing required props:`, missing);
            return false;
        }
        
        return true;
    }
}

/**
 * Helper function to register module as custom element
 */
export function registerModule(name, moduleClass) {
    if (!customElements.get(name)) {
        customElements.define(name, moduleClass);
        console.log(`🧩 Registered module: ${name}`);
    }
}

/**
 * Helper function to load module from HTML file
 */
export async function loadModule(modulePath) {
    try {
        const response = await fetch(modulePath);
        const html = await response.text();
        
        // Create temporary container to parse HTML
        const container = document.createElement('div');
        container.innerHTML = html;
        
        // Extract and execute module script
        const script = container.querySelector('script[type="module"]');
        if (script) {
            const blob = new Blob([script.textContent], { type: 'application/javascript' });
            const moduleUrl = URL.createObjectURL(blob);
            await import(moduleUrl);
            URL.revokeObjectURL(moduleUrl);
        }
        
        console.log(`🧩 Loaded module from: ${modulePath}`);
        return true;
    } catch (error) {
        console.error(`🧩 Failed to load module from ${modulePath}:`, error);
        return false;
    }
}
