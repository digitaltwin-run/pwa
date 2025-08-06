/**
 * HMI Input Systems - Unified mouse, keyboard, and touch input handling
 * @module hmi/input
 */

// Export all input-related modules
export { MouseHandler } from './mouse-handler.js';
export { KeyboardHandler } from './keyboard-handler.js';
export { TouchHandler } from './touch-handler.js';
export { SelectionManager } from './selection-manager.js';
export { DragDropManager } from './dragdrop-manager.js';

// Re-export for backwards compatibility
export { default as mouseHandler } from './mouse-handler.js';
export { default as keyboardHandler } from './keyboard-handler.js';
export { default as selectionManager } from './selection-manager.js';
