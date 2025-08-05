/**
 * Simplified Anomaly Detection Tests
 * 
 * SIMPLE APPROACH:
 * - Tests check if expected events happened after user actions
 * - Easy-to-read test results: "User clicked component → Component selected = SUCCESS"
 * - Minimal code, maximum clarity
 * - Works with both logging solutions
 */

export class SimpleAnomalyTests {
    constructor() {
        this.testResults = [];
        this.testId = 0;
    }

    /**
     * TEST 1: Component Selection Test (Simple Event Logger)
     */
    async testComponentSelection_EventBased() {
        console.info('🧪 Testing: Component Selection (Event-Based)');
        
        const test = {
            id: ++this.testId,
            name: 'Component Selection',
            approach: 'Event-Based',
            userAction: 'Click on component',
            expectedEvent: 'component.select with success',
            result: 'pending'
        };

        // Get first component
        const component = document.querySelector('[data-id]');
        if (!component) {
            test.result = 'no-components';
            test.message = 'No components found on canvas';
            this.testResults.push(test);
            return test;
        }

        // Clear previous events
        if (window.simpleEventLogger) {
            window.simpleEventLogger.events = [];
        }

        // Perform action
        component.click();
        
        // Wait and check result
        await this.delay(1000);
        
        if (window.simpleEventLogger) {
            const selectEvents = window.simpleEventLogger.events.filter(e => 
                e.type === 'component.select' && e.outcome === 'success'
            );
            
            test.result = selectEvents.length > 0 ? 'SUCCESS' : 'FAILED';
            test.message = selectEvents.length > 0 ? 
                `✅ Component selected successfully (${selectEvents.length} events)` :
                '❌ Component click did not result in selection';
            test.eventsFound = selectEvents.length;
        } else {
            test.result = 'NO-LOGGER';
            test.message = 'Simple Event Logger not available';
        }

        this.testResults.push(test);
        console.info(`${test.result === 'SUCCESS' ? '✅' : '❌'} ${test.name}: ${test.message}`);
        return test;
    }

    /**
     * TEST 2: Component Selection Test (Pattern Workflow Logger)
     */
    async testComponentSelection_WorkflowBased() {
        console.info('🧪 Testing: Component Selection (Workflow-Based)');
        
        const test = {
            id: ++this.testId,
            name: 'Component Selection',
            approach: 'Workflow-Based',
            userAction: 'Click on component',
            expectedWorkflow: 'component-selection workflow with success',
            result: 'pending'
        };

        // Get first component
        const component = document.querySelector('[data-id]');
        if (!component) {
            test.result = 'no-components';
            test.message = 'No components found on canvas';
            this.testResults.push(test);
            return test;
        }

        // Clear previous workflows
        if (window.patternWorkflowLogger) {
            window.patternWorkflowLogger.workflows = [];
        }

        // Perform action
        component.click();
        
        // Wait and check result
        await this.delay(1500);
        
        if (window.patternWorkflowLogger) {
            const workflows = window.patternWorkflowLogger.workflows.filter(w => 
                w.pattern === 'component-selection' && w.status === 'success'
            );
            
            test.result = workflows.length > 0 ? 'SUCCESS' : 'FAILED';
            test.message = workflows.length > 0 ? 
                `✅ ${workflows[0]?.description || 'Component selection workflow completed'}` :
                '❌ Component selection workflow failed';
            test.workflowsFound = workflows.length;
            test.description = workflows[0]?.description;
        } else {
            test.result = 'NO-LOGGER';
            test.message = 'Pattern Workflow Logger not available';
        }

        this.testResults.push(test);
        console.info(`${test.result === 'SUCCESS' ? '✅' : '❌'} ${test.name}: ${test.message}`);
        return test;
    }

    /**
     * TEST 3: Copy-Paste Workflow Test (Both Loggers)
     */
    async testCopyPasteWorkflow() {
        console.info('🧪 Testing: Copy-Paste Workflow (Both Loggers)');
        
        const test = {
            id: ++this.testId,
            name: 'Copy-Paste Workflow',
            approach: 'Both Loggers',
            userAction: 'Select component → Ctrl+C → Ctrl+V',
            expectedOutcome: 'New component created',
            result: 'pending'
        };

        // Get and select component
        const component = document.querySelector('[data-id]');
        if (!component) {
            test.result = 'no-components';
            test.message = 'No components found on canvas';
            this.testResults.push(test);
            return test;
        }

        // Count initial components
        const initialCount = document.querySelectorAll('[data-id]').length;

        // Clear logger data
        if (window.simpleEventLogger) window.simpleEventLogger.events = [];
        if (window.patternWorkflowLogger) window.patternWorkflowLogger.workflows = [];

        // Select component
        component.click();
        await this.delay(300);

        // Copy (Ctrl+C)
        document.dispatchEvent(new KeyboardEvent('keydown', {
            key: 'c',
            ctrlKey: true,
            bubbles: true
        }));
        await this.delay(300);

        // Paste (Ctrl+V)
        document.dispatchEvent(new KeyboardEvent('keydown', {
            key: 'v', 
            ctrlKey: true,
            bubbles: true
        }));
        await this.delay(2000);

        // Check results
        const finalCount = document.querySelectorAll('[data-id]').length;
        const newComponentsCreated = finalCount - initialCount;

        test.initialComponents = initialCount;
        test.finalComponents = finalCount;
        test.newComponents = newComponentsCreated;

        // Check Event Logger
        let eventLoggerResult = 'not-available';
        if (window.simpleEventLogger) {
            const createEvents = window.simpleEventLogger.events.filter(e => 
                e.type === 'component.create'
            );
            eventLoggerResult = createEvents.length > 0 ? 'detected' : 'not-detected';
            test.eventLoggerEvents = createEvents.length;
        }

        // Check Workflow Logger  
        let workflowLoggerResult = 'not-available';
        if (window.patternWorkflowLogger) {
            const workflows = window.patternWorkflowLogger.workflows.filter(w => 
                w.pattern === 'copy-paste-workflow'
            );
            workflowLoggerResult = workflows.length > 0 ? 
                workflows[0].status : 'not-detected';
            test.workflowLoggerWorkflows = workflows.length;
            test.workflowDescription = workflows[0]?.description;
        }

        // Determine overall result
        if (newComponentsCreated > 0) {
            test.result = 'SUCCESS';
            test.message = `✅ Copy-paste created ${newComponentsCreated} new component(s)`;
        } else {
            test.result = 'FAILED';
            test.message = '❌ Copy-paste did not create new components';
        }

        test.eventLoggerResult = eventLoggerResult;
        test.workflowLoggerResult = workflowLoggerResult;

        this.testResults.push(test);
        console.info(`${test.result === 'SUCCESS' ? '✅' : '❌'} ${test.name}: ${test.message}`);
        console.info(`   Event Logger: ${eventLoggerResult}, Workflow Logger: ${workflowLoggerResult}`);
        return test;
    }

    /**
     * TEST 4: Property Change Test (Simplified)
     */
    async testPropertyChange() {
        console.info('🧪 Testing: Property Change');
        
        const test = {
            id: ++this.testId,
            name: 'Property Change',
            approach: 'Both Loggers',
            userAction: 'Change component color',
            expectedOutcome: 'Property change logged',
            result: 'pending'
        };

        // Find color input
        const colorInput = document.querySelector('input[type="color"]');
        if (!colorInput) {
            test.result = 'no-property-inputs';
            test.message = 'No color inputs found in properties panel';
            this.testResults.push(test);
            return test;
        }

        // Clear logger data
        if (window.simpleEventLogger) window.simpleEventLogger.events = [];
        if (window.patternWorkflowLogger) window.patternWorkflowLogger.workflows = [];

        // Change color
        const originalColor = colorInput.value;
        const newColor = originalColor === '#ff0000' ? '#00ff00' : '#ff0000';
        
        colorInput.value = newColor;
        colorInput.dispatchEvent(new Event('input', { bubbles: true }));
        colorInput.dispatchEvent(new Event('change', { bubbles: true }));

        await this.delay(1000);

        // Check results
        let eventLoggerResult = 'not-available';
        if (window.simpleEventLogger) {
            const userEvents = window.simpleEventLogger.events.filter(e => 
                e.type === 'user.click' && e.target.includes('input')
            );
            eventLoggerResult = userEvents.length > 0 ? 'detected' : 'not-detected';
            test.eventLoggerEvents = userEvents.length;
        }

        let workflowLoggerResult = 'not-available';
        if (window.patternWorkflowLogger) {
            const workflows = window.patternWorkflowLogger.workflows.filter(w => 
                w.pattern === 'property-modification'
            );
            workflowLoggerResult = workflows.length > 0 ? 
                workflows[0].status : 'not-detected';
            test.workflowLoggerWorkflows = workflows.length;
        }

        test.result = (eventLoggerResult === 'detected' || workflowLoggerResult === 'success') ? 
            'SUCCESS' : 'FAILED';
        test.message = test.result === 'SUCCESS' ? 
            '✅ Property change detected by loggers' :
            '❌ Property change not properly logged';

        test.originalColor = originalColor;
        test.newColor = newColor;
        test.eventLoggerResult = eventLoggerResult;
        test.workflowLoggerResult = workflowLoggerResult;

        this.testResults.push(test);
        console.info(`${test.result === 'SUCCESS' ? '✅' : '❌'} ${test.name}: ${test.message}`);
        return test;
    }

    /**
     * Run all simplified tests
     */
    async runAllTests() {
        console.info('🚀 Running Simplified Anomaly Tests');
        
        this.testResults = [];
        
        const tests = [
            await this.testComponentSelection_EventBased(),
            await this.testComponentSelection_WorkflowBased(),
            await this.testCopyPasteWorkflow(),
            await this.testPropertyChange()
        ];

        const summary = this.generateSummary();
        console.info('📊 Test Summary:', summary);
        
        return {
            tests: tests,
            summary: summary
        };
    }

    /**
     * Generate simple test summary
     */
    generateSummary() {
        const total = this.testResults.length;
        const successful = this.testResults.filter(t => t.result === 'SUCCESS').length;
        const failed = this.testResults.filter(t => t.result === 'FAILED').length;
        const issues = this.testResults.filter(t => 
            t.result.includes('no-') || t.result.includes('NO-')
        ).length;

        return {
            total: total,
            successful: successful,
            failed: failed,
            issues: issues,
            successRate: total > 0 ? Math.round((successful / total) * 100) : 0,
            message: `${successful}/${total} tests passed (${Math.round((successful / total) * 100)}%)`
        };
    }

    /**
     * Get simple test report
     */
    getSimpleReport() {
        return this.testResults.map(test => ({
            test: test.name,
            approach: test.approach,
            action: test.userAction,
            result: test.result,
            message: test.message
        }));
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Global functions for easy testing
export async function runSimpleAnomalyTests() {
    const tester = new SimpleAnomalyTests();
    return await tester.runAllTests();
}

export async function testComponentSelection() {
    const tester = new SimpleAnomalyTests();
    return [
        await tester.testComponentSelection_EventBased(),
        await tester.testComponentSelection_WorkflowBased()
    ];
}

// Auto-register for browser
if (typeof window !== 'undefined') {
    window.SimpleAnomalyTests = SimpleAnomalyTests;
    window.runSimpleAnomalyTests = runSimpleAnomalyTests;
    window.testComponentSelection = testComponentSelection;
}
