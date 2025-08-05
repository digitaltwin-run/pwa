/**
 * Property Change Synchronization Anomaly Test
 * 
 * WHAT IT TESTS:
 * - User changes component property in properties panel → property updates in component
 * - Property change events logged correctly
 * - UI and component state stay synchronized
 * 
 * DETECTED ANOMALIES:
 * - Property UI changed but component not updated
 * - Missing property change logs
 * - UI-component state desync
 */

import { AnomalyTestBase } from './framework/anomaly-test-base.js';

export class PropertyChangeSyncTest extends AnomalyTestBase {
    constructor() {
        super(
            'property-change-sync-test',
            'Verifies that property panel changes properly update components and log events'
        );
    }

    async execute() {
        console.info('🎯 Testing property change synchronization...');
        
        // Get available components
        const components = this.getCanvasComponents();
        if (components.length === 0) {
            this.addAnomaly('no_components_for_property_test', {
                message: 'No components available for property change test'
            }, 'high');
            return;
        }

        const targetComponent = components[0];
        const componentElement = document.querySelector(`[data-id="${targetComponent.id}"]`);
        
        // Select component first
        console.info(`🖱️ Selecting component ${targetComponent.id} for property test`);
        const rect = componentElement.getBoundingClientRect();
        await this.simulateHMIEvent('mouse_click', {
            x: rect.x + rect.width / 2,
            y: rect.y + rect.height / 2,
            element: componentElement
        });

        await this.delay(500);

        // Look for color input in properties panel
        const colorInputs = document.querySelectorAll('input[type="color"]');
        const zoomInputs = document.querySelectorAll('input[data-property="zoom"]');
        
        let testInput = null;
        let testProperty = null;
        let initialValue = null;
        let newValue = null;

        // Try to find a testable property
        if (colorInputs.length > 0) {
            testInput = colorInputs[0];
            testProperty = 'color';
            initialValue = testInput.value;
            newValue = initialValue === '#ff0000' ? '#00ff00' : '#ff0000'; // Toggle red/green
        } else if (zoomInputs.length > 0) {
            testInput = zoomInputs[0];
            testProperty = 'zoom';
            initialValue = testInput.value;
            newValue = parseFloat(initialValue) === 1.0 ? '1.5' : '1.0'; // Toggle zoom
        }

        if (!testInput) {
            this.addAnomaly('no_testable_properties', {
                message: 'No testable properties found in properties panel',
                availableInputs: {
                    colorInputs: colorInputs.length,
                    zoomInputs: zoomInputs.length
                }
            }, 'medium');
            return;
        }

        // Record initial component state
        const initialComponentState = this.captureComponentState(componentElement, testProperty);

        // Setup assertions
        this.addAssertion(
            'Property input change should generate event',
            { type: 'input_change', property: testProperty },
            { level: 'hmi', messageContains: 'property_changed' },
            1000
        );

        // Execute property change
        console.info(`🔧 Changing ${testProperty} from ${initialValue} to ${newValue}`);
        
        // Change input value
        testInput.value = newValue;
        testInput.dispatchEvent(new Event('input', { bubbles: true }));
        testInput.dispatchEvent(new Event('change', { bubbles: true }));

        await this.delay(1000); // Give time for change to propagate

        // Record final component state
        const finalComponentState = this.captureComponentState(componentElement, testProperty);

        // Store for verification
        this.targetComponent = targetComponent;
        this.testProperty = testProperty;
        this.initialValue = initialValue;
        this.newValue = newValue;
        this.initialComponentState = initialComponentState;
        this.finalComponentState = finalComponentState;
        this.testInput = testInput;
    }

    async verify() {
        console.info('🔍 Verifying property change synchronization...');
        
        if (!this.targetComponent) {
            this.addAnomaly('property_test_incomplete', {
                message: 'Property test execution incomplete'
            }, 'high');
            return;
        }

        // Check if property actually changed in component
        const propertyChanged = this.hasPropertyChanged();
        
        if (!propertyChanged) {
            this.addAnomaly('property_not_updated_in_component', {
                componentId: this.targetComponent.id,
                property: this.testProperty,
                expectedValue: this.newValue,
                initialState: this.initialComponentState,
                finalState: this.finalComponentState,
                message: 'Property changed in UI but component not updated'
            }, 'high');
        }

        // Check for property change logs
        const recentLogs = this.logCapture.getRecentLogs(this.startTime);
        
        const propertyChangeLogs = recentLogs.filter(log => 
            log.level === 'hmi' && log.message.includes('property_changed')
        );

        if (propertyChangeLogs.length === 0) {
            this.addAnomaly('missing_property_change_log', {
                property: this.testProperty,
                componentId: this.targetComponent.id,
                message: 'Property was changed but no property_changed event logged'
            }, 'medium');
        }

        // Check input consistency
        const currentInputValue = this.testInput.value;
        if (currentInputValue !== this.newValue) {
            this.addAnomaly('input_value_reverted', {
                expectedValue: this.newValue,
                currentValue: currentInputValue,
                message: 'Input value reverted after change'
            }, 'medium');
        }

        console.info(`✅ Property change sync test completed. Anomalies: ${this.anomalies.length}`);
    }

    captureComponentState(element, property) {
        const state = {
            timestamp: Date.now(),
            style: element.style.cssText,
            attributes: {},
            computedStyle: {}
        };

        // Capture relevant attributes
        ['fill', 'stroke', 'transform', 'data-zoom'].forEach(attr => {
            if (element.hasAttribute(attr)) {
                state.attributes[attr] = element.getAttribute(attr);
            }
        });

        // Capture computed styles for color properties
        if (property === 'color') {
            const computed = window.getComputedStyle(element);
            state.computedStyle.fill = computed.fill;
            state.computedStyle.stroke = computed.stroke;
            state.computedStyle.color = computed.color;
        }

        return state;
    }

    hasPropertyChanged() {
        if (this.testProperty === 'color') {
            // Check if fill/stroke attributes changed
            return (
                this.finalComponentState.attributes.fill !== this.initialComponentState.attributes.fill ||
                this.finalComponentState.attributes.stroke !== this.initialComponentState.attributes.stroke ||
                this.finalComponentState.style !== this.initialComponentState.style
            );
        } else if (this.testProperty === 'zoom') {
            // Check if transform changed
            return (
                this.finalComponentState.attributes.transform !== this.initialComponentState.attributes.transform ||
                this.finalComponentState.attributes['data-zoom'] !== this.initialComponentState.attributes['data-zoom']
            );
        }
        
        return false;
    }
}

// Auto-register test
if (typeof window !== 'undefined') {
    window.PropertyChangeSyncTest = PropertyChangeSyncTest;
}
