/**
 * Digital Twin IDE - Keyboard Shortcuts UI Component
 * 
 * Provides a visual overlay for showing available keyboard shortcuts
 * and allows users to discover and learn keyboard commands.
 * Integrates with keyboard-handler.js to dynamically display registered shortcuts.
 */

import { keyboardHandler } from './keyboard-handler.js';

export class KeyboardShortcutsUI {
    /**
     * Create a new keyboard shortcuts UI component
     * @param {Object} options - Configuration options
     */
    constructor(options = {}) {
        // Configuration
        this.options = {
            shortcutPanelId: 'keyboard-shortcuts-panel',
            toggleShortcut: 'F1',
            helpShortcut: 'Ctrl+?',
            showCategories: true,
            showDescriptions: true,
            theme: 'light',
            position: 'bottom-right',
            ...options
        };

        // State
        this.isVisible = false;
        this.isInitialized = false;
        this.categories = {
            'edit': {
                name: 'Edit',
                icon: '✏️',
                description: 'Basic editing operations'
            },
            'selection': {
                name: 'Selection',
                icon: '🔍',
                description: 'Component selection operations'
            },
            'file': {
                name: 'File',
                icon: '📁',
                description: 'File operations'
            },
            'history': {
                name: 'History',
                icon: '⏱️',
                description: 'Undo/redo operations'
            },
            'view': {
                name: 'View',
                icon: '👁️',
                description: 'View options'
            },
            'advanced': {
                name: 'Advanced',
                icon: '⚙️',
                description: 'Advanced operations'
            }
        };

        // Action to category mapping
        this.actionCategories = {
            'deleteSelection': 'edit',
            'selectAll': 'selection',
            'copy': 'edit',
            'paste': 'edit',
            'cut': 'edit',
            'undo': 'history',
            'redo': 'history',
            'save': 'file',
            'export': 'file',
            'clearSelection': 'selection',
            'duplicate': 'edit',
            'group': 'edit',
            'ungroup': 'edit',
            'zoomIn': 'view',
            'zoomOut': 'view',
            'resetZoom': 'view',
            'toggleGrid': 'view',
            'toggleHelp': 'view',
            'toggleProperties': 'view',
            'quickDelete': 'advanced'
        };

        // Action descriptions
        this.actionDescriptions = {
            'deleteSelection': 'Delete selected components',
            'selectAll': 'Select all components',
            'copy': 'Copy selected components',
            'paste': 'Paste components from clipboard',
            'cut': 'Cut selected components',
            'undo': 'Undo last action',
            'redo': 'Redo last undone action',
            'save': 'Save current project',
            'export': 'Export project',
            'clearSelection': 'Clear current selection',
            'duplicate': 'Duplicate selected components',
            'group': 'Group selected components',
            'ungroup': 'Ungroup selected components',
            'zoomIn': 'Zoom in canvas',
            'zoomOut': 'Zoom out canvas',
            'resetZoom': 'Reset zoom to 100%',
            'toggleGrid': 'Toggle grid visibility',
            'toggleHelp': 'Show/hide help panel',
            'toggleProperties': 'Show/hide properties panel',
            'quickDelete': 'Quick delete components'
        };

        // UI elements
        this.panel = null;
        this.toggleButton = null;

        // Initialize
        this.init();
    }

    /**
     * Initialize the keyboard shortcuts UI
     */
    init() {
        if (this.isInitialized) return;

        console.log('[KeyboardShortcutsUI] Initializing...');

        try {
            // Create UI elements
            this.createUI();

            // Register keyboard shortcuts to toggle the panel
            if (keyboardHandler) {
                keyboardHandler.registerShortcut(this.options.toggleShortcut, 'toggleHelp');
                keyboardHandler.registerShortcut(this.options.helpShortcut, 'toggleHelp');
            }

            // Set up event listeners
            this.setupEventListeners();

            // Register with component registry if available
            this.registerComponent();

            this.isInitialized = true;
            console.log('[KeyboardShortcutsUI] Initialized successfully');
        } catch (error) {
            console.error('[KeyboardShortcutsUI] Initialization failed:', error);
        }
    }

    /**
     * Create UI elements
     */
    createUI() {
        // Check if panel already exists
        let existingPanel = document.getElementById(this.options.shortcutPanelId);
        if (existingPanel) {
            console.log('[KeyboardShortcutsUI] Panel already exists, reusing');
            this.panel = existingPanel;
            return;
        }

        // Create panel
        this.panel = document.createElement('div');
        this.panel.id = this.options.shortcutPanelId;
        this.panel.className = `keyboard-shortcuts-panel ${this.options.position} ${this.options.theme}`;
        this.panel.setAttribute('aria-label', 'Keyboard shortcuts');
        this.panel.setAttribute('role', 'dialog');
        this.panel.setAttribute('aria-hidden', 'true');

        // Create header
        const header = document.createElement('div');
        header.className = 'keyboard-shortcuts-header';
        
        const title = document.createElement('h3');
        title.textContent = '⌨️ Keyboard Shortcuts';
        title.setAttribute('data-i18n', 'ui.keyboardShortcuts.title');
        
        const closeBtn = document.createElement('button');
        closeBtn.className = 'keyboard-shortcuts-close';
        closeBtn.textContent = '×';
        closeBtn.setAttribute('aria-label', 'Close');
        closeBtn.addEventListener('click', () => this.hide());
        
        header.appendChild(title);
        header.appendChild(closeBtn);
        this.panel.appendChild(header);

        // Create content container
        const content = document.createElement('div');
        content.className = 'keyboard-shortcuts-content';
        this.panel.appendChild(content);

        // Add footer with hint
        const footer = document.createElement('div');
        footer.className = 'keyboard-shortcuts-footer';
        
        const hint = document.createElement('p');
        hint.textContent = `Press ${this.options.toggleShortcut} to toggle this panel`;
        hint.setAttribute('data-i18n', 'ui.keyboardShortcuts.hint');
        
        footer.appendChild(hint);
        this.panel.appendChild(footer);

        // Add toggle button (small floating button)
        this.toggleButton = document.createElement('button');
        this.toggleButton.className = 'keyboard-shortcuts-toggle';
        this.toggleButton.textContent = '⌨️';
        this.toggleButton.setAttribute('aria-label', 'Show keyboard shortcuts');
        this.toggleButton.setAttribute('title', 'Show keyboard shortcuts (F1)');
        this.toggleButton.addEventListener('click', () => this.toggle());

        // Add elements to document
        document.body.appendChild(this.panel);
        document.body.appendChild(this.toggleButton);

        // Hide panel initially
        this.panel.style.display = 'none';
    }

    /**
     * Set up event listeners
     */
    setupEventListeners() {
        // Listen for keyboard handler events
        document.addEventListener('hmi-toggle-help', () => this.toggle());

        // Listen for key events directly (fallback if keyboard handler fails)
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isVisible) {
                this.hide();
                e.preventDefault();
            }
            
            // F1 key as backup for keyboard handler
            if (e.key === 'F1' && !e.ctrlKey && !e.shiftKey && !e.altKey) {
                this.toggle();
                e.preventDefault();
            }
        });

        // Listen for app theme changes
        window.addEventListener('theme-changed', (event) => {
            if (event.detail && event.detail.theme) {
                this.options.theme = event.detail.theme;
                this.updateTheme();
            }
        });
    }

    /**
     * Toggle panel visibility
     */
    toggle() {
        if (this.isVisible) {
            this.hide();
        } else {
            this.show();
        }
    }

    /**
     * Show the shortcuts panel
     */
    show() {
        if (!this.panel) return;

        // Update shortcuts before showing
        this.updateShortcutsList();
        
        // Show panel with fade-in animation
        this.panel.style.display = 'flex';
        this.panel.setAttribute('aria-hidden', 'false');
        
        // Add visible class after a small delay (for animation)
        setTimeout(() => {
            this.panel.classList.add('visible');
        }, 10);
        
        this.isVisible = true;
        
        // Hide toggle button when panel is visible
        if (this.toggleButton) {
            this.toggleButton.classList.add('hidden');
        }
        
        // Dispatch event
        this.dispatchEvent('keyboard-shortcuts-shown');
    }

    /**
     * Hide the shortcuts panel
     */
    hide() {
        if (!this.panel) return;
        
        // Hide panel with fade-out animation
        this.panel.classList.remove('visible');
        this.panel.setAttribute('aria-hidden', 'true');
        
        // Actually hide after animation completes
        setTimeout(() => {
            if (!this.isVisible) {
                this.panel.style.display = 'none';
            }
        }, 300); // Match CSS transition duration
        
        this.isVisible = false;
        
        // Show toggle button when panel is hidden
        if (this.toggleButton) {
            this.toggleButton.classList.remove('hidden');
        }
        
        // Dispatch event
        this.dispatchEvent('keyboard-shortcuts-hidden');
    }

    /**
     * Update the shortcuts list with current keyboard shortcuts
     */
    updateShortcutsList() {
        if (!this.panel) return;
        
        const contentEl = this.panel.querySelector('.keyboard-shortcuts-content');
        if (!contentEl) return;
        
        // Clear existing content
        contentEl.innerHTML = '';
        
        // Get shortcuts from keyboard handler
        let shortcuts = [];
        if (keyboardHandler) {
            shortcuts = keyboardHandler.getShortcuts();
        }
        
        if (shortcuts.length === 0) {
            const message = document.createElement('p');
            message.className = 'keyboard-shortcuts-message';
            message.textContent = 'No keyboard shortcuts registered';
            message.setAttribute('data-i18n', 'ui.keyboardShortcuts.noShortcuts');
            contentEl.appendChild(message);
            return;
        }
        
        // Group shortcuts by category if enabled
        if (this.options.showCategories) {
            // Create category containers
            const categoryContainers = {};
            
            // Initialize containers for each category
            Object.keys(this.categories).forEach(categoryId => {
                const category = this.categories[categoryId];
                
                const categoryEl = document.createElement('div');
                categoryEl.className = 'keyboard-shortcuts-category';
                categoryEl.dataset.category = categoryId;
                
                const categoryHeader = document.createElement('h4');
                categoryHeader.className = 'keyboard-shortcuts-category-header';
                categoryHeader.innerHTML = `${category.icon} ${category.name}`;
                
                categoryEl.appendChild(categoryHeader);
                
                if (this.options.showDescriptions) {
                    const categoryDesc = document.createElement('p');
                    categoryDesc.className = 'keyboard-shortcuts-category-description';
                    categoryDesc.textContent = category.description;
                    categoryEl.appendChild(categoryDesc);
                }
                
                const shortcutList = document.createElement('ul');
                shortcutList.className = 'keyboard-shortcuts-list';
                categoryEl.appendChild(shortcutList);
                
                categoryContainers[categoryId] = {
                    element: categoryEl,
                    list: shortcutList,
                    count: 0
                };
            });
            
            // Add "Other" category for uncategorized shortcuts
            categoryContainers.other = {
                element: document.createElement('div'),
                list: document.createElement('ul'),
                count: 0
            };
            categoryContainers.other.element.className = 'keyboard-shortcuts-category';
            categoryContainers.other.element.dataset.category = 'other';
            
            const otherHeader = document.createElement('h4');
            otherHeader.className = 'keyboard-shortcuts-category-header';
            otherHeader.innerHTML = '🔣 Other';
            categoryContainers.other.element.appendChild(otherHeader);
            
            categoryContainers.other.list.className = 'keyboard-shortcuts-list';
            categoryContainers.other.element.appendChild(categoryContainers.other.list);
            
            // Add shortcuts to appropriate categories
            shortcuts.forEach(shortcut => {
                const { keys, action } = shortcut;
                const category = this.actionCategories[action] || 'other';
                const item = this.createShortcutItem(keys, action);
                
                categoryContainers[category].list.appendChild(item);
                categoryContainers[category].count++;
            });
            
            // Add non-empty categories to the content
            Object.values(categoryContainers).forEach(container => {
                if (container.count > 0) {
                    contentEl.appendChild(container.element);
                }
            });
        } else {
            // Simple flat list of shortcuts
            const shortcutList = document.createElement('ul');
            shortcutList.className = 'keyboard-shortcuts-list';
            
            shortcuts.forEach(shortcut => {
                const { keys, action } = shortcut;
                const item = this.createShortcutItem(keys, action);
                shortcutList.appendChild(item);
            });
            
            contentEl.appendChild(shortcutList);
        }
    }

    /**
     * Create a shortcut list item
     * @param {string} keys - Keyboard shortcut keys
     * @param {string} action - Action associated with the shortcut
     * @returns {HTMLElement} List item element
     */
    createShortcutItem(keys, action) {
        const item = document.createElement('li');
        item.className = 'keyboard-shortcuts-item';
        
        // Format keys nicely
        const keySpan = document.createElement('span');
        keySpan.className = 'keyboard-shortcut-keys';
        
        // Split keys by + and create individual key elements
        const keyParts = keys.split('+');
        keyParts.forEach((key, index) => {
            const keyEl = document.createElement('kbd');
            keyEl.textContent = key;
            keySpan.appendChild(keyEl);
            
            if (index < keyParts.length - 1) {
                const plus = document.createTextNode(' + ');
                keySpan.appendChild(plus);
            }
        });
        
        // Action description
        const descSpan = document.createElement('span');
        descSpan.className = 'keyboard-shortcut-action';
        descSpan.textContent = this.actionDescriptions[action] || this.formatActionName(action);
        
        item.appendChild(keySpan);
        item.appendChild(descSpan);
        
        return item;
    }

    /**
     * Format action name for display
     * @param {string} action - Action name in camelCase
     * @returns {string} Formatted action name
     */
    formatActionName(action) {
        return action
            // Insert a space before all uppercase letters
            .replace(/([A-Z])/g, ' $1')
            // Make first character uppercase
            .replace(/^./, str => str.toUpperCase())
            // Remove leading space if present
            .trim();
    }

    /**
     * Update the theme of the panel
     */
    updateTheme() {
        if (this.panel) {
            // Remove all theme classes
            this.panel.classList.remove('light', 'dark', 'high-contrast');
            // Add current theme class
            this.panel.classList.add(this.options.theme);
        }
    }

    /**
     * Register with component registry
     */
    registerComponent() {
        try {
            // Register with component registry if available
            if (window.componentRegistry) {
                window.componentRegistry.register('keyboard-shortcuts-ui', () => {
                    return this;
                });
                console.log('[KeyboardShortcutsUI] Registered with component registry');
            }
        } catch (error) {
            console.warn('[KeyboardShortcutsUI] Could not register with component registry:', error);
        }
    }

    /**
     * Dispatch a custom event
     * @param {string} name - Event name
     * @param {Object} detail - Event details
     */
    dispatchEvent(name, detail = {}) {
        const event = new CustomEvent(name, {
            bubbles: true,
            cancelable: true,
            detail
        });
        
        window.dispatchEvent(event);
    }

    /**
     * Clean up resources
     */
    cleanup() {
        if (this.panel && this.panel.parentNode) {
            this.panel.parentNode.removeChild(this.panel);
        }
        
        if (this.toggleButton && this.toggleButton.parentNode) {
            this.toggleButton.parentNode.removeChild(this.toggleButton);
        }
        
        // Unregister shortcuts if keyboard handler is available
        if (keyboardHandler) {
            keyboardHandler.unregisterShortcut(this.options.toggleShortcut);
            keyboardHandler.unregisterShortcut(this.options.helpShortcut);
        }
        
        console.log('[KeyboardShortcutsUI] Cleaned up');
    }
}

// Add CSS styles dynamically
function addKeyboardShortcutsStyles() {
    const styleId = 'keyboard-shortcuts-styles';
    
    // Don't add styles if they already exist
    if (document.getElementById(styleId)) return;
    
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
        .keyboard-shortcuts-panel {
            position: fixed;
            z-index: 9999;
            background: #ffffff;
            border-radius: 8px;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
            width: 400px;
            max-width: 90vw;
            max-height: 80vh;
            overflow: hidden;
            display: flex;
            flex-direction: column;
            opacity: 0;
            transform: translateY(20px);
            transition: opacity 0.3s, transform 0.3s;
        }
        
        .keyboard-shortcuts-panel.visible {
            opacity: 1;
            transform: translateY(0);
        }
        
        .keyboard-shortcuts-panel.top-left {
            top: 20px;
            left: 20px;
        }
        
        .keyboard-shortcuts-panel.top-right {
            top: 20px;
            right: 20px;
        }
        
        .keyboard-shortcuts-panel.bottom-left {
            bottom: 20px;
            left: 20px;
        }
        
        .keyboard-shortcuts-panel.bottom-right {
            bottom: 20px;
            right: 20px;
        }
        
        .keyboard-shortcuts-panel.dark {
            background: #2c3e50;
            color: #ecf0f1;
        }
        
        .keyboard-shortcuts-panel.high-contrast {
            background: #000000;
            color: #ffffff;
        }
        
        .keyboard-shortcuts-header {
            padding: 12px 16px;
            border-bottom: 1px solid #e1e1e1;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .keyboard-shortcuts-panel.dark .keyboard-shortcuts-header {
            border-bottom-color: #546679;
        }
        
        .keyboard-shortcuts-header h3 {
            margin: 0;
            font-size: 16px;
            font-weight: 600;
        }
        
        .keyboard-shortcuts-close {
            background: none;
            border: none;
            font-size: 20px;
            cursor: pointer;
            color: inherit;
            padding: 0;
            width: 24px;
            height: 24px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 50%;
        }
        
        .keyboard-shortcuts-close:hover {
            background-color: rgba(0, 0, 0, 0.1);
        }
        
        .keyboard-shortcuts-panel.dark .keyboard-shortcuts-close:hover {
            background-color: rgba(255, 255, 255, 0.1);
        }
        
        .keyboard-shortcuts-content {
            padding: 16px;
            overflow-y: auto;
            flex: 1;
        }
        
        .keyboard-shortcuts-category {
            margin-bottom: 20px;
        }
        
        .keyboard-shortcuts-category-header {
            margin: 0 0 8px 0;
            font-size: 14px;
            font-weight: 600;
            color: #555;
            display: flex;
            align-items: center;
            gap: 6px;
        }
        
        .keyboard-shortcuts-panel.dark .keyboard-shortcuts-category-header {
            color: #ecf0f1;
        }
        
        .keyboard-shortcuts-category-description {
            margin: 0 0 8px 0;
            font-size: 12px;
            color: #777;
        }
        
        .keyboard-shortcuts-panel.dark .keyboard-shortcuts-category-description {
            color: #bdc3c7;
        }
        
        .keyboard-shortcuts-list {
            list-style: none;
            margin: 0;
            padding: 0;
        }
        
        .keyboard-shortcuts-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 6px 0;
            border-bottom: 1px solid #f0f0f0;
        }
        
        .keyboard-shortcuts-panel.dark .keyboard-shortcuts-item {
            border-bottom-color: #3a4d5f;
        }
        
        .keyboard-shortcuts-item:last-child {
            border-bottom: none;
        }
        
        .keyboard-shortcut-keys {
            display: flex;
            align-items: center;
            gap: 4px;
        }
        
        .keyboard-shortcut-keys kbd {
            background-color: #f8f8f8;
            border: 1px solid #ddd;
            border-radius: 3px;
            box-shadow: 0 1px 1px rgba(0, 0, 0, 0.2);
            color: #333;
            display: inline-block;
            font-size: 12px;
            font-family: monospace;
            line-height: 1;
            padding: 3px 6px;
            white-space: nowrap;
        }
        
        .keyboard-shortcuts-panel.dark .keyboard-shortcut-keys kbd {
            background-color: #3a4d5f;
            border-color: #2c3e50;
            color: #ecf0f1;
        }
        
        .keyboard-shortcut-action {
            color: #555;
            font-size: 13px;
        }
        
        .keyboard-shortcuts-panel.dark .keyboard-shortcut-action {
            color: #bdc3c7;
        }
        
        .keyboard-shortcuts-footer {
            padding: 12px 16px;
            border-top: 1px solid #e1e1e1;
            font-size: 12px;
            color: #777;
            text-align: center;
        }
        
        .keyboard-shortcuts-panel.dark .keyboard-shortcuts-footer {
            border-top-color: #546679;
            color: #bdc3c7;
        }
        
        .keyboard-shortcuts-toggle {
            position: fixed;
            bottom: 20px;
            right: 20px;
            width: 40px;
            height: 40px;
            border-radius: 50%;
            background: #2c3e50;
            color: white;
            display: flex;
            align-items: center;
            justify-content: center;
            border: none;
            cursor: pointer;
            box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
            z-index: 9990;
            transition: opacity 0.3s, transform 0.3s;
        }
        
        .keyboard-shortcuts-toggle:hover {
            transform: scale(1.1);
        }
        
        .keyboard-shortcuts-toggle.hidden {
            opacity: 0;
            pointer-events: none;
        }
    `;
    
    document.head.appendChild(style);
}

// Create and initialize global instance
let keyboardShortcutsUI;

// Initialize after DOM content is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Add styles
    addKeyboardShortcutsStyles();
    
    // Wait a moment to ensure keyboard handler is initialized
    setTimeout(() => {
        try {
            keyboardShortcutsUI = new KeyboardShortcutsUI();
            window.keyboardShortcutsUI = keyboardShortcutsUI;
            console.log('[KeyboardShortcutsUI] Global instance created');
        } catch (error) {
            console.error('[KeyboardShortcutsUI] Failed to create global instance:', error);
        }
    }, 500);
});

export default KeyboardShortcutsUI;
