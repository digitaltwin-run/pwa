/**
 * Mouse Drag Movement Anomaly Test
 * 
 * WHAT IT TESTS:
 * - User drags component → component should move to new position
 * - Drag events should be logged correctly
 * - Position changes should be reflected in DOM
 * 
 * DETECTED ANOMALIES:
 * - Drag registered but component doesn't move
 * - Missing drag start/end events
 * - Position inconsistency between logs and DOM
 */

import { AnomalyTestBase } from './framework/anomaly-test-base.js';

export class MouseDragMovementTest extends AnomalyTestBase {
    constructor() {
        super(
            'mouse-drag-movement-test',
            'Verifies that dragging components properly moves them and logs drag events'
        );
    }

    async execute() {
        console.info('🎯 Testing mouse drag movement...');
        
        // Get first available component
        const components = this.getCanvasComponents();
        if (components.length === 0) {
            this.addAnomaly('no_components_for_drag', {
                message: 'No components available for drag test'
            }, 'high');
            return;
        }

        const targetComponent = components[0];
        const componentElement = document.querySelector(`[data-id="${targetComponent.id}"]`);
        
        // Record initial position
        const initialRect = componentElement.getBoundingClientRect();
        const initialPosition = {
            x: initialRect.x,
            y: initialRect.y,
            width: initialRect.width,
            height: initialRect.height
        };

        // Define drag parameters
        const dragStart = {
            x: initialPosition.x + initialPosition.width / 2,
            y: initialPosition.y + initialPosition.height / 2
        };
        
        const dragEnd = {
            x: dragStart.x + 100, // Move 100px right
            y: dragStart.y + 50   // Move 50px down
        };

        // Setup assertions
        this.addAssertion(
            'Drag start should generate HMI event',
            { type: 'drag_start', componentId: targetComponent.id },
            { level: 'hmi', messageContains: 'canvas_drag_start' },
            500
        );

        this.addAssertion(
            'Drag end should generate HMI event',
            { type: 'drag_end', componentId: targetComponent.id },
            { level: 'hmi', messageContains: 'canvas_drag_end' },
            2000
        );

        console.info(`🖱️ Dragging component ${targetComponent.id} from`, dragStart, 'to', dragEnd);

        // Execute drag operation
        await this.simulateDragDrop({
            startX: dragStart.x,
            startY: dragStart.y,
            endX: dragEnd.x,
            endY: dragEnd.y,
            element: componentElement
        });

        // Wait for drag to complete
        await this.delay(1000);

        // Record final position
        const finalRect = componentElement.getBoundingClientRect();
        const finalPosition = {
            x: finalRect.x,
            y: finalRect.y,
            width: finalRect.width,
            height: finalRect.height
        };

        // Store for verification
        this.initialPosition = initialPosition;
        this.finalPosition = finalPosition;
        this.dragStart = dragStart;
        this.dragEnd = dragEnd;
        this.targetComponent = targetComponent;
    }

    async verify() {
        console.info('🔍 Verifying drag movement results...');
        
        if (!this.targetComponent) {
            this.addAnomaly('drag_test_incomplete', {
                message: 'Drag test execution incomplete'
            }, 'high');
            return;
        }

        // Check if component actually moved
        const xMoved = Math.abs(this.finalPosition.x - this.initialPosition.x);
        const yMoved = Math.abs(this.finalPosition.y - this.initialPosition.y);
        const totalMovement = Math.sqrt(xMoved * xMoved + yMoved * yMoved);

        if (totalMovement < 10) {
            this.addAnomaly('component_did_not_move', {
                componentId: this.targetComponent.id,
                initialPosition: this.initialPosition,
                finalPosition: this.finalPosition,
                totalMovement: totalMovement,
                message: 'Component did not move significantly after drag operation'
            }, 'high');
        }

        // Check drag event logs
        const recentLogs = this.logCapture.getRecentLogs(this.startTime);
        
        const dragStartLogs = recentLogs.filter(log => 
            log.level === 'hmi' && log.message.includes('canvas_drag_start')
        );
        
        const dragEndLogs = recentLogs.filter(log => 
            log.level === 'hmi' && log.message.includes('canvas_drag_end')
        );

        if (dragStartLogs.length === 0) {
            this.addAnomaly('missing_drag_start_log', {
                message: 'No canvas_drag_start event found in logs',
                componentId: this.targetComponent.id
            }, 'medium');
        }

        if (dragEndLogs.length === 0) {
            this.addAnomaly('missing_drag_end_log', {
                message: 'No canvas_drag_end event found in logs',
                componentId: this.targetComponent.id
            }, 'medium');
        }

        // Verify movement direction consistency
        const expectedXMovement = this.dragEnd.x - this.dragStart.x;
        const expectedYMovement = this.dragEnd.y - this.dragStart.y;
        const actualXMovement = this.finalPosition.x - this.initialPosition.x;
        const actualYMovement = this.finalPosition.y - this.initialPosition.y;

        const xTolerance = 50; // 50px tolerance
        const yTolerance = 50;

        if (Math.abs(actualXMovement - expectedXMovement) > xTolerance) {
            this.addAnomaly('incorrect_x_movement', {
                expected: expectedXMovement,
                actual: actualXMovement,
                tolerance: xTolerance,
                message: 'Component X movement differs significantly from expected'
            }, 'medium');
        }

        if (Math.abs(actualYMovement - expectedYMovement) > yTolerance) {
            this.addAnomaly('incorrect_y_movement', {
                expected: expectedYMovement,
                actual: actualYMovement,
                tolerance: yTolerance,
                message: 'Component Y movement differs significantly from expected'
            }, 'medium');
        }

        console.info(`✅ Drag movement test completed. Anomalies: ${this.anomalies.length}`);
    }

    /**
     * Enhanced drag simulation
     */
    async simulateDragDrop(data) {
        const { startX, startY, endX, endY, element } = data;
        
        // Mouse down
        const mouseDownEvent = new MouseEvent('mousedown', {
            clientX: startX,
            clientY: startY,
            button: 0,
            bubbles: true
        });
        element.dispatchEvent(mouseDownEvent);
        
        await this.delay(100);
        
        // Mouse move (intermediate steps for realistic drag)
        const steps = 5;
        for (let i = 1; i <= steps; i++) {
            const progress = i / steps;
            const currentX = startX + (endX - startX) * progress;
            const currentY = startY + (endY - startY) * progress;
            
            const mouseMoveEvent = new MouseEvent('mousemove', {
                clientX: currentX,
                clientY: currentY,
                buttons: 1,
                bubbles: true
            });
            document.dispatchEvent(mouseMoveEvent);
            
            await this.delay(50);
        }
        
        // Mouse up
        const mouseUpEvent = new MouseEvent('mouseup', {
            clientX: endX,
            clientY: endY,
            button: 0,
            bubbles: true
        });
        element.dispatchEvent(mouseUpEvent);
        
        await this.delay(100);
    }
}

// Auto-register test
if (typeof window !== 'undefined') {
    window.MouseDragMovementTest = MouseDragMovementTest;
}
