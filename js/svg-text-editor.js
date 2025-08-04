// Digital Twin IDE - SVG Text Editor Module
// Enables in-place editing of text elements within SVG components

export class SVGTextEditor {
    constructor() {
        this.activeEditor = null;
        this.originalValue = '';
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Listen for double-clicks on SVG text elements
        document.addEventListener('dblclick', (event) => {
            const target = event.target;
            
            // Check if target is a text element in an SVG component
            if (this.isEditableTextElement(target)) {
                event.preventDefault();
                event.stopPropagation();
                this.startEditing(target);
            }
        });

        // Close editor on escape key
        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape' && this.activeEditor) {
                this.cancelEditing();
            }
        });

        // Close editor when clicking outside
        document.addEventListener('click', (event) => {
            if (this.activeEditor && !this.activeEditor.contains(event.target)) {
                this.finishEditing();
            }
        });
    }

    isEditableTextElement(element) {
        // Check if element is a text element
        if (element.tagName !== 'text') return false;

        // Check if it's inside an SVG component (has data-id parent)
        const svgComponent = element.closest('[data-id]');
        if (!svgComponent) return false;

        // Check if text element has an ID (labels usually have IDs)
        const textId = element.getAttribute('id');
        if (!textId) return false;

        // Allow editing of common text element IDs
        const editableIds = ['label', 'value', 'title', 'name', 'text', 'display'];
        return editableIds.some(id => textId.toLowerCase().includes(id.toLowerCase()));
    }

    startEditing(textElement) {
        // Prevent multiple editors
        if (this.activeEditor) {
            this.finishEditing();
        }

        console.log('[SVGTextEditor] Starting text editing for:', textElement.id);

        // Store original value
        this.originalValue = textElement.textContent || '';
        
        // Get text element position and dimensions
        const bbox = textElement.getBBox();
        const svg = textElement.ownerSVGElement;
        const svgRect = svg.getBoundingClientRect();
        
        // Calculate position relative to viewport
        const matrix = textElement.getScreenCTM();
        const x = matrix.e;
        const y = matrix.f;

        // Create input element
        const input = document.createElement('input');
        input.type = 'text';
        input.value = this.originalValue;
        input.className = 'svg-text-editor';
        
        // Position the input over the text element
        Object.assign(input.style, {
            position: 'fixed',
            left: `${x - bbox.width/2}px`,
            top: `${y - bbox.height/2}px`,
            width: `${Math.max(bbox.width + 20, 80)}px`,
            height: `${bbox.height + 4}px`,
            fontSize: textElement.getAttribute('font-size') || '12px',
            fontFamily: textElement.getAttribute('font-family') || 'inherit',
            textAlign: textElement.getAttribute('text-anchor') === 'middle' ? 'center' : 'left',
            background: 'rgba(255, 255, 255, 0.95)',
            border: '2px solid #3498db',
            borderRadius: '4px',
            padding: '2px 6px',
            color: '#2c3e50',
            zIndex: '10000',
            outline: 'none'
        });

        // Handle input events
        input.addEventListener('keydown', (event) => {
            if (event.key === 'Enter') {
                event.preventDefault();
                this.finishEditing();
            } else if (event.key === 'Escape') {
                event.preventDefault();
                this.cancelEditing();
            }
        });

        // Prevent event bubbling
        input.addEventListener('click', (event) => {
            event.stopPropagation();
        });

        // Add to document and focus
        document.body.appendChild(input);
        input.focus();
        input.select();

        // Store references
        this.activeEditor = input;
        this.editingElement = textElement;
    }

    finishEditing() {
        if (!this.activeEditor || !this.editingElement) return;

        const newValue = this.activeEditor.value.trim();
        
        // Update text element if value changed
        if (newValue !== this.originalValue) {
            this.editingElement.textContent = newValue;
            
            // Update component metadata if applicable
            this.updateComponentMetadata(this.editingElement, newValue);
            
            // Trigger change event
            const changeEvent = new CustomEvent('svg-text-changed', {
                detail: {
                    element: this.editingElement,
                    oldValue: this.originalValue,
                    newValue: newValue,
                    textId: this.editingElement.getAttribute('id')
                }
            });
            this.editingElement.dispatchEvent(changeEvent);
            
            console.log(`[SVGTextEditor] Text updated: "${this.originalValue}" → "${newValue}"`);
        }

        this.cleanup();
    }

    cancelEditing() {
        console.log('[SVGTextEditor] Editing cancelled');
        this.cleanup();
    }

    cleanup() {
        if (this.activeEditor) {
            this.activeEditor.remove();
        }
        
        this.activeEditor = null;
        this.editingElement = null;
        this.originalValue = '';
    }

    updateComponentMetadata(textElement, newValue) {
        // Find the parent component
        const component = textElement.closest('[data-id]');
        if (!component) return;

        const componentId = component.getAttribute('data-id');
        const textId = textElement.getAttribute('id');

        // Update component parameters based on text element ID
        if (textId === 'label') {
            // Update label parameter
            const labelParam = component.querySelector('parameters label');
            if (labelParam) {
                labelParam.textContent = newValue;
            }
            
            // Update data attribute if present
            component.setAttribute('data-label', newValue);
        }

        // Notify properties manager if available
        if (window.propertiesManager) {
            try {
                // Refresh properties if this component is selected
                const selectedComponent = window.componentManager?.getSelectedComponent();
                if (selectedComponent === component) {
                    window.propertiesManager.showProperties(component);
                }
            } catch (error) {
                console.warn('[SVGTextEditor] Could not refresh properties:', error);
            }
        }

        console.log(`[SVGTextEditor] Updated metadata for component ${componentId}, ${textId}: ${newValue}`);
    }

    // Public methods for programmatic control
    isEditing() {
        return this.activeEditor !== null;
    }

    getCurrentEditor() {
        return this.activeEditor;
    }

    getCurrentEditingElement() {
        return this.editingElement;
    }
}

// Create global instance
const svgTextEditor = new SVGTextEditor();

// Export for use in other modules
export default svgTextEditor;

// Make available globally for debugging/testing
window.svgTextEditor = svgTextEditor;

console.log('📝 SVG Text Editor loaded - Double-click text elements in components to edit');
