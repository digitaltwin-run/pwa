/**
 * Selection List Manager - Manages component selection list in properties panel
 */
export class SelectionListManager {
    constructor() {
        this.componentManager = null;
        this.selectionManager = null;
        this.init();
    }

    init() {
        // Listen for selection changes
        document.addEventListener('canvas-selection-changed', (e) => {
            this.updateSelectionList(e.detail);
        });

        console.log('📋 Selection List Manager initialized');
    }

    /**
     * Set references to other managers
     */
    setReferences(componentManager, selectionManager) {
        this.componentManager = componentManager;
        this.selectionManager = selectionManager;
    }

    /**
     * Generate selection list HTML for properties panel
     */
    generateSelectionListSection() {
        if (!this.componentManager) {
            return '<div class="selection-list-section"><p>Component manager not available</p></div>';
        }

        const allComponents = this.getAllComponents();
        const selectedComponents = this.getSelectedComponents();

        if (allComponents.length === 0) {
            return '<div class="selection-list-section"><p>No components on canvas</p></div>';
        }

        let html = `
            <div class="selection-list-section" style="margin-top: 15px;">
                <h6><i class="bi bi-list-check"></i> <span data-i18n="properties.selection_list">Lista Komponentów</span></h6>
                <div class="selection-controls" style="margin-bottom: 10px;">
                    <button class="btn btn-sm btn-outline-primary" onclick="window.selectionListManager?.selectAll()" data-i18n="properties.select_all">
                        Zaznacz wszystkie
                    </button>
                    <button class="btn btn-sm btn-outline-dark" onclick="window.selectionListManager?.clearAll()" data-i18n="properties.clear_all">
                        Odznacz wszystkie
                    </button>
                </div>
                <div class="component-list" style="max-height: 200px; overflow-y: auto; border: 1px solid #dee2e6; border-radius: 4px; background: #f8f9fa;">
        `;

        allComponents.forEach(component => {
            const componentId = component.getAttribute('data-id');
            const componentType = component.getAttribute('data-component-type') || 'unknown';
            const isSelected = selectedComponents.some(sel => sel.getAttribute('data-id') === componentId);
            
            // Get component name from metadata or use type
            const componentName = this.getComponentDisplayName(component);
            
            html += `
                <div class="component-item" style="display: flex; align-items: center; padding: 8px; border-bottom: 1px solid #dee2e6; ${isSelected ? 'background: #e3f2fd;' : ''}">
                    <input type="checkbox" 
                           id="select-${componentId}" 
                           ${isSelected ? 'checked' : ''} 
                           onchange="window.selectionListManager?.toggleComponentSelection('${componentId}', this.checked)"
                           style="margin-right: 8px;">
                    <label for="select-${componentId}" style="flex: 1; margin: 0; cursor: pointer; font-size: 12px;">
                        <span class="component-icon" style="margin-right: 6px;">${this.getComponentIcon(componentType)}</span>
                        <span class="component-name" style="font-weight: ${isSelected ? '600' : '400'};">${componentName}</span>
                        <small class="component-id" style="color: #6c757d; margin-left: 4px;">(${componentId})</small>
                    </label>
                    <div class="component-actions" style="display: flex; gap: 4px;">
                        ${isSelected ? `
                            <button class="btn btn-xs btn-outline-primary" 
                                    onclick="window.selectionListManager?.focusComponent('${componentId}')" 
                                    title="Focus on component"
                                    style="padding: 2px 6px; font-size: 10px;">
                                <i class="bi bi-eye"></i>
                            </button>
                        ` : ''}
                    </div>
                </div>
            `;
        });

        html += `
                </div>
                <div class="selection-summary" style="margin-top: 8px; padding: 6px; background: #e9ecef; border-radius: 3px; font-size: 11px;">
                    <span data-i18n="properties.selected_count">Zaznaczonych:</span> 
                    <strong>${selectedComponents.length}</strong> / ${allComponents.length}
                </div>
            </div>
        `;

        return html;
    }

    /**
     * Get all components from canvas
     */
    getAllComponents() {
        const canvas = document.querySelector('#svg-canvas, .svg-canvas');
        if (!canvas) return [];
        
        return Array.from(canvas.querySelectorAll('[data-id]')).filter(el => {
            // Filter out non-component elements
            return el.hasAttribute('data-component-type') || el.classList.contains('draggable-component');
        });
    }

    /**
     * Get currently selected components
     */
    getSelectedComponents() {
        if (!this.selectionManager) return [];
        return Array.from(this.selectionManager.selectedComponents || []);
    }

    /**
     * Get display name for component
     */
    getComponentDisplayName(component) {
        const componentId = component.getAttribute('data-id');
        const componentType = component.getAttribute('data-component-type') || 'unknown';
        
        // Try to get name from metadata
        const metadata = component.getAttribute('data-metadata');
        if (metadata) {
            try {
                const parsedMetadata = JSON.parse(metadata);
                if (parsedMetadata.parameters?.label) {
                    return parsedMetadata.parameters.label;
                }
                if (parsedMetadata.parameters?.name) {
                    return parsedMetadata.parameters.name;
                }
            } catch (e) {
                // Ignore parsing errors
            }
        }
        
        // Try to get name from text content
        const textElement = component.querySelector('text');
        if (textElement && textElement.textContent.trim()) {
            return textElement.textContent.trim();
        }
        
        // Fallback to component type
        return this.getComponentTypeName(componentType);
    }

    /**
     * Get component icon based on type
     */
    getComponentIcon(componentType) {
        const icons = {
            'led': '💡',
            'button': '🔘',
            'switch': '🎛️',
            'sensor': '📡',
            'display': '📺',
            'pump': '⚙️',
            'valve': '🚰',
            'unknown': '📦'
        };
        return icons[componentType] || icons.unknown;
    }

    /**
     * Get component type display name
     */
    getComponentTypeName(componentType) {
        const names = {
            'led': 'LED',
            'button': 'Przycisk',
            'switch': 'Przełącznik', 
            'sensor': 'Czujnik',
            'display': 'Wyświetlacz',
            'pump': 'Pompa',
            'valve': 'Zawór',
            'unknown': 'Komponent'
        };
        return names[componentType] || names.unknown;
    }

    /**
     * Toggle component selection from list
     */
    toggleComponentSelection(componentId, isChecked) {
        const component = document.querySelector(`[data-id="${componentId}"]`);
        if (!component || !this.selectionManager) return;

        if (isChecked) {
            this.selectionManager.selectComponent(component);
        } else {
            this.selectionManager.deselectComponent(component);
        }

        // Update the selection list
        this.refreshSelectionList();
    }

    /**
     * Select all components
     */
    selectAll() {
        if (!this.selectionManager) return;
        this.selectionManager.selectAllComponents();
        this.refreshSelectionList();
    }

    /**
     * Clear all selections
     */
    clearAll() {
        if (!this.selectionManager) return;
        this.selectionManager.clearSelection();
        this.refreshSelectionList();
    }

    /**
     * Focus on specific component (center view, highlight)
     */
    focusComponent(componentId) {
        const component = document.querySelector(`[data-id="${componentId}"]`);
        if (!component) return;

        // Scroll component into view
        component.scrollIntoView({ behavior: 'smooth', block: 'center' });
        
        // Add temporary highlight
        component.style.outline = '3px solid #ff6b35';
        setTimeout(() => {
            component.style.outline = '';
        }, 2000);
    }

    /**
     * Update selection list when selection changes
     */
    updateSelectionList(selectionDetail) {
        this.refreshSelectionList();
    }

    /**
     * Refresh the selection list in properties panel
     */
    refreshSelectionList() {
        const selectionListContainer = document.getElementById('selection-list-container');
        if (selectionListContainer) {
            selectionListContainer.innerHTML = this.generateSelectionListSection();
        }
    }
}

// Create and export singleton instance
export const selectionListManager = new SelectionListManager();

// Make available globally for UI interactions
window.selectionListManager = selectionListManager;

// Default export
export default selectionListManager;
