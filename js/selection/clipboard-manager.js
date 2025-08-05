import { canvasPlacementHelper } from '../canvas-placement-helper.js';

/**
 * Clipboard Manager - Copy-paste functionality
 * Extracted from canvas-selection-manager.js for better modularity
 */
export class ClipboardManager {
    constructor() {
        this.clipboard = [];
        this.canvasElement = null;
        this.selectionCore = null;
    }

    /**
     * Set references to canvas and selection core
     */
    setReferences(canvasElement, selectionCore) {
        this.canvasElement = canvasElement;
        this.selectionCore = selectionCore;
        
        // Initialize placement helper with canvas reference
        if (canvasElement) {
            canvasPlacementHelper.setCanvas(canvasElement, 20);
        }
    }

    /**
     * Copy selected components to clipboard
     */
    copySelectedComponents() {
        if (!this.selectionCore || this.selectionCore.selectedComponents.size === 0) {
            console.log('📋 No components selected for copying');
            return;
        }

        this.clipboard = [];
        
        this.selectionCore.selectedComponents.forEach(component => {
            const componentData = {
                outerHTML: component.outerHTML,
                dataId: component.getAttribute('data-id'),
                position: this.getComponentPosition(component),
                type: this.getComponentType(component)
            };
            this.clipboard.push(componentData);
        });

        console.log(`📋 Copied ${this.clipboard.length} components to clipboard`);
        this.showNotification(`Copied ${this.clipboard.length} component${this.clipboard.length !== 1 ? 's' : ''}`);
    }

    /**
     * Paste components from clipboard
     */
    pasteComponents() {
        if (this.clipboard.length === 0) {
            console.log('📋 Clipboard is empty');
            this.showNotification('Clipboard is empty');
            return;
        }

        if (!this.canvasElement) {
            console.log('📋 No canvas element available for pasting');
            return;
        }

        // Clear current selection
        if (this.selectionCore) {
            this.selectionCore.clearSelection();
        }

        const pastedComponents = [];
        
        this.clipboard.forEach((clipboardItem, index) => {
            const newComponent = this.createComponentCopy(clipboardItem, index);
            if (newComponent) {
                pastedComponents.push(newComponent);
                // Select the newly pasted component
                if (this.selectionCore) {
                    this.selectionCore.selectComponent(newComponent);
                }
            }
        });

        console.log(`📋 Pasted ${pastedComponents.length} components`);
        this.showNotification(`Pasted ${pastedComponents.length} component${pastedComponents.length !== 1 ? 's' : ''}`);

        // Dispatch event for other systems
        const event = new CustomEvent('components-pasted', {
            detail: { 
                components: pastedComponents,
                count: pastedComponents.length
            }
        });
        document.dispatchEvent(event);
    }

    /**
     * Create a copy of a component with smart positioning
     */
    createComponentCopy(clipboardItem, index) {
        try {
            // Create new element from stored HTML
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = clipboardItem.outerHTML;
            const newComponent = tempDiv.firstChild;

            if (!newComponent) return null;

            // Generate new unique ID
            const newId = this.generateUniqueId(clipboardItem.type);
            newComponent.setAttribute('data-id', newId);
            
            // Update internal IDs if present
            if (newComponent.id) {
                newComponent.id = newId;
            }

            // Calculate smart position for the copy
            const newPosition = this.calculateSmartPosition(clipboardItem.position, index);
            this.updateComponentPosition(newComponent, newPosition);

            // Add to canvas
            this.canvasElement.appendChild(newComponent);

            console.log(`📋 Created component copy: ${newId} at (${newPosition.x}, ${newPosition.y})`);
            return newComponent;

        } catch (error) {
            console.error('Error creating component copy:', error);
            return null;
        }
    }

    /**
     * Calculate smart position for pasted component using placement helper
     */
    calculateSmartPosition(originalPosition, index) {
        const baseOffset = 20; // Base offset for copies
        const indexOffset = index * 10; // Additional offset for multiple copies
        
        let targetX = originalPosition.x + baseOffset + indexOffset;
        let targetY = originalPosition.y + baseOffset + indexOffset;

        // Use placement helper for smart positioning if available
        if (canvasPlacementHelper && canvasPlacementHelper.canvas) {
            const smartPosition = canvasPlacementHelper.findOptimalPosition(
                targetX, 
                targetY, 
                100, // estimated width
                100  // estimated height
            );
            
            if (smartPosition) {
                return { x: smartPosition.x, y: smartPosition.y };
            }
        }

        // Fallback to simple offset
        return { x: targetX, y: targetY };
    }

    /**
     * Update component position based on its type
     */
    updateComponentPosition(component, position) {
        if (component.tagName.toLowerCase() === 'g') {
            // For group elements, update transform attribute
            const currentTransform = component.getAttribute('transform') || '';
            const newTransform = currentTransform.replace(
                /translate\([^)]*\)/g, 
                `translate(${position.x}, ${position.y})`
            );
            
            if (!newTransform.includes('translate')) {
                component.setAttribute('transform', `${currentTransform} translate(${position.x}, ${position.y})`.trim());
            } else {
                component.setAttribute('transform', newTransform);
            }
        } else {
            // For regular elements, update x/y attributes
            component.setAttribute('x', position.x);
            component.setAttribute('y', position.y);
        }
    }

    /**
     * Get component position
     */
    getComponentPosition(component) {
        let x = 0, y = 0;

        if (component.tagName.toLowerCase() === 'g') {
            // For group elements, parse transform
            const transform = component.getAttribute('transform');
            if (transform) {
                const match = transform.match(/translate\(\s*([\d.-]+)(?:[,\s]+([\d.-]+))?\s*\)/);
                if (match) {
                    x = parseFloat(match[1]) || 0;
                    y = parseFloat(match[2]) || 0;
                }
            }
        } else {
            // For regular elements, use x/y attributes
            x = parseInt(component.getAttribute('x')) || 0;
            y = parseInt(component.getAttribute('y')) || 0;
        }

        return { x, y };
    }

    /**
     * Get component type from class or data attributes
     */
    getComponentType(component) {
        return component.getAttribute('data-type') || 
               component.className.baseVal || 
               component.className || 
               'component';
    }

    /**
     * Generate unique ID for component
     */
    generateUniqueId(type) {
        const timestamp = Date.now();
        const random = Math.floor(Math.random() * 1000);
        return `${type}-${timestamp}-${random}`;
    }

    /**
     * Show notification to user
     */
    showNotification(message) {
        console.log(`📢 ${message}`);
        
        // Create temporary notification
        const notification = document.createElement('div');
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #28a745;
            color: white;
            padding: 10px 15px;
            border-radius: 4px;
            z-index: 10000;
            font-size: 14px;
            font-family: Arial, sans-serif;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        `;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }

    /**
     * Get clipboard info
     */
    getClipboardInfo() {
        return {
            count: this.clipboard.length,
            types: this.clipboard.map(item => item.type)
        };
    }

    /**
     * Clear clipboard
     */
    clearClipboard() {
        this.clipboard = [];
        console.log('📋 Clipboard cleared');
    }
}

// Create and export singleton instance
export const clipboardManager = new ClipboardManager();
export default clipboardManager;
