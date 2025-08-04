/**
 * Components Column Manager - Manages the dedicated components selection column
 */
export class ComponentsColumnManager {
    constructor() {
        this.componentManager = null;
        this.canvasSelectionManager = null;
        this.componentsListElement = null;
        this.componentIcons = {
            'led': '💡',
            'pump': '🔧',
            'valve': '🔘',
            'sensor': '📊',
            'display': '📺',
            'button': '🔲',
            'motor': '⚙️',
            'default': '📦'
        };
        
        this.init();
    }

    /**
     * Initialize the components column manager
     */
    init() {
        this.componentsListElement = document.getElementById('components-list');
        console.log('📋 Components Column Manager initialized');
        
        // Listen for canvas changes
        document.addEventListener('canvas-selection-changed', this.handleSelectionChange.bind(this));
        document.addEventListener('components-moved', this.refreshComponentsList.bind(this));
        document.addEventListener('component-added', this.refreshComponentsList.bind(this));
        document.addEventListener('component-removed', this.refreshComponentsList.bind(this));
        document.addEventListener('components-loaded', this.refreshComponentsList.bind(this));
        
        // Initial refresh
        this.refreshComponentsList();
    }

    /**
     * Set references to other managers
     */
    setReferences(componentManager, canvasSelectionManager) {
        this.componentManager = componentManager;
        this.canvasSelectionManager = canvasSelectionManager;
        
        // Initial refresh
        this.refreshComponentsList();
    }

    /**
     * Get all components from canvas
     */
    getAllCanvasComponents() {
        const canvas = document.getElementById('svg-canvas');
        if (!canvas) return [];

        const components = canvas.querySelectorAll('.draggable-component[data-id]');
        return Array.from(components).map(component => {
            const id = component.getAttribute('data-id');
            const type = component.getAttribute('data-type') || 'default';
            const svgUrl = component.getAttribute('data-svg-url') || '';
            
            // Get component name from various sources
            let name = this.getComponentName(component, type);
            
            return {
                id,
                type,
                name,
                element: component,
                svgUrl,
                selected: this.canvasSelectionManager ? 
                    this.canvasSelectionManager.selectedComponents.has(component) : false
            };
        }).sort((a, b) => a.name.localeCompare(b.name));
    }

    /**
     * Get component name from various sources
     */
    getComponentName(component, type) {
        // Try to get name from text content
        const textElements = component.querySelectorAll('text');
        if (textElements.length > 0) {
            const firstText = textElements[0].textContent?.trim();
            if (firstText && firstText.length > 0 && firstText !== type) {
                return firstText;
            }
        }

        // Try metadata
        const metadata = component.getAttribute('data-metadata');
        if (metadata) {
            try {
                const parsed = JSON.parse(metadata);
                if (parsed.parameters?.label) {
                    return parsed.parameters.label;
                }
                if (parsed.name) {
                    return parsed.name;
                }
            } catch (e) {
                // Ignore parsing errors
            }
        }

        // Try attributes
        const label = component.getAttribute('data-label') || 
                     component.getAttribute('aria-label') || 
                     component.getAttribute('title');
        if (label) return label;

        // Default to type with ID
        return `${type.charAt(0).toUpperCase() + type.slice(1)} (${component.getAttribute('data-id')})`;
    }

    /**
     * Refresh the components list
     */
    refreshComponentsList() {
        if (!this.componentsListElement) return;

        const components = this.getAllCanvasComponents();
        
        if (components.length === 0) {
            this.componentsListElement.innerHTML = '<p class="text-muted small">Brak komponentów na canvas</p>';
            return;
        }

        const html = components.map(component => this.generateComponentItemHTML(component)).join('');
        this.componentsListElement.innerHTML = html;
    }

    /**
     * Generate HTML for a single component item
     */
    generateComponentItemHTML(component) {
        const icon = this.componentIcons[component.type] || this.componentIcons.default;
        const selectedClass = component.selected ? 'selected' : '';
        const checkedAttr = component.selected ? 'checked' : '';

        return `
            <div class="component-item-canvas ${selectedClass}" data-component-id="${component.id}">
                <input type="checkbox" class="component-checkbox" 
                       id="checkbox-${component.id}" 
                       ${checkedAttr}
                       onchange="window.componentsColumnManager?.toggleComponentSelection('${component.id}', this.checked)">
                <div class="component-icon">${icon}</div>
                <div class="component-info">
                    <div class="component-name">${component.name}</div>
                    <div class="component-id">${component.id}</div>
                    <div class="component-type">${component.type}</div>
                </div>
                <button class="btn btn-xs btn-outline-light ml-1" 
                        onclick="window.componentsColumnManager?.focusComponent('${component.id}')" 
                        title="Skup na komponencie">
                    👁️
                </button>
            </div>
        `;
    }

    /**
     * Toggle component selection
     */
    toggleComponentSelection(componentId, selected) {
        if (!this.canvasSelectionManager) return;

        const component = document.querySelector(`[data-id="${componentId}"]`);
        if (!component) return;

        if (selected) {
            this.canvasSelectionManager.selectComponent(component);
        } else {
            this.canvasSelectionManager.deselectComponent(component);
        }

        // Update UI
        this.updateComponentItemUI(componentId, selected);
    }

    /**
     * Update component item UI
     */
    updateComponentItemUI(componentId, selected) {
        const item = this.componentsListElement?.querySelector(`[data-component-id="${componentId}"]`);
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
        if (this.canvasSelectionManager && !this.canvasSelectionManager.selectedComponents.has(component)) {
            this.canvasSelectionManager.selectComponent(component);
        }
    }

    /**
     * Select all components
     */
    selectAll() {
        if (!this.canvasSelectionManager) return;

        const components = this.getAllCanvasComponents();
        components.forEach(comp => {
            this.canvasSelectionManager.selectComponent(comp.element);
        });

        console.log(`📋 Selected all ${components.length} components`);
    }

    /**
     * Clear all selections
     */
    clearAll() {
        if (!this.canvasSelectionManager) return;

        this.canvasSelectionManager.clearSelection();
        console.log('📋 Cleared all component selections');
    }

    /**
     * Handle selection changes from canvas
     */
    handleSelectionChange(event) {
        if (!event.detail) return;

        const selectedComponents = event.detail.selectedComponents || [];
        const selectedIds = selectedComponents.map(comp => comp.getAttribute('data-id')).filter(id => id);

        // Update all checkboxes and visual states
        const allComponents = this.getAllCanvasComponents();
        allComponents.forEach(component => {
            const isSelected = selectedIds.includes(component.id);
            this.updateComponentItemUI(component.id, isSelected);
        });
    }

    /**
     * Get components column statistics
     */
    getStatistics() {
        const allComponents = this.getAllCanvasComponents();
        const selectedCount = allComponents.filter(comp => comp.selected).length;

        return {
            total: allComponents.length,
            selected: selectedCount,
            unselected: allComponents.length - selectedCount
        };
    }

    /**
     * Export components list data
     */
    exportComponentsList() {
        return this.getAllCanvasComponents().map(comp => ({
            id: comp.id,
            type: comp.type,
            name: comp.name,
            selected: comp.selected
        }));
    }
}

// Export singleton instance
export const componentsColumnManager = new ComponentsColumnManager();
