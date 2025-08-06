/**
 * HMI Keyboard Handler - Unified keyboard shortcuts and input management
 * Migrated and enhanced from js/selection/keyboard-shortcuts.js
 * @module hmi/input
 */

export class KeyboardHandler {
    constructor() {
        this.shortcuts = new Map();
        this.selectionCore = null;
        this.clipboardManager = null;
        this.isInitialized = false;
        
        // Default shortcuts
        this.defaultShortcuts = {
            'Delete': 'deleteSelection',
            'Backspace': 'deleteSelection',
            'Ctrl+A': 'selectAll',
            'Ctrl+C': 'copy',
            'Ctrl+V': 'paste',
            'Ctrl+X': 'cut',
            'Ctrl+Z': 'undo',
            'Ctrl+Y': 'redo',
            'Ctrl+S': 'save',
            'Escape': 'clearSelection',
            'Ctrl+D': 'duplicate',
            'Ctrl+G': 'group',
            'Ctrl+Shift+G': 'ungroup'
        };
    }

    /**
     * Initialize keyboard handler
     */
    init() {
        if (this.isInitialized) return;

        this.setupKeyboardListeners();
        this.registerDefaultShortcuts();
        this.isInitialized = true;
        
        console.log('⌨️ HMI Keyboard Handler initialized');
    }

    /**
     * Set references to other managers
     */
    setReferences(selectionCore, clipboardManager) {
        this.selectionCore = selectionCore;
        this.clipboardManager = clipboardManager;
    }

    /**
     * Setup keyboard event listeners
     */
    setupKeyboardListeners() {
        document.addEventListener('keydown', (e) => this.handleKeyDown(e));
        document.addEventListener('keyup', (e) => this.handleKeyUp(e));
        
        // Prevent default browser shortcuts that conflict with our app
        document.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && ['s', 'a', 'z', 'y'].includes(e.key.toLowerCase())) {
                e.preventDefault();
            }
        });
    }

    /**
     * Register default keyboard shortcuts
     */
    registerDefaultShortcuts() {
        Object.entries(this.defaultShortcuts).forEach(([shortcut, action]) => {
            this.registerShortcut(shortcut, action);
        });
    }

    /**
     * Register a keyboard shortcut
     */
    registerShortcut(keys, action) {
        const normalizedKeys = this.normalizeKeys(keys);
        this.shortcuts.set(normalizedKeys, action);
        console.log(`⌨️ Registered shortcut: ${keys} → ${action}`);
    }

    /**
     * Unregister a keyboard shortcut
     */
    unregisterShortcut(keys) {
        const normalizedKeys = this.normalizeKeys(keys);
        this.shortcuts.delete(normalizedKeys);
    }

    /**
     * Handle key down events
     */
    handleKeyDown(e) {
        // Skip if user is typing in an input field
        if (this.isTypingInInput(e.target)) return;

        const keyCombo = this.getKeyCombo(e);
        const action = this.shortcuts.get(keyCombo);

        if (action) {
            e.preventDefault();
            this.executeAction(action, e);
            console.log(`⌨️ Executed shortcut: ${keyCombo} → ${action}`);
        }
    }

    /**
     * Handle key up events
     */
    handleKeyUp(e) {
        // Handle any key release actions if needed
    }

    /**
     * Execute keyboard action
     */
    executeAction(action, event) {
        switch (action) {
            case 'deleteSelection':
                this.deleteSelectedComponents();
                break;
            case 'selectAll':
                this.selectAllComponents();
                break;
            case 'copy':
                this.copySelectedComponents();
                break;
            case 'paste':
                this.pasteComponents();
                break;
            case 'cut':
                this.cutSelectedComponents();
                break;
            case 'undo':
                this.triggerGlobalAction('undo');
                break;
            case 'redo':
                this.triggerGlobalAction('redo');
                break;
            case 'save':
                this.triggerGlobalAction('save');
                break;
            case 'clearSelection':
                this.clearSelection();
                break;
            case 'duplicate':
                this.duplicateSelectedComponents();
                break;
            case 'group':
                this.groupSelectedComponents();
                break;
            case 'ungroup':
                this.ungroupSelectedComponents();
                break;
            default:
                console.warn(`⌨️ Unknown action: ${action}`);
        }
    }

    /**
     * Delete selected components
     */
    deleteSelectedComponents() {
        if (!this.selectionCore) return;

        const selection = this.selectionCore.getSelectionInfo();
        if (selection.isEmpty) {
            console.log('⌨️ No components selected to delete');
            return;
        }

        // Trigger delete event for other systems to handle
        const event = new CustomEvent('hmi-delete-components', {
            detail: { components: selection.components }
        });
        document.dispatchEvent(event);

        console.log(`⌨️ Deleted ${selection.count} components`);
    }

    /**
     * Select all components
     */
    selectAllComponents() {
        if (this.selectionCore) {
            this.selectionCore.selectAllComponents();
        }
    }

    /**
     * Copy selected components
     */
    copySelectedComponents() {
        if (this.clipboardManager) {
            this.clipboardManager.copySelectedComponents();
        }
    }

    /**
     * Paste components
     */
    pasteComponents() {
        if (this.clipboardManager) {
            this.clipboardManager.pasteComponents();
        }
    }

    /**
     * Cut selected components
     */
    cutSelectedComponents() {
        this.copySelectedComponents();
        this.deleteSelectedComponents();
    }

    /**
     * Clear selection
     */
    clearSelection() {
        if (this.selectionCore) {
            this.selectionCore.clearSelection();
        }
    }

    /**
     * Duplicate selected components
     */
    duplicateSelectedComponents() {
        this.copySelectedComponents();
        // Small delay to ensure copy is complete
        setTimeout(() => this.pasteComponents(), 50);
    }

    /**
     * Group selected components
     */
    groupSelectedComponents() {
        const event = new CustomEvent('hmi-group-components');
        document.dispatchEvent(event);
    }

    /**
     * Ungroup selected components
     */
    ungroupSelectedComponents() {
        const event = new CustomEvent('hmi-ungroup-components');
        document.dispatchEvent(event);
    }

    /**
     * Trigger global action (undo, redo, save, etc.)
     */
    triggerGlobalAction(action) {
        const event = new CustomEvent(`hmi-${action}`);
        document.dispatchEvent(event);
    }

    /**
     * Get key combination string from event
     */
    getKeyCombo(e) {
        const modifiers = [];
        if (e.ctrlKey || e.metaKey) modifiers.push('Ctrl');
        if (e.shiftKey) modifiers.push('Shift');
        if (e.altKey) modifiers.push('Alt');

        let key = e.key;
        if (key === ' ') key = 'Space';
        if (key.length === 1) key = key.toUpperCase();

        return [...modifiers, key].join('+');
    }

    /**
     * Normalize keys for consistent storage
     */
    normalizeKeys(keys) {
        return keys.split('+').map(key => {
            if (key.toLowerCase() === 'cmd') return 'Ctrl';
            return key;
        }).join('+');
    }

    /**
     * Check if user is typing in an input field
     */
    isTypingInInput(target) {
        const inputTypes = ['input', 'textarea', 'select'];
        const isInput = inputTypes.includes(target.tagName.toLowerCase());
        const isContentEditable = target.contentEditable === 'true';
        
        return isInput || isContentEditable;
    }

    /**
     * Get all registered shortcuts
     */
    getShortcuts() {
        return Array.from(this.shortcuts.entries()).map(([keys, action]) => ({
            keys,
            action
        }));
    }

    /**
     * Destroy keyboard handler
     */
    destroy() {
        document.removeEventListener('keydown', this.handleKeyDown);
        document.removeEventListener('keyup', this.handleKeyUp);
        this.shortcuts.clear();
        this.isInitialized = false;
        
        console.log('⌨️ HMI Keyboard Handler destroyed');
    }
}

// Create and export singleton instance
export const keyboardHandler = new KeyboardHandler();
export default keyboardHandler;
