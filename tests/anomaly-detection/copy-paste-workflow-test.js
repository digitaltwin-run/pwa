/**
 * Copy-Paste Workflow Anomaly Test
 * 
 * WHAT IT TESTS:
 * - User selects component → presses Ctrl+C → presses Ctrl+V → new component appears
 * - Copy/paste events logged correctly
 * - New component created with proper data-id
 * 
 * DETECTED ANOMALIES:
 * - Copy key registered but no copy log
 * - Paste key registered but no new component
 * - Missing component creation events
 */

import { AnomalyTestBase } from './framework/anomaly-test-base.js';

export class CopyPasteWorkflowTest extends AnomalyTestBase {
    constructor() {
        super(
            'copy-paste-workflow-test',
            'Verifies that copy-paste workflow creates new components and logs events correctly'
        );
    }

    async execute() {
        console.info('🎯 Testing copy-paste workflow...');
        
        // Get available components
        const initialComponents = this.getCanvasComponents();
        if (initialComponents.length === 0) {
            this.addAnomaly('no_components_for_copy', {
                message: 'No components available for copy-paste test'
            }, 'high');
            return;
        }

        const targetComponent = initialComponents[0];
        const componentElement = document.querySelector(`[data-id="${targetComponent.id}"]`);
        
        // First, select the component
        console.info(`🖱️ Selecting component ${targetComponent.id} for copy`);
        
        const rect = componentElement.getBoundingClientRect();
        await this.simulateHMIEvent('mouse_click', {
            x: rect.x + rect.width / 2,
            y: rect.y + rect.height / 2,
            element: componentElement
        });

        await this.delay(300);

        // Verify component is selected
        const selectedComponents = this.getSelectedComponents();
        if (!selectedComponents.includes(targetComponent.id)) {
            this.addAnomaly('component_not_selected_for_copy', {
                componentId: targetComponent.id,
                selectedComponents: selectedComponents,
                message: 'Target component was not selected before copy operation'
            }, 'high');
            return;
        }

        // Setup assertions for copy operation
        this.addAssertion(
            'Copy key should generate HMI event',
            { type: 'copy_key' },
            { level: 'hmi', messageContains: 'copy_key' },
            500
        );

        this.addAssertion(
            'Paste key should generate HMI event', 
            { type: 'paste_key' },
            { level: 'hmi', messageContains: 'paste_key' },
            500
        );

        // Execute copy (Ctrl+C)
        console.info('📋 Executing copy operation (Ctrl+C)');
        await this.simulateHMIEvent('key_press', {
            key: 'c',
            code: 'KeyC',
            ctrlKey: true,
            target: document.body
        });

        await this.delay(300);

        // Execute paste (Ctrl+V)
        console.info('📋 Executing paste operation (Ctrl+V)');
        await this.simulateHMIEvent('key_press', {
            key: 'v',
            code: 'KeyV', 
            ctrlKey: true,
            target: document.body
        });

        await this.delay(1000); // Give time for component creation

        // Record final state
        const finalComponents = this.getCanvasComponents();
        
        this.initialComponents = initialComponents;
        this.finalComponents = finalComponents;
        this.targetComponent = targetComponent;
    }

    async verify() {
        console.info('🔍 Verifying copy-paste workflow results...');
        
        if (!this.targetComponent) {
            this.addAnomaly('copy_paste_test_incomplete', {
                message: 'Copy-paste test execution incomplete'
            }, 'high');
            return;
        }

        // Check if new component was created
        const initialCount = this.initialComponents.length;
        const finalCount = this.finalComponents.length;
        const newComponentsCreated = finalCount - initialCount;

        if (newComponentsCreated === 0) {
            this.addAnomaly('no_component_created_after_paste', {
                initialCount: initialCount,
                finalCount: finalCount,
                message: 'No new component was created after paste operation'
            }, 'high');
        } else if (newComponentsCreated > 1) {
            this.addAnomaly('multiple_components_created', {
                initialCount: initialCount,
                finalCount: finalCount,
                newComponentsCreated: newComponentsCreated,
                message: 'More components created than expected'
            }, 'medium');
        }

        // Check for copy/paste HMI events in logs
        const recentLogs = this.logCapture.getRecentLogs(this.startTime);
        
        const copyLogs = recentLogs.filter(log => 
            log.level === 'hmi' && log.message.includes('copy_key')
        );
        
        const pasteLogs = recentLogs.filter(log => 
            log.level === 'hmi' && log.message.includes('paste_key')
        );

        if (copyLogs.length === 0) {
            this.addAnomaly('missing_copy_hmi_log', {
                message: 'No copy_key HMI event found in logs'
            }, 'medium');
        }

        if (pasteLogs.length === 0) {
            this.addAnomaly('missing_paste_hmi_log', {
                message: 'No paste_key HMI event found in logs'
            }, 'medium');
        }

        // Check for component creation events
        const componentAddedLogs = recentLogs.filter(log => 
            log.level === 'hmi' && log.message.includes('component_added')
        );

        if (newComponentsCreated > 0 && componentAddedLogs.length === 0) {
            this.addAnomaly('missing_component_creation_log', {
                newComponentsCreated: newComponentsCreated,
                message: 'Component was created but no component_added event logged'
            }, 'medium');
        }

        // Verify new component properties
        if (newComponentsCreated === 1) {
            const newComponents = this.finalComponents.filter(comp => 
                !this.initialComponents.some(initial => initial.id === comp.id)
            );
            
            const newComponent = newComponents[0];
            if (newComponent) {
                // Check if new component has proper data-id
                if (!newComponent.id || newComponent.id === this.targetComponent.id) {
                    this.addAnomaly('invalid_new_component_id', {
                        originalId: this.targetComponent.id,
                        newId: newComponent.id,
                        message: 'New component has invalid or duplicate ID'
                    }, 'medium');
                }

                // Check if new component has proper positioning
                const distance = Math.sqrt(
                    Math.pow(newComponent.position.x - this.targetComponent.position.x, 2) +
                    Math.pow(newComponent.position.y - this.targetComponent.position.y, 2)
                );

                if (distance < 10) {
                    this.addAnomaly('new_component_overlapping', {
                        originalPosition: this.targetComponent.position,
                        newPosition: newComponent.position,
                        distance: distance,
                        message: 'New component is too close to original (potential overlap)'
                    }, 'low');
                }
            }
        }

        console.info(`✅ Copy-paste workflow test completed. Anomalies: ${this.anomalies.length}`);
    }
}

// Auto-register test
if (typeof window !== 'undefined') {
    window.CopyPasteWorkflowTest = CopyPasteWorkflowTest;
}
