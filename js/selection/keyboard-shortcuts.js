/**
 * Keyboard Shortcuts - Keyboard interaction handling
 * Extracted from canvas-selection-manager.js for better modularity
 */
export class KeyboardShortcuts {
    constructor() {
        this.selectionCore = null;
        this.clipboardManager = null;
        this.isInitialized = false;
    }

    /**
     * Set references to selection core and clipboard manager
     */
    setReferences(selectionCore, clipboardManager) {
        this.selectionCore = selectionCore;
        this.clipboardManager = clipboardManager;
    }

    /**
     * Initialize keyboard shortcuts
     */
    init() {
        if (this.isInitialized) return;
        
        this.setupKeyboardShortcuts();
        this.isInitialized = true;
        console.log('⌨️ Keyboard shortcuts initialized');
    }

    /**
     * Setup keyboard shortcuts for copy, paste, delete, select all
     */
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Skip if typing in input fields
            if (this.isInputFocused(e.target)) {
                return;
            }

            const isCtrl = e.ctrlKey || e.metaKey;

            switch (e.key) {
                case 'c':
                case 'C':
                    if (isCtrl) {
                        e.preventDefault();
                        this.handleCopy();
                    }
                    break;
                
                case 'v':
                case 'V':
                    if (isCtrl) {
                        e.preventDefault();
                        this.handlePaste();
                    }
                    break;
                
                case 'Delete':
                case 'Backspace':
                    e.preventDefault();
                    this.handleDelete();
                    break;
                
                case 'a':
                case 'A':
                    if (isCtrl) {
                        e.preventDefault();
                        this.handleSelectAll();
                    }
                    break;
                
                case 'Escape':
                    this.handleEscape();
                    break;

                case 'd':
                case 'D':
                    if (isCtrl) {
                        e.preventDefault();
                        this.handleDuplicate();
                    }
                    break;
            }
        });
    }

    /**
     * Check if target element is an input field
     */
    isInputFocused(target) {
        const inputTypes = ['INPUT', 'TEXTAREA', 'SELECT'];
        return inputTypes.includes(target.tagName) || target.isContentEditable;
    }

    /**
     * Handle copy shortcut (Ctrl+C)
     */
    handleCopy() {
        if (this.clipboardManager) {
            this.clipboardManager.copySelectedComponents();
        } else {
            console.log('⌨️ Copy requested but no clipboard manager available');
        }
    }

    /**
     * Handle paste shortcut (Ctrl+V)
     */
    handlePaste() {
        if (this.clipboardManager) {
            this.clipboardManager.pasteComponents();
        } else {
            console.log('⌨️ Paste requested but no clipboard manager available');
        }
    }

    /**
     * Handle delete shortcut (Delete/Backspace)
     */
    handleDelete() {
        if (this.selectionCore && this.selectionCore.selectedComponents.size > 0) {
            this.deleteSelectedComponents();
        } else {
            console.log('⌨️ Delete requested but no components selected');
        }
    }

    /**
     * Handle select all shortcut (Ctrl+A)
     */
    handleSelectAll() {
        if (this.selectionCore) {
            this.selectionCore.selectAllComponents();
        } else {
            console.log('⌨️ Select all requested but no selection core available');
        }
    }

    /**
     * Handle escape key
     */
    handleEscape() {
        if (this.selectionCore) {
            this.selectionCore.clearSelection();
        }
        console.log('⌨️ Escape pressed - cleared selection');
    }

    /**
     * Handle duplicate shortcut (Ctrl+D)
     */
    handleDuplicate() {
        if (this.clipboardManager && this.selectionCore && this.selectionCore.selectedComponents.size > 0) {
            // Copy and immediately paste to create duplicates
            this.clipboardManager.copySelectedComponents();
            setTimeout(() => {
                this.clipboardManager.pasteComponents();
            }, 50);
        } else {
            console.log('⌨️ Duplicate requested but requirements not met');
        }
    }

    /**
     * Delete selected components
     */
    deleteSelectedComponents() {
        if (!this.selectionCore || this.selectionCore.selectedComponents.size === 0) {
            return;
        }

        const componentsToDelete = Array.from(this.selectionCore.selectedComponents);
        let deletedCount = 0;

        componentsToDelete.forEach(component => {
            try {
                const componentId = component.getAttribute('data-id');
                
                // Remove visual highlight
                this.selectionCore.unhighlightComponent(component);
                
                // Remove from DOM
                component.remove();
                deletedCount++;
                
                console.log(`🗑️ Deleted component: ${componentId}`);
            } catch (error) {
                console.error('Error deleting component:', error);
            }
        });

        // Clear selection
        this.selectionCore.selectedComponents.clear();
        
        // Notify other systems
        const event = new CustomEvent('components-deleted', {
            detail: { 
                deletedCount,
                componentIds: componentsToDelete.map(c => c.getAttribute('data-id'))
            }
        });
        document.dispatchEvent(event);

        // Update selection UI
        this.selectionCore.updateSelectionUI();
        
        // Show notification
        this.showNotification(`Deleted ${deletedCount} component${deletedCount !== 1 ? 's' : ''}`);
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
     * Get available shortcuts info
     */
    getShortcutsInfo() {
        return {
            'Ctrl+C': 'Copy selected components',
            'Ctrl+V': 'Paste components',
            'Ctrl+A': 'Select all components',
            'Ctrl+D': 'Duplicate selected components',
            'Delete/Backspace': 'Delete selected components',
            'Escape': 'Clear selection'
        };
    }
}

// Create and export singleton instance
export const keyboardShortcuts = new KeyboardShortcuts();
export default keyboardShortcuts;
