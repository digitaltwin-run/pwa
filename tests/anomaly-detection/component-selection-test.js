/**
 * Component Selection Anomaly Test
 * 
 * WHAT IT TESTS:
 * - User clicks on SVG component → should select component
 * - Selection should be reflected in logs and UI state
 * 
 * DETECTED ANOMALIES:
 * - Click registered but component not selected
 * - Selection UI doesn't update
 * - Missing HMI→Log correlation
 */

import { AnomalyTestBase } from './framework/anomaly-test-base.js';

export class ComponentSelectionTest extends AnomalyTestBase {
    constructor() {
        super(
            'component-selection-test',
            'Verifies that clicking on SVG components properly selects them and updates logs/UI'
        );
    }

    async execute() {
        console.info('🎯 Testing component selection...');
        
        // Get first available component on canvas
        const components = this.getCanvasComponents();
        if (components.length === 0) {
            this.addAnomaly('no_components_available', {
                message: 'No components found on canvas for selection test'
            }, 'high');
            return;
        }

        const targetComponent = components[0];
        const componentElement = document.querySelector(`[data-id="${targetComponent.id}"]`);
        
        if (!componentElement) {
            this.addAnomaly('component_element_not_found', {
                componentId: targetComponent.id,
                message: 'Component element not found in DOM'
            }, 'high');
            return;
        }

        // Record pre-click state
        const preClickState = {
            selectedBefore: this.getSelectedComponents(),
            componentClasses: componentElement.className,
            timestamp: Date.now()
        };

        // Setup assertion: click should produce selection
        this.addAssertion(
            'Component click should generate HMI event',
            { type: 'mouse_click', componentId: targetComponent.id },
            { level: 'hmi', messageContains: 'mouse_down' },
            1000
        );

        this.addAssertion(
            'Component selection should update state',
            { type: 'selection_change', componentId: targetComponent.id },
            { level: 'hmi', messageContains: 'selection_changed' },
            2000
        );

        // Execute click
        const clickPosition = {
            x: targetComponent.position.x + targetComponent.position.width / 2,
            y: targetComponent.position.y + targetComponent.position.height / 2
        };

        console.info(`🖱️ Clicking component ${targetComponent.id} at`, clickPosition);
        
        await this.simulateHMIEvent('mouse_click', {
            x: clickPosition.x,
            y: clickPosition.y,
            element: componentElement
        });

        // Wait for selection to process
        await this.delay(500);

        // Record post-click state
        const postClickState = {
            selectedAfter: this.getSelectedComponents(),
            componentClasses: componentElement.className,
            timestamp: Date.now()
        };

        // Store states for verification
        this.preClickState = preClickState;
        this.postClickState = postClickState;
        this.targetComponent = targetComponent;
    }

    async verify() {
        console.info('🔍 Verifying component selection results...');
        
        if (!this.targetComponent) {
            this.addAnomaly('test_execution_incomplete', {
                message: 'Test execution did not complete properly'
            }, 'high');
            return;
        }

        // Check if component was selected
        const wasSelected = this.postClickState.selectedAfter.includes(this.targetComponent.id);
        const wasAlreadySelected = this.preClickState.selectedBefore.includes(this.targetComponent.id);

        if (!wasSelected && !wasAlreadySelected) {
            this.addAnomaly('component_selection_failed', {
                componentId: this.targetComponent.id,
                preClickSelected: this.preClickState.selectedBefore,
                postClickSelected: this.postClickState.selectedAfter,
                message: 'Component was not selected after click'
            }, 'high');
        }

        // Check for HMI event logs
        const hmiLogs = this.logCapture.getRecentLogs(this.preClickState.timestamp);
        const clickLogs = hmiLogs.filter(log => 
            log.level === 'hmi' && log.message.includes('mouse_down')
        );

        if (clickLogs.length === 0) {
            this.addAnomaly('missing_hmi_click_log', {
                message: 'No HMI mouse_down event found in logs',
                timeRange: {
                    from: this.preClickState.timestamp,
                    to: this.postClickState.timestamp
                }
            }, 'medium');
        }

        // Check for selection change logs
        const selectionLogs = hmiLogs.filter(log => 
            log.level === 'hmi' && log.message.includes('selection_changed')
        );

        if (wasSelected && !wasAlreadySelected && selectionLogs.length === 0) {
            this.addAnomaly('missing_selection_change_log', {
                message: 'Component was selected but no selection_changed log found',
                componentId: this.targetComponent.id
            }, 'medium');
        }

        // Check UI state consistency
        const componentElement = document.querySelector(`[data-id="${this.targetComponent.id}"]`);
        const hasSelectedClass = componentElement?.classList.contains('selected');
        
        if (wasSelected && !hasSelectedClass) {
            this.addAnomaly('ui_state_inconsistency', {
                message: 'Component reported as selected but missing selected CSS class',
                componentId: this.targetComponent.id,
                hasSelectedClass: hasSelectedClass,
                reportedAsSelected: wasSelected
            }, 'medium');
        }

        console.info(`✅ Component selection test completed. Anomalies: ${this.anomalies.length}`);
    }
}

// Auto-register test
if (typeof window !== 'undefined') {
    window.ComponentSelectionTest = ComponentSelectionTest;
}
