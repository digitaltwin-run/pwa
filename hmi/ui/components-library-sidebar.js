/**
 * Digital Twin IDE - Components Library Sidebar
 * 
 * UI component for the components library sidebar that displays all available components,
 * handles component selection, filtering, and dragging components to the canvas.
 * 
 * This is a refactored version of components-column-manager.js with improved
 * initialization timing, manager dependencies, and UI enhancements.
 */

export class ComponentsLibrarySidebar {
    /**
     * Create a new components library sidebar
     * @param {Object} options - Configuration options
     */
    constructor(options = {}) {
        // Configuration
        this.options = {
            listId: 'component-library', // The actual component list container in HTML
            searchId: 'component-search',
            categoryFilterId: 'category-filter',
            emptyStateMessage: 'No components available',
            dragEnabled: true,
            selectionEnabled: true,
            ...options
        };

        // State
        this.isInitialized = false;
        this.isLoading = true;
        this.components = [];
        this.filteredComponents = [];
        this.selectedComponentIds = new Set();
        this.searchQuery = '';
        this.currentCategory = 'all';
        
        // References to other managers (will be resolved later)
        this.componentManager = null;
        this.canvasSelectionManager = null;
        
        // Component icons mapping
        this.componentIcons = {
            // Default icons as fallback
            'led': '💡',
            'pump': '🔧',
            'valve': '🔘',
            'sensor': '📊',
            'display': '📺',
            'button': '🔲',
            'motor': '⚙️',
            'tank': '🛢️',
            'pipe': '🔷',
            'default': '📦'
        };

        // DOM elements (will be populated in init())
        this.sidebarElement = null;
        this.listElement = null;
        this.searchElement = null;
        this.categoryFilterElement = null;

        // Initialize
        this.init();
    }

    /**
     * Initialize the component
     */
    async init() {
        // Get DOM elements
        this.sidebarElement = document.querySelector('.sidebar.left'); // Use class selector for sidebar
        this.listElement = document.getElementById(this.options.listId);
        this.searchElement = document.getElementById(this.options.searchId);
        this.categoryFilterElement = document.getElementById(this.options.categoryFilterId);

        if (!this.listElement) {
            const errorMsg = `[ComponentsLibrarySidebar] Component list element not found: ${this.options.listId}`;
            console.error(errorMsg);
            return;
        }
        
        console.log('[ComponentsLibrarySidebar] DOM elements found:', {
            sidebar: !!this.sidebarElement,
            list: !!this.listElement,
            search: !!this.searchElement,
            categoryFilter: !!this.categoryFilterElement
        });

        try {
            // Show loading state while initializing
            this.showLoadingState();
            
            // Wait for managers to be available
            console.log('[ComponentsLibrarySidebar] Waiting for managers...');
            await this.waitForManagers();
            
            // If we still don't have managers, show a warning but continue
            if (!this.componentManager || !this.canvasSelectionManager) {
                console.warn('[ComponentsLibrarySidebar] Some managers not available, continuing with limited functionality');
                this.showErrorState('Some features unavailable - refreshing may help');
            }

            console.log('[ComponentsLibrarySidebar] Initializing UI components');
            this.setupEventListeners();
            
            // Try to load component icons, but don't fail if it doesn't work
            try {
                await this.loadComponentIconsFromManifest();
            } catch (iconError) {
                console.warn('[ComponentsLibrarySidebar] Failed to load component icons:', iconError);
                // Continue without icons
            }
            
            console.log('[ComponentsLibrarySidebar] Initialization complete');
            this.isInitialized = true;
            
            // Refresh the component list
            this.refreshComponentsList();
            
        } catch (error) {
            console.error('[ComponentsLibrarySidebar] Initialization error:', error);
            this.showErrorState('Failed to initialize. ' + (error.message || ''));
            
            // Still try to set up basic functionality
            try {
                this.setupEventListeners();
                this.refreshComponentsList();
            } catch (e) {
                console.error('[ComponentsLibrarySidebar] Error in fallback initialization:', e);
            }
        }

        // Register with component registry if available
        try {
            this.registerComponent();
        } catch (e) {
            console.warn('[ComponentsLibrarySidebar] Failed to register component:', e);
        }
    }

    /**
     * Wait for required managers to be available
     * @returns {Promise} Promise that resolves when managers are ready
     */
    waitForManagers() {
        return new Promise((resolve) => {
            console.log('[ComponentsLibrarySidebar] Checking for managers...');
            
            // First check if managers are already available
            if (window.componentManager && window.canvasSelectionManager) {
                console.log('[ComponentsLibrarySidebar] Managers already available');
                this.componentManager = window.componentManager;
                this.canvasSelectionManager = window.canvasSelectionManager;
                resolve();
                return;
            }

            console.log('[ComponentsLibrarySidebar] Waiting for global managers...');
            
            // Set a timeout for the entire operation
            const timeout = setTimeout(() => {
                console.warn('[ComponentsLibrarySidebar] Manager wait timeout, continuing with available managers');
                this.componentManager = window.componentManager || this.componentManager;
                this.canvasSelectionManager = window.canvasSelectionManager || this.canvasSelectionManager;
                resolve(); // Resolve anyway to prevent blocking
            }, 10000); // 10 second timeout

            // Listen for global managers ready event
            const onManagersReady = () => {
                console.log('[ComponentsLibrarySidebar] Global managers ready event received');
                clearTimeout(timeout);
                this.componentManager = window.componentManager;
                this.canvasSelectionManager = window.canvasSelectionManager;
                
                if (this.componentManager && this.canvasSelectionManager) {
                    console.log('[ComponentsLibrarySidebar] All managers available');
                    document.removeEventListener('globalManagersReady', onManagersReady);
                    resolve();
                } else {
                    console.warn('[ComponentsLibrarySidebar] globalManagersReady event fired but some managers are still missing');
                    // Continue with what we have
                    resolve();
                }
            };

            document.addEventListener('globalManagersReady', onManagersReady, { once: true });
        });
    }

    /**
     * Set up event listeners
     */
    setupEventListeners() {
        // Listen for component addition events
        document.addEventListener('component-added', this.handleComponentAdded.bind(this));
        document.addEventListener('components-loaded', this.refreshComponentsList.bind(this));
        
        // Set up search functionality
        if (this.searchElement) {
            this.searchElement.addEventListener('input', () => {
                this.searchQuery = this.searchElement.value.toLowerCase();
                this.filterComponents();
            });
        }
        
        // Set up category filter
        if (this.categoryFilterElement) {
            this.categoryFilterElement.addEventListener('change', () => {
                this.currentCategory = this.categoryFilterElement.value;
                this.filterComponents();
            });
        }

        // Initial refresh
        this.refreshComponentsList();
    }

    /**
     * Load component icons from the manifest file
     * @returns {Promise} Promise that resolves when icons are loaded
     */
    async loadComponentIconsFromManifest() {
        try {
            const response = await fetch('/js/components/manifest.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const manifest = await response.json();
            
            // Update component icons from manifest
            if (manifest.components && Array.isArray(manifest.components)) {
                manifest.components.forEach(component => {
                    if (component.icon && component.type) {
                        this.componentIcons[component.type] = component.icon;
                    } else if (component.type) {
                        // If no icon is specified, use the first character of the type as an icon
                        this.componentIcons[component.type] = component.type.charAt(0).toUpperCase();
                    }
                });
                
                console.log('[ComponentsLibrarySidebar] Loaded component icons from manifest');
                
                // Refresh the components list
                this.refreshComponentsList();
                
                return true;
            }
        } catch (error) {
            console.error('[ComponentsLibrarySidebar] Error loading component icons:', error);
            this.showErrorState('Failed to load component icons');
            throw error;
        }
    }

    /**
     * Load component templates from components.json
     * @returns {Promise} Promise that resolves when templates are loaded
     */
    async loadComponentTemplates() {
        try {
            const response = await fetch('/components.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (data.components && Array.isArray(data.components)) {
                this.components = data.components.map(component => ({
                    id: component.id,
                    name: component.name,
                    svg: component.svg,
                    type: this.extractTypeFromSvg(component.svg),
                    category: component.category || 'general',
                    template: true // Mark as template for dragging
                }));
                
                console.log(`[ComponentsLibrarySidebar] Loaded ${this.components.length} component templates`);
                return true;
            } else {
                throw new Error('Invalid components.json format');
            }
        } catch (error) {
            console.error('[ComponentsLibrarySidebar] Error loading component templates:', error);
            this.components = [];
            throw error;
        }
    }
    
    /**
     * Extract component type from SVG filename
     * @param {string} svgPath - Path to SVG file
     * @returns {string} Component type
     */
    extractTypeFromSvg(svgPath) {
        const filename = svgPath.split('/').pop().replace('.svg', '');
        return filename.toLowerCase();
    }

    /**
     * Get component name from various sources
     * @param {HTMLElement} component - Component element
     * @param {string} type - Component type
     * @returns {string} Component name
     */
    getComponentName(component, type) {
        // First check for explicit name attribute
        if (component.getAttribute('data-name')) {
            return component.getAttribute('data-name');
        }
        
        // Check for label
        if (component.getAttribute('data-label')) {
            return component.getAttribute('data-label');
        }
        
        // Check for aria-label
        if (component.getAttribute('aria-label')) {
            return component.getAttribute('aria-label');
        }
        
        // Check for title
        if (component.getAttribute('title')) {
            return component.getAttribute('title');
        }
        
        // Check for ID and make it readable
        if (component.id) {
            return component.id.replace(/-/g, ' ').replace(/_/g, ' ').replace(/([A-Z])/g, ' $1')
                .replace(/^\w/, c => c.toUpperCase());
        }
        
        // Look for svg title element
        const titleElement = component.querySelector('title');
        if (titleElement && titleElement.textContent) {
            return titleElement.textContent;
        }
        
        // Look for text or tspan elements
        const textElement = component.querySelector('text, tspan');
        if (textElement && textElement.textContent) {
            return textElement.textContent.trim();
        }
        
        // Finally, use type with ID or generic name
        if (component.getAttribute('data-id')) {
            return `${type.charAt(0).toUpperCase() + type.slice(1)} ${component.getAttribute('data-id')}`;
        }
        
        return `${type.charAt(0).toUpperCase() + type.slice(1)}`;
    }

    /**
     * Refresh the components list
     */
    refreshComponentsList() {
        console.log('[ComponentsLibrarySidebar] Refreshing components list...');
        
        this.isLoading = true;
        this.showLoadingState();
        
        // Apply filters to existing components
        this.filterComponents();
        
        this.isLoading = false;
        
        console.log(`[ComponentsLibrarySidebar] Refreshed: ${this.components.length} total, ${this.filteredComponents.length} visible`);
        
        // Dispatch event
        this.dispatchEvent('components-library-refreshed', {
            totalCount: this.components.length,
            visibleCount: this.filteredComponents.length
        });
    }

    /**
     * Filter components based on current search query and category
     */
    filterComponents() {
        if (!this.components || !this.components.length) {
            this.filteredComponents = [];
            this.renderComponentsList();
            return;
        }
        
        this.filteredComponents = this.components.filter(component => {
            // Apply search filter if query exists
            const matchesSearch = !this.searchQuery || 
                component.name.toLowerCase().includes(this.searchQuery) || 
                component.type.toLowerCase().includes(this.searchQuery) ||
                component.id.toLowerCase().includes(this.searchQuery);
            
            // Apply category filter if not 'all'
            const matchesCategory = this.currentCategory === 'all' || 
                component.category === this.currentCategory;
                
            return matchesSearch && matchesCategory;
        });
        
        this.renderComponentsList();
    }

    /**
     * Render the filtered components list
     */
    renderComponentsList() {
        if (!this.listElement) return;
        
        // Clear current list
        this.listElement.innerHTML = '';
        
        if (this.isLoading) {
            this.showLoadingState();
            return;
        }
        
        if (!this.filteredComponents.length) {
            this.showEmptyState();
            return;
        }
        
        // Create component items
        this.filteredComponents.forEach(component => {
            const itemElement = this.createComponentItemElement(component);
            this.listElement.appendChild(itemElement);
        });
    }

    /**
     * Create a component item element
     * @param {Object} component - Component data
     * @returns {HTMLElement} Component item element
     */
    createComponentItemElement(component) {
        const item = document.createElement('div');
        item.className = 'component-item component-template';
        item.dataset.componentId = component.id;
        item.dataset.componentType = component.type;
        item.dataset.componentSvg = component.svg;
        
        // Make draggable
        item.draggable = true;
        
        // Get component icon
        const icon = this.componentIcons[component.type] || this.componentIcons.default;
        
        // Create item HTML (no checkboxes for templates)
        item.innerHTML = `
            <div class="component-item-header">
                <span class="component-icon">${icon}</span>
                <span class="component-name">${component.name}</span>
            </div>
            <div class="component-item-actions">
                <button class="component-add-btn" title="Add to canvas">➕</button>
                <button class="component-preview-btn" title="Preview component">👁️</button>
            </div>
        `;
        
        // Set up drag event listeners
        item.addEventListener('dragstart', (event) => {
            event.dataTransfer.setData('text/plain', JSON.stringify({
                type: 'component-template',
                id: component.id,
                name: component.name,
                svg: component.svg,
                componentType: component.type
            }));
            item.classList.add('dragging');
        });
        
        item.addEventListener('dragend', () => {
            item.classList.remove('dragging');
        });
        
        // Set up action button listeners
        const addBtn = item.querySelector('.component-add-btn');
        if (addBtn) {
            addBtn.addEventListener('click', (event) => {
                event.stopPropagation();
                this.addComponentToCanvas(component);
            });
        }
        
        const previewBtn = item.querySelector('.component-preview-btn');
        if (previewBtn) {
            previewBtn.addEventListener('click', (event) => {
                event.stopPropagation();
                this.previewComponent(component);
            });
        }
        
        // Set up click handler for the entire item (add to canvas)
        item.addEventListener('click', (event) => {
            // Don't handle click if it's on a button
            if (event.target.tagName === 'BUTTON') {
                return;
            }
            
            // Add component to canvas
            this.addComponentToCanvas(component);
        });
        
        return item;
    }

    /**
     * Add component to canvas
     * @param {Object} component - Component template data
     */
    addComponentToCanvas(component) {
        // Dispatch event to add component to canvas
        const addEvent = new CustomEvent('add-component-to-canvas', {
            detail: {
                template: component,
                position: { x: 100, y: 100 } // Default position
            }
        });
        document.dispatchEvent(addEvent);
        
        console.log(`[ComponentsLibrarySidebar] Adding component: ${component.name}`);
    }
    
    /**
     * Preview component
     * @param {Object} component - Component template data
     */
    previewComponent(component) {
        // Show a preview modal or tooltip with component information
        console.log(`[ComponentsLibrarySidebar] Previewing component: ${component.name}`);
        
        // Dispatch preview event
        this.dispatchEvent('component-preview-requested', {
            component
        });
    }

    /**
     * Update component item UI
     * @param {string} componentId - Component ID
     * @param {boolean} selected - Whether the component is selected
     */
    updateComponentItemUI(componentId, selected) {
        const item = this.listElement?.querySelector(`[data-component-id="${componentId}"]`);
        if (!item) return;
        
        const checkbox = item.querySelector('.component-checkbox');
        if (checkbox) {
            checkbox.checked = selected;
        }
        
        if (selected) {
            item.classList.add('selected');
        } else {
            item.classList.remove('selected');
        }
    }

    /**
     * Focus on component (scroll into view and highlight)
     * @param {string} componentId - Component ID
     */
    focusComponent(componentId) {
        const component = document.querySelector(`[data-id="${componentId}"]`);
        if (!component) return;

        // Scroll component into view
        component.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center', 
            inline: 'center' 
        });

        // Temporarily highlight the component
        const originalOutline = component.style.outline;
        component.style.outline = '3px solid #e74c3c';
        component.style.outlineOffset = '2px';

        setTimeout(() => {
            component.style.outline = originalOutline;
            component.style.outlineOffset = '';
        }, 2000);

        // Also select it if not already selected
        if (this.canvasSelectionManager && !this.canvasSelectionManager.isComponentSelected(component)) {
            this.canvasSelectionManager.selectComponent(component);
        }
    }

    /**
     * Copy a component
     * @param {string} componentId - Component ID
     */
    copyComponent(componentId) {
        if (!this.componentManager) {
            console.warn('[ComponentsLibrarySidebar] Cannot copy component, componentManager not available');
            return;
        }
        
        const component = document.querySelector(`[data-id="${componentId}"]`);
        if (!component) return;
        
        // Dispatch copy event to be handled by action manager
        const copyEvent = new CustomEvent('copy-component', {
            detail: {
                componentId: componentId
            }
        });
        document.dispatchEvent(copyEvent);
    }

    /**
     * Add all components to canvas
     */
    addAllToCanvas() {
        this.filteredComponents.forEach((component, index) => {
            // Add with slight offset for each component
            const addEvent = new CustomEvent('add-component-to-canvas', {
                detail: {
                    template: component,
                    position: { 
                        x: 50 + (index % 5) * 120, 
                        y: 50 + Math.floor(index / 5) * 100 
                    }
                }
            });
            document.dispatchEvent(addEvent);
        });
        
        console.log(`📋 Added ${this.filteredComponents.length} components to canvas`);
        
        // Dispatch event
        this.dispatchEvent('components-library-add-all', {
            count: this.filteredComponents.length
        });
    }

    /**
     * Handle component added to canvas
     * @param {Event} event - Component added event
     */
    handleComponentAdded(event) {
        if (!event.detail) return;
        
        console.log('[ComponentsLibrarySidebar] Component added to canvas:', event.detail);
        
        // Optionally update UI to show that component is now on canvas
        // This could include visual feedback or disabling the template temporarily
    }

    /**
     * Show loading state
     */
    showLoadingState() {
        if (!this.listElement) return;
        
        this.listElement.innerHTML = `
            <div class="components-list-message loading">
                <div class="loading-spinner"></div>
                <span>Loading components...</span>
            </div>
        `;
    }

    /**
     * Show empty state
     */
    showEmptyState() {
        if (!this.listElement) return;
        
        this.listElement.innerHTML = `
            <div class="components-list-message empty">
                <span>${this.options.emptyStateMessage}</span>
                ${this.searchQuery ? `
                    <button class="clear-search-btn">Clear Search</button>
                ` : ''}
            </div>
        `;
        
        // Set up clear search button
        const clearSearchBtn = this.listElement.querySelector('.clear-search-btn');
        if (clearSearchBtn) {
            clearSearchBtn.addEventListener('click', () => {
                if (this.searchElement) {
                    this.searchElement.value = '';
                    this.searchQuery = '';
                    this.filterComponents();
                }
            });
        }
    }

    /**
     * Show error state
     * @param {string} errorMessage - Error message to display
     */
    showErrorState(errorMessage) {
        if (!this.listElement) return;
        
        this.listElement.innerHTML = `
            <div class="components-list-message error">
                <span class="error-icon">⚠️</span>
                <span>${errorMessage}</span>
                <button class="retry-btn">Retry</button>
            </div>
        `;
        
        // Set up retry button
        const retryBtn = this.listElement.querySelector('.retry-btn');
        if (retryBtn) {
            retryBtn.addEventListener('click', () => {
                this.refreshComponentsList();
            });
        }
    }

    /**
     * Get components library statistics
     * @returns {Object} Statistics object
     */
    getStatistics() {
        const totalComponents = this.components.length;
        const selectedComponents = Array.from(this.selectedComponentIds).length;
        
        return {
            total: totalComponents,
            selected: selectedComponents,
            filtered: this.filteredComponents.length,
            categories: this.getCategoryBreakdown()
        };
    }

    /**
     * Get category breakdown
     * @returns {Object} Category counts
     */
    getCategoryBreakdown() {
        const categories = {};
        
        this.components.forEach(component => {
            const category = component.category || 'uncategorized';
            if (!categories[category]) {
                categories[category] = 0;
            }
            categories[category]++;
        });
        
        return categories;
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
        
        document.dispatchEvent(event);
    }
    
    /**
     * Register with component registry
     */
    registerComponent() {
        try {
            // Register with component registry if available
            if (window.componentRegistry) {
                window.componentRegistry.register('components-library-sidebar', () => {
                    return this;
                });
                console.log('[ComponentsLibrarySidebar] Registered with component registry');
            }
        } catch (error) {
            console.warn('[ComponentsLibrarySidebar] Could not register with component registry:', error);
        }
    }
}

// Add CSS styles
function addComponentsLibraryStyles() {
    const styleId = 'components-library-sidebar-styles';
    
    // Don't add styles if they already exist
    if (document.getElementById(styleId)) return;
    
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
        .components-list-message {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 20px;
            text-align: center;
            color: #666;
        }
        
        .components-list-message.loading {
            color: #3498db;
        }
        
        .components-list-message.error {
            color: #e74c3c;
        }
        
        .loading-spinner {
            width: 24px;
            height: 24px;
            border: 2px solid rgba(0, 0, 0, 0.1);
            border-top-color: #3498db;
            border-radius: 50%;
            margin-bottom: 10px;
            animation: spin 1s linear infinite;
        }
        
        @keyframes spin {
            to { transform: rotate(360deg); }
        }
        
        .components-list-message button {
            margin-top: 10px;
            padding: 5px 10px;
            background: #f1f1f1;
            border: 1px solid #ddd;
            border-radius: 3px;
            cursor: pointer;
        }
        
        .components-list-message button:hover {
            background: #e9e9e9;
        }
        
        .component-item {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 8px;
            border-bottom: 1px solid #eee;
            cursor: pointer;
        }
        
        .component-item:hover {
            background-color: rgba(52, 152, 219, 0.05);
        }
        
        .component-item.selected {
            background-color: rgba(52, 152, 219, 0.15);
        }
        
        .component-item-header {
            display: flex;
            align-items: center;
            gap: 8px;
        }
        
        .component-icon {
            font-size: 16px;
            width: 20px;
            text-align: center;
        }
        
        .component-name {
            font-size: 13px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            max-width: 120px;
        }
        
        .component-item-actions {
            display: flex;
            gap: 4px;
            visibility: hidden;
        }
        
        .component-item:hover .component-item-actions {
            visibility: visible;
        }
        
        .component-item-actions button {
            background: none;
            border: none;
            font-size: 14px;
            cursor: pointer;
            padding: 2px;
            border-radius: 3px;
        }
        
        .component-item-actions button:hover {
            background-color: rgba(0, 0, 0, 0.05);
        }
        
        .component-template {
            cursor: grab;
        }
        
        .component-template:active {
            cursor: grabbing;
        }
        
        .component-template.dragging {
            opacity: 0.5;
        }
    `;
    
    document.head.appendChild(style);
}

// Create and initialize
document.addEventListener('DOMContentLoaded', () => {
    // Add styles
    addComponentsLibraryStyles();
    
    // Create instance after a slight delay to ensure DOM is ready
    setTimeout(() => {
        try {
            // Check if required elements exist before creating instance
            const requiredElements = {
                sidebar: document.getElementById('sidebar') || document.querySelector('.sidebar'),
                list: document.getElementById('component-library') || document.querySelector('.component-library')
            };
            
            if (!requiredElements.sidebar || !requiredElements.list) {
                console.warn('[ComponentsLibrarySidebar] Required DOM elements not found, will retry in 1 second');
                // Try again after a delay in case elements are created dynamically
                setTimeout(() => {
                    window.componentsLibrarySidebar = new ComponentsLibrarySidebar();
                    console.log('[ComponentsLibrarySidebar] Global instance created (delayed)');
                }, 1000);
                return;
            }
            
            // Create instance with element references
            window.componentsLibrarySidebar = new ComponentsLibrarySidebar({
                sidebarElement: requiredElements.sidebar,
                listElement: requiredElements.list,
                searchElement: document.getElementById('component-search') || document.querySelector('.component-search'),
                categoryFilterElement: document.getElementById('category-filter') || document.querySelector('.category-filter')
            });
            console.log('[ComponentsLibrarySidebar] Global instance created');
        } catch (error) {
            console.error('[ComponentsLibrarySidebar] Failed to create global instance:', error);
        }
    }, 100);
});

export default ComponentsLibrarySidebar;
