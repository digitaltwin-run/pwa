/**
 * HMI INTEGRATION FOR MAIN APPLICATION
 * Replaces traditional event listeners with advanced HMI system
 * Supports multi-modal input detection (keyboard + mouse + touch + time)
 * 
 * Features:
 * - Complex gesture combinations (Ctrl+Circle, Shift+Drag, etc.)
 * - Keyboard shortcut patterns with mouse context
 * - Time-based action sequences
 * - User skill level adaptation
 * - Performance-optimized detection
 */

import { HMISystem } from '../core/hmi-system.js';

/**
 * 🎮 MULTI-MODAL HMI INTEGRATION
 */
export class AppHMIIntegration {
    constructor() {
        this.hmiSystem = null;
        this.keyboardState = new Map();
        this.multiModalPatterns = new Map();
        this.actionHistory = [];
        this.userSkillLevel = 'beginner';
        
        // Reference to main app managers
        this.managers = {};
    }

    /**
     * 🚀 INITIALIZE HMI INTEGRATION
     */
    async init(appManagers) {
        console.info('🎮 Initializing multi-modal HMI integration...');

        this.managers = appManagers;
        
        this.hmiSystem = new HMISystem({
            performanceMode: false,
            tolerance: 0.15,
            enableMultiModal: true // Custom flag for our integration
        });

        await this.hmiSystem.init();

        // Setup different input modality integrations
        this.setupKeyboardIntegration();
        this.setupMultiModalPatterns();
        this.setupContextAwareGestures();
        this.setupAdaptivePatterns();
        this.setupPerformancePatterns();

        console.info('✅ Multi-modal HMI integration ready');
        return this;
    }

    /**
     * ⌨️ KEYBOARD STATE TRACKING & INTEGRATION
     */
    setupKeyboardIntegration() {
        console.info('⌨️ Setting up keyboard integration...');

        // Track keyboard state for multi-modal detection
        document.addEventListener('keydown', (e) => {
            this.keyboardState.set(e.code, {
                pressed: true,
                timestamp: performance.now(),
                modifiers: {
                    ctrl: e.ctrlKey,
                    shift: e.shiftKey,
                    alt: e.altKey,
                    meta: e.metaKey
                }
            });
            
            this.detectKeyboardMouseCombos(e);
        });

        document.addEventListener('keyup', (e) => {
            this.keyboardState.set(e.code, {
                pressed: false,
                timestamp: performance.now()
            });
        });

        // KEYBOARD-ENHANCED GESTURES
        this.hmiSystem.gesture('ctrl_circle_delete')
            .custom((mouseHistory) => {
                const hasCtrl = this.isKeyPressed('ControlLeft') || this.isKeyPressed('ControlRight');
                const circle = this.detectCircle(mouseHistory);
                return hasCtrl && circle.matches;
            })
            .on(() => this.executeEnhancedDelete());

        this.hmiSystem.gesture('shift_drag_multi_select')
            .custom((mouseHistory) => {
                const hasShift = this.isKeyPressed('ShiftLeft') || this.isKeyPressed('ShiftRight');
                const drag = this.detectDrag(mouseHistory);
                return hasShift && drag.matches;
            })
            .on((data) => this.executeMultiSelect(data.result));

        this.hmiSystem.gesture('alt_circle_properties')
            .custom((mouseHistory) => {
                const hasAlt = this.isKeyPressed('AltLeft') || this.isKeyPressed('AltRight');
                const circle = this.detectCircle(mouseHistory);
                return hasAlt && circle.matches;
            })
            .on((data) => this.showAdvancedProperties(data.result));

        console.info('✅ Keyboard integration configured');
    }

    /**
     * 🎪 MULTI-MODAL PATTERN DETECTION
     */
    setupMultiModalPatterns() {
        console.info('🎪 Setting up multi-modal patterns...');

        // COMPLEX WORKFLOW PATTERNS
        this.hmiSystem.gesture('save_workflow')
            .sequence(
                { type: 'keyboard', key: 'KeyS', modifiers: ['ctrl'] },
                { type: 'mouseCircle', radius: 50, timeout: 2000 },
                { type: 'tap', count: 1, timeout: 1000 }
            )
            .on(() => this.executeSaveWorkflow());

        this.hmiSystem.gesture('expert_navigation')
            .custom((mouseHistory) => {
                return this.detectExpertNavigationPattern(mouseHistory);
            })
            .on((data) => this.executeExpertNavigation(data.result));

        // TIME-BASED PATTERNS
        this.hmiSystem.gesture('rapid_fire_actions')
            .custom((mouseHistory) => {
                return this.detectRapidFirePattern(mouseHistory);
            })
            .on((data) => this.executeRapidFireActions(data.result));

        // GESTURE + KEYBOARD SHORTCUTS
        this.hmiSystem.gesture('power_user_combo')
            .custom((mouseHistory) => {
                return this.detectPowerUserCombo(mouseHistory);
            })
            .on((data) => this.executePowerUserCombo(data.result));

        console.info('✅ Multi-modal patterns configured');
    }

    /**
     * 🧠 CONTEXT-AWARE GESTURE ADAPTATION
     */
    setupContextAwareGestures() {
        console.info('🧠 Setting up context-aware gestures...');

        // ADAPTIVE CIRCLE GESTURE - Changes based on context and modifiers
        this.hmiSystem.gesture('adaptive_circle')
            .mouseCircle(60, 0.3)
            .on((data) => {
                const context = this.getCurrentContext();
                const modifiers = this.getCurrentModifiers();
                
                this.executeAdaptiveCircle(context, modifiers, data.result);
            });

        // SMART DRAG - Behavior changes based on selection and modifiers
        this.hmiSystem.gesture('smart_drag')
            .mouseDrag(20)
            .on((data) => {
                const hasSelection = this.hasSelectedComponents();
                const modifiers = this.getCurrentModifiers();
                
                this.executeSmartDrag(hasSelection, modifiers, data.result);
            });

        // CONTEXT-SENSITIVE TAP
        this.hmiSystem.gesture('context_tap')
            .tap(1)
            .on((data) => {
                const element = document.elementFromPoint(data.result.x, data.result.y);
                const context = this.getElementContext(element);
                
                this.executeContextTap(context, element, data.result);
            });

        console.info('✅ Context-aware gestures configured');
    }

    /**
     * 📈 ADAPTIVE PATTERNS - Learn from user behavior
     */
    setupAdaptivePatterns() {
        console.info('📈 Setting up adaptive patterns...');

        // LEARNING GESTURE TOLERANCE
        this.hmiSystem.gesture('learning_circle')
            .custom((mouseHistory) => {
                const tolerance = this.getAdaptiveTolerance('circle');
                return this.detectCircleWithTolerance(mouseHistory, tolerance);
            })
            .on((data) => {
                this.updateGestureLearning('circle', data.result);
                this.executeLearnedCircle(data.result);
            });

        // SKILL-BASED PATTERNS
        this.hmiSystem.gesture('skill_based_action')
            .custom((mouseHistory) => {
                return this.detectSkillBasedPattern(mouseHistory);
            })
            .on((data) => {
                this.executeSkillBasedAction(data.result);
            });

        console.info('✅ Adaptive patterns configured');
    }

    /**
     * ⚡ PERFORMANCE-OPTIMIZED PATTERNS
     */
    setupPerformancePatterns() {
        console.info('⚡ Setting up performance patterns...');

        // EMERGENCY PATTERNS - Zero latency
        this.hmiSystem.gesture('emergency_stop')
            .custom((mouseHistory) => {
                return this.detectEmergencyPattern(mouseHistory);
            })
            .cooldown(0)
            .on(() => this.executeEmergencyStop());

        // BATCH OPERATIONS - Optimized for multiple actions
        this.hmiSystem.gesture('batch_select')
            .custom((mouseHistory) => {
                return this.detectBatchSelectPattern(mouseHistory);
            })
            .on((data) => this.executeBatchSelect(data.result));

        console.info('✅ Performance patterns configured');
    }

    /**
     * 🎯 MULTI-MODAL DETECTION ALGORITHMS
     */
    detectKeyboardMouseCombos(keyEvent) {
        const currentMouse = this.hmiSystem.getLastMousePosition();
        
        // Detect keyboard shortcuts with mouse context
        const combo = {
            key: keyEvent.code,
            modifiers: {
                ctrl: keyEvent.ctrlKey,
                shift: keyEvent.shiftKey,
                alt: keyEvent.altKey
            },
            mouseContext: this.getMouseContext(currentMouse),
            timestamp: performance.now()
        };

        this.processKeyboardMouseCombo(combo);
    }

    detectExpertNavigationPattern(mouseHistory) {
        if (this.userSkillLevel !== 'expert') return { matches: false };
        
        // Expert users: rapid movements with precision
        const rapidMovements = this.detectRapidPrecisionMovements(mouseHistory);
        const hasKeyboardShortcuts = this.hasRecentKeyboardActivity();
        
        return {
            matches: rapidMovements && hasKeyboardShortcuts,
            confidence: 0.85,
            pattern: 'expert_navigation'
        };
    }

    detectRapidFirePattern(mouseHistory) {
        if (mouseHistory.length < 10) return { matches: false };

        // Detect rapid succession of actions (< 200ms between actions)
        const actions = this.segmentIntoActions(mouseHistory);
        const rapidActions = actions.filter(action => action.duration < 200);
        
        return {
            matches: rapidActions.length >= 3,
            actions: rapidActions,
            totalActions: actions.length,
            confidence: rapidActions.length / actions.length
        };
    }

    detectPowerUserCombo(mouseHistory) {
        // Complex pattern: Keyboard shortcut + Gesture + Timing
        const hasKeyboardShortcut = this.hasRecentKeyboardShortcut();
        const hasGesture = this.detectAnyGesture(mouseHistory);
        const correctTiming = this.validateComboTiming();
        
        return {
            matches: hasKeyboardShortcut && hasGesture && correctTiming,
            components: {
                keyboard: hasKeyboardShortcut,
                gesture: hasGesture,
                timing: correctTiming
            },
            confidence: 0.9
        };
    }

    /**
     * 🎬 ADVANCED ACTION EXECUTORS
     */
    executeEnhancedDelete() {
        console.info('🗑️ Enhanced delete with Ctrl+Circle');
        
        // More powerful delete with confirmation for multiple items
        const selectedCount = this.getSelectedComponentCount();
        
        if (selectedCount > 3) {
            this.showDeletionConfirmation(selectedCount);
        } else {
            this.managers.propertiesManager?.removeSelectedComponents();
        }
        
        this.trackAdvancedAction('enhanced_delete', { count: selectedCount });
    }

    executeMultiSelect(dragData) {
        console.info('🎯 Multi-select with Shift+Drag');
        
        // Advanced multi-selection with smart area detection
        const components = this.getComponentsInArea(dragData.bounds);
        const existingSelection = this.getSelectedComponents();
        
        // Add to existing selection instead of replacing
        const newSelection = [...existingSelection, ...components];
        this.setSelectedComponents(newSelection);
        
        this.showSelectionFeedback(newSelection.length);
        this.trackAdvancedAction('multi_select', { count: newSelection.length });
    }

    executeAdaptiveCircle(context, modifiers, circleData) {
        console.info(`🎯 Adaptive circle in ${context} context`, modifiers);
        
        // Behavior adapts based on context and modifiers
        switch (context) {
            case 'canvas':
                if (modifiers.ctrl) {
                    this.deleteInCircle(circleData);
                } else if (modifiers.shift) {
                    this.selectInCircle(circleData);
                } else if (modifiers.alt) {
                    this.showCircleMenu(circleData);
                } else {
                    this.createSelectionCircle(circleData);
                }
                break;
                
            case 'properties':
                if (modifiers.ctrl) {
                    this.resetProperties();
                } else {
                    this.showPropertyHelp();
                }
                break;
                
            case 'sidebar':
                this.refreshComponentPalette();
                break;
                
            default:
                this.showContextHelp(circleData.center);
        }
        
        this.trackAdvancedAction('adaptive_circle', { context, modifiers });
    }

    executeSmartDrag(hasSelection, modifiers, dragData) {
        console.info('🚀 Smart drag execution', { hasSelection, modifiers });
        
        if (hasSelection) {
            if (modifiers.ctrl) {
                this.copyDragSelectedComponents(dragData);
            } else if (modifiers.shift) {
                this.constrainedDragSelectedComponents(dragData);
            } else {
                this.moveSelectedComponents(dragData);
            }
        } else {
            if (modifiers.shift) {
                this.createSelectionArea(dragData);
            } else {
                this.panCanvas(dragData);
            }
        }
        
        this.trackAdvancedAction('smart_drag', { hasSelection, modifiers });
    }

    executePowerUserCombo(comboData) {
        console.info('💪 Power user combo executed!', comboData);
        
        // Execute complex workflow based on detected combination
        const { keyboard, gesture, timing } = comboData.components;
        
        // Combine actions intelligently
        if (keyboard.includes('save') && gesture.type === 'circle') {
            this.executeAdvancedSave();
        } else if (keyboard.includes('copy') && gesture.type === 'swipe') {
            this.executeAdvancedCopy(gesture.direction);
        } else {
            this.executeGenericPowerAction(comboData);
        }
        
        this.trackAdvancedAction('power_combo', comboData);
    }

    /**
     * 🧠 INTELLIGENT HELPERS
     */
    getCurrentContext() {
        const activeElement = document.activeElement;
        const mousePosition = this.hmiSystem.getLastMousePosition();
        
        if (!mousePosition) return 'unknown';
        
        const element = document.elementFromPoint(mousePosition.x, mousePosition.y);
        
        if (element?.closest('#svg-canvas')) return 'canvas';
        if (element?.closest('.properties-panel')) return 'properties';
        if (element?.closest('.sidebar')) return 'sidebar';
        if (element?.closest('.toolbar')) return 'toolbar';
        
        return 'workspace';
    }

    getCurrentModifiers() {
        const modifiers = {};
        
        for (const [key, state] of this.keyboardState) {
            if (state.pressed && state.modifiers) {
                Object.assign(modifiers, state.modifiers);
            }
        }
        
        return modifiers;
    }

    isKeyPressed(keyCode) {
        const state = this.keyboardState.get(keyCode);
        return state?.pressed === true;
    }

    hasRecentKeyboardActivity() {
        const now = performance.now();
        const recentThreshold = 1000; // 1 second
        
        for (const [key, state] of this.keyboardState) {
            if (now - state.timestamp < recentThreshold) {
                return true;
            }
        }
        
        return false;
    }

    getAdaptiveTolerance(gestureType) {
        // Learn user's gesture precision over time
        const history = this.getGestureHistory(gestureType);
        if (history.length < 5) return 0.3; // Default tolerance
        
        const averageDeviation = this.calculateAverageDeviation(history);
        return Math.max(0.1, Math.min(0.5, averageDeviation * 1.2));
    }

    /**
     * 📊 ADVANCED ANALYTICS & LEARNING
     */
    trackAdvancedAction(actionType, data) {
        const analytics = {
            type: actionType,
            timestamp: performance.now(),
            context: this.getCurrentContext(),
            modifiers: this.getCurrentModifiers(),
            userSkillLevel: this.userSkillLevel,
            data
        };

        this.actionHistory.push(analytics);
        
        // Keep only recent history for performance
        if (this.actionHistory.length > 1000) {
            this.actionHistory = this.actionHistory.slice(-800);
        }

        // Update user skill level based on action complexity
        this.updateUserSkillLevel(analytics);
        
        console.info(`📊 Advanced action tracked: ${actionType}`, analytics);
        
        // Send to analytics if available
        if (window.analyticsManager?.trackAdvancedHMI) {
            window.analyticsManager.trackAdvancedHMI(analytics);
        }
    }

    updateUserSkillLevel(actionData) {
        const complexActions = this.actionHistory.filter(a => 
            a.type.includes('combo') || 
            a.type.includes('expert') || 
            a.type.includes('rapid')
        );
        
        const recentComplexActions = complexActions.filter(a => 
            performance.now() - a.timestamp < 300000 // Last 5 minutes
        );
        
        if (recentComplexActions.length > 10) {
            this.userSkillLevel = 'expert';
        } else if (recentComplexActions.length > 5) {
            this.userSkillLevel = 'advanced';
        } else if (recentComplexActions.length > 2) {
            this.userSkillLevel = 'intermediate';
        }
        
        console.info(`👤 User skill level: ${this.userSkillLevel}`);
    }

    /**
     * 🎯 INTEGRATION WITH EXISTING MANAGERS
     */
    getSelectedComponents() {
        return this.managers.canvasSelectionManager?.getSelectedComponents() || [];
    }

    setSelectedComponents(components) {
        this.managers.canvasSelectionManager?.setSelectedComponents(components);
    }

    hasSelectedComponents() {
        return this.getSelectedComponents().length > 0;
    }

    /**
     * 📊 PERFORMANCE METRICS
     */
    getAdvancedMetrics() {
        return {
            totalActions: this.actionHistory.length,
            userSkillLevel: this.userSkillLevel,
            keyboardState: this.keyboardState.size,
            multiModalPatterns: this.multiModalPatterns.size,
            recentActionTypes: this.getRecentActionTypes(),
            gestureAccuracy: this.calculateGestureAccuracy(),
            averageResponseTime: this.calculateAverageResponseTime()
        };
    }

    /**
     * 🧹 CLEANUP
     */
    destroy() {
        // Clear all state
        this.keyboardState.clear();
        this.multiModalPatterns.clear();
        this.actionHistory.length = 0;
        
        // Remove any UI elements
        document.querySelectorAll('.hmi-feedback, .hmi-suggestion').forEach(el => el.remove());
        
        if (this.hmiSystem) {
            this.hmiSystem.destroy();
        }
        
        console.info('🧹 Multi-modal HMI integration destroyed');
    }
}

/**
 * 🎯 EASY INTEGRATION FUNCTION
 */
export async function integrateHMIWithApp(appInstance) {
    console.info('🔄 Integrating HMI system with main application...');
    
    const hmiIntegration = new AppHMIIntegration();
    
    // Extract managers from app instance
    const managers = {
        componentManager: appInstance.componentManager,
        propertiesManager: appInstance.propertiesManager,
        canvasSelectionManager: appInstance.canvasSelectionManager,
        actionManager: appInstance.actionManager,
        dragDropManager: appInstance.dragDropManager,
        exportManager: appInstance.exportManager
    };
    
    await hmiIntegration.init(managers);
    
    // Expose globally for debugging
    window.hmiIntegration = hmiIntegration;
    
    console.info('✅ HMI integration complete!');
    console.info('🎮 Try these multi-modal gestures:');
    console.info('  • Ctrl + Circle = Enhanced delete');
    console.info('  • Shift + Drag = Multi-select');  
    console.info('  • Alt + Circle = Advanced properties');
    console.info('  • Ctrl+S → Circle → Tap = Save workflow');
    
    return hmiIntegration;
}

export default AppHMIIntegration;
