// Digital Twin IDE - Interaction Manager Module
// Handles auto-refresh, event listening, and interaction panel updates

export class InteractionManager {
    constructor(mapperCore, componentDetector, variableMapper) {
        this.mapperCore = mapperCore;
        this.componentDetector = componentDetector;
        this.variableMapper = variableMapper;
        this.canvasObserver = null;
        this.refreshTimeout = null;
    }

    /**
     * Setup auto-refresh functionality for canvas changes
     */
    setupAutoRefresh() {
        const canvas = this.mapperCore.getCanvas();
        if (!canvas) {
            console.warn('[InteractionManager] Canvas not found for auto-refresh setup');
            return;
        }
        
        console.log('[InteractionManager] Setting up auto-refresh for canvas changes');
        
        // Setup mutation observer for canvas changes
        this.setupCanvasObserver(canvas);
        
        // Setup selection change listener
        this.setupSelectionListener();
        
        // Setup component change listeners
        this.setupComponentListeners();
    }

    /**
     * Setup mutation observer for canvas changes
     * @param {Element} canvas - Canvas element to observe
     */
    setupCanvasObserver(canvas) {
        if (this.canvasObserver) {
            this.canvasObserver.disconnect();
        }

        this.canvasObserver = new MutationObserver((mutations) => {
            let shouldRefresh = false;
            
            mutations.forEach((mutation) => {
                if (mutation.type === 'childList' || 
                    (mutation.type === 'attributes' && 
                     ['data-id', 'id', 'class', 'data-type'].includes(mutation.attributeName))) {
                    shouldRefresh = true;
                }
            });

            if (shouldRefresh) {
                console.log('[InteractionManager] Canvas changed, scheduling refresh...');
                this.scheduleRefresh();
            }
        });

        this.canvasObserver.observe(canvas, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['data-id', 'id', 'class', 'data-type', 'fill', 'stroke']
        });
        
        // Store observer reference in core for cleanup
        this.mapperCore.canvasObserver = this.canvasObserver;
        
        console.log('[InteractionManager] Canvas observer setup complete');
    }

    /**
     * Setup selection change listener
     */
    setupSelectionListener() {
        document.addEventListener('canvas-selection-changed', (event) => {
            console.log('[InteractionManager] Selection change event received:', event.detail);
            this.handleSelectionChange(event.detail);
        });
        
        console.log('[InteractionManager] Selection listener setup complete');
    }

    /**
     * Setup component change listeners
     */
    setupComponentListeners() {
        // Listen for component updates
        document.addEventListener('component-updated', (event) => {
            if (event.detail?.componentId) {
                console.log('[InteractionManager] Component updated:', event.detail.componentId);
                this.scheduleRefresh();
            }
        });
        
        // Listen for component property changes
        document.addEventListener('component-property-changed', (event) => {
            if (event.detail?.componentId) {
                console.log('[InteractionManager] Component property changed:', event.detail);
                this.scheduleRefresh();
            }
        });
        
        console.log('[InteractionManager] Component listeners setup complete');
    }

    /**
     * Handle selection change events
     * @param {Object} selectionDetail - Selection event detail
     */
    handleSelectionChange(selectionDetail) {
        try {
            // Handle component selection
            if (selectionDetail.selectedComponents && selectionDetail.selectedComponents.length > 0) {
                // Get the first selected component (single selection mode)
                const selectedComponent = selectionDetail.selectedComponents[0];
                
                if (this.mapperCore.componentManager && selectedComponent) {
                    console.log('[InteractionManager] Setting selected component:', selectedComponent);
                    
                    // Update component selection in the ComponentManager
                    this.mapperCore.componentManager.setSelectedComponent(selectedComponent);
                    
                    // Update properties UI if available
                    if (window.propertiesCore) {
                        window.propertiesCore.selectComponent(selectedComponent);
                    }
                }
            } else {
                // Clear selection
                if (this.mapperCore.componentManager) {
                    this.mapperCore.componentManager.setSelectedComponent(null);
                    
                    // Clear properties UI if available
                    if (window.propertiesCore) {
                        window.propertiesCore.clearProperties();
                    }
                }
            }
        } catch (error) {
            console.error('[InteractionManager] Error handling selection change:', error);
        }
    }

    /**
     * Schedule a refresh with debouncing to avoid excessive updates
     */
    scheduleRefresh() {
        // Clear existing timeout
        if (this.refreshTimeout) {
            clearTimeout(this.refreshTimeout);
        }
        
        // Schedule new refresh
        this.refreshTimeout = setTimeout(() => {
            this.performRefresh();
        }, 250); // 250ms debounce
    }

    /**
     * Perform the actual refresh operations
     */
    performRefresh() {
        console.log('[InteractionManager] Performing scheduled refresh...');
        
        try {
            // Scan canvas for property changes
            this.componentDetector.scanCanvasProperties();
            
            // Refresh interaction panels
            this.refreshInteractionPanels();
            
            console.log('[InteractionManager] Refresh completed successfully');
        } catch (error) {
            console.error('[InteractionManager] Error during refresh:', error);
        }
    }

    /**
     * Refresh interaction panels after mapping changes
     * @param {number} retryCount - Number of retries attempted
     */
    refreshInteractionPanels(retryCount = 0) {
        console.log(`[InteractionManager] Refreshing interaction panels (attempt ${retryCount + 1})`);
        
        try {
            // Update available target components
            const targetComponents = this.variableMapper.getAvailableTargetComponents();
            
            // Notify interaction systems of updated components
            this.notifyInteractionSystems(targetComponents);
            
            // Update variable lists in UI
            this.updateVariableLists();
            
            console.log(`[InteractionManager] Successfully refreshed interaction panels with ${targetComponents.length} components`);
            
        } catch (error) {
            console.error('[InteractionManager] Error refreshing interaction panels:', error);
            
            // Retry up to 3 times with exponential backoff
            if (retryCount < 3) {
                const delay = Math.pow(2, retryCount) * 1000; // 1s, 2s, 4s
                setTimeout(() => {
                    this.refreshInteractionPanels(retryCount + 1);
                }, delay);
            } else {
                console.error('[InteractionManager] Max retries reached for interaction panel refresh');
            }
        }
    }

    /**
     * Notify interaction systems of component updates
     * @param {Array} targetComponents - Available target components
     */
    notifyInteractionSystems(targetComponents) {
        // Dispatch custom event for interaction systems
        const event = new CustomEvent('properties-mapped', {
            detail: {
                targetComponents,
                mappedProperties: this.mapperCore.getMappedProperties(),
                availableVariables: this.mapperCore.getAvailableVariables(),
                timestamp: new Date().toISOString()
            }
        });
        
        document.dispatchEvent(event);
        
        // Update global references if they exist
        if (window.interactionsManager) {
            try {
                window.interactionsManager.updateAvailableComponents(targetComponents);
            } catch (error) {
                console.warn('[InteractionManager] Error updating interactions manager:', error);
            }
        }
        
        if (window.propertiesInteractions) {
            try {
                window.propertiesInteractions.refreshTargetComponents(targetComponents);
            } catch (error) {
                console.warn('[InteractionManager] Error updating properties interactions:', error);
            }
        }
    }

    /**
     * Update variable lists in UI components
     */
    updateVariableLists() {
        const allVariables = this.variableMapper.getAllVariables();
        
        // Update variable dropdowns if they exist
        const variableSelects = document.querySelectorAll('select[data-variable-list]');
        variableSelects.forEach(select => {
            this.updateVariableSelect(select, allVariables);
        });
        
        // Dispatch event for custom variable list handlers
        const event = new CustomEvent('variables-updated', {
            detail: {
                variables: allVariables,
                timestamp: new Date().toISOString()
            }
        });
        
        document.dispatchEvent(event);
    }

    /**
     * Update a variable select element
     * @param {Element} select - Select element to update
     * @param {Array} variables - Available variables
     */
    updateVariableSelect(select, variables) {
        const currentValue = select.value;
        
        // Clear existing options except the first (usually a placeholder)
        while (select.children.length > 1) {
            select.removeChild(select.lastChild);
        }
        
        // Group variables by type
        const variablesByType = {};
        variables.forEach(variable => {
            if (!variablesByType[variable.type]) {
                variablesByType[variable.type] = [];
            }
            variablesByType[variable.type].push(variable);
        });
        
        // Add grouped options
        Object.entries(variablesByType).forEach(([type, typeVariables]) => {
            const optgroup = document.createElement('optgroup');
            optgroup.label = type.charAt(0).toUpperCase() + type.slice(1) + 's';
            
            typeVariables.forEach(variable => {
                const option = document.createElement('option');
                option.value = variable.key;
                option.textContent = `${variable.key} (${variable.description || 'No description'})`;
                optgroup.appendChild(option);
            });
            
            select.appendChild(optgroup);
        });
        
        // Restore previous value if it still exists
        if (currentValue && Array.from(select.options).some(opt => opt.value === currentValue)) {
            select.value = currentValue;
        }
    }

    /**
     * Force immediate refresh without debouncing
     */
    forceRefresh() {
        console.log('[InteractionManager] Forcing immediate refresh...');
        
        if (this.refreshTimeout) {
            clearTimeout(this.refreshTimeout);
            this.refreshTimeout = null;
        }
        
        this.performRefresh();
    }

    /**
     * Get refresh status
     * @returns {Object} Refresh status information
     */
    getRefreshStatus() {
        return {
            observerActive: !!this.canvasObserver,
            refreshScheduled: !!this.refreshTimeout,
            lastRefresh: this.lastRefreshTime || null
        };
    }

    /**
     * Cleanup method to disconnect observers and clear timeouts
     */
    cleanup() {
        console.log('[InteractionManager] Starting cleanup...');
        
        if (this.canvasObserver) {
            this.canvasObserver.disconnect();
            this.canvasObserver = null;
        }
        
        if (this.refreshTimeout) {
            clearTimeout(this.refreshTimeout);
            this.refreshTimeout = null;
        }
        
        // Remove event listeners
        // Note: We can't remove specific listeners without references, 
        // but they'll be cleaned up when the page unloads
        
        console.log('[InteractionManager] Cleanup completed');
    }
}
