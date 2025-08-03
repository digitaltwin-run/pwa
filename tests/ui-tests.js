// Digital Twin PWA - UI Interface Tests
// Comprehensive tests for UI functionality

class UITestSuite {
    constructor() {
        this.testResults = [];
        this.totalTests = 0;
        this.passedTests = 0;
        this.failedTests = 0;
    }

    /**
     * Run all UI tests
     */
    async runAllTests() {
        console.log('🧪 Starting UI Test Suite...');
        this.resetResults();

        // Test Categories
        await this.testPropertiesPanel();
        await this.testInteractionsPanel();
        await this.testComponentSelection();
        await this.testComponentScaling();
        await this.testResizeHandles();
        await this.testDragAndDrop();
        await this.testExportFunctionality();

        this.displayResults();
        return this.getTestSummary();
    }

    /**
     * Test Properties Panel functionality
     */
    async testPropertiesPanel() {
        console.log('📋 Testing Properties Panel...');

        // Test 1: Properties panel exists and is visible
        await this.runTest('Properties panel container exists', () => {
            const panel = document.getElementById('component-properties');
            return panel !== null;
        });

        // Test 2: Properties manager is initialized
        await this.runTest('Properties manager is initialized', () => {
            return window.propertiesManager !== undefined;
        });

        // Test 3: Color manager is available
        await this.runTest('Colors manager is available', () => {
            return window.colorsManager !== undefined;
        });

        // Test 4: Scaling manager is available
        await this.runTest('Scaling manager is available', () => {
            return window.scalingManager !== undefined;
        });
    }

    /**
     * Test Interactions Panel functionality
     */
    async testInteractionsPanel() {
        console.log('🔗 Testing Interactions Panel...');

        // Test 1: Interactions section can be generated
        await this.runTest('Interactions section generation', () => {
            if (!window.propertiesManager?.interactionsManager) return false;
            
            const mockComponent = {
                id: 'test-component',
                element: document.createElement('svg'),
                metadata: { type: 'led' }
            };
            
            const html = window.propertiesManager.interactionsManager.generateInteractionsSection(mockComponent);
            return typeof html === 'string' && html.includes('Interakcje');
        });

        // Test 2: Event options generation
        await this.runTest('Event options generation', () => {
            if (!window.propertiesManager?.interactionsManager) return false;
            
            const options = window.propertiesManager.interactionsManager.generateEventOptions('click', 'button');
            return typeof options === 'string' && options.includes('option');
        });

        // Test 3: Target options generation
        await this.runTest('Target options generation', () => {
            if (!window.propertiesManager?.interactionsManager) return false;
            
            const options = window.propertiesManager.interactionsManager.generateTargetOptions('');
            return typeof options === 'string' && options.includes('Wybierz komponent');
        });
    }

    /**
     * Test Component Selection functionality
     */
    async testComponentSelection() {
        console.log('🎯 Testing Component Selection...');

        // Test 1: Component selection manager exists
        await this.runTest('Component selection functionality', () => {
            return typeof window.propertiesManager?.selectComponent === 'function';
        });

        // Test 2: Component manager is available
        await this.runTest('Component manager is available', () => {
            return window.componentManager !== undefined;
        });
    }

    /**
     * Test Component Scaling functionality
     */
    async testComponentScaling() {
        console.log('📏 Testing Component Scaling...');

        // Test 1: Component scaler exists
        await this.runTest('Component scaler is available', () => {
            return window.componentScaler !== undefined;
        });

        // Test 2: Scaling manager zoom levels
        await this.runTest('Scaling manager has zoom levels', () => {
            if (!window.scalingManager) return false;
            return Array.isArray(window.scalingManager.zoomLevels) && 
                   window.scalingManager.zoomLevels.length > 0;
        });

        // Test 3: Scale clamping functionality
        await this.runTest('Scale clamping works correctly', () => {
            if (!window.componentScaler) return false;
            
            const clampedLow = window.componentScaler.clampScale(0.1);
            const clampedHigh = window.componentScaler.clampScale(10);
            
            return clampedLow >= 0.5 && clampedHigh <= 6.0;
        });
    }

    /**
     * Test Resize Handles functionality
     */
    async testResizeHandles() {
        console.log('🔧 Testing Resize Handles...');

        // Test 1: Component resizer exists
        await this.runTest('Component resizer is available', () => {
            return window.componentResizer !== undefined;
        });

        // Test 2: Resize handles creation
        await this.runTest('Resize handles can be created', () => {
            if (!window.componentResizer) return false;
            
            const mockBounds = { x: 0, y: 0, width: 100, height: 100 };
            const handles = window.componentResizer.createResizeHandles(mockBounds);
            
            return Array.isArray(handles) && handles.length === 8;
        });
    }

    /**
     * Test Drag and Drop functionality
     */
    async testDragAndDrop() {
        console.log('🖱️ Testing Drag and Drop...');

        // Test 1: Drag drop manager exists
        await this.runTest('Drag drop manager is available', () => {
            return window.dragDropManager !== undefined;
        });

        // Test 2: Grid manager exists for snapping
        await this.runTest('Grid manager is available', () => {
            return window.gridManager !== undefined;
        });
    }

    /**
     * Test Export functionality
     */
    async testExportFunctionality() {
        console.log('📤 Testing Export Functionality...');

        // Test 1: Export manager exists
        await this.runTest('Export manager is available', () => {
            return window.exportManager !== undefined;
        });

        // Test 2: Export functions are global
        await this.runTest('Global export functions exist', () => {
            return typeof window.exportAsSVG === 'function' &&
                   typeof window.exportAsPNG === 'function' &&
                   typeof window.exportProject === 'function';
        });

        // Test 3: SVG canvas exists for export
        await this.runTest('SVG canvas exists for export', () => {
            const canvas = document.getElementById('svg-canvas');
            return canvas !== null && canvas.tagName.toLowerCase() === 'svg';
        });
    }

    /**
     * Run individual test
     */
    async runTest(testName, testFunction) {
        this.totalTests++;
        
        try {
            const result = await testFunction();
            if (result) {
                this.passedTests++;
                this.testResults.push({ name: testName, status: 'PASS', error: null });
                console.log(`✅ ${testName}`);
            } else {
                this.failedTests++;
                this.testResults.push({ name: testName, status: 'FAIL', error: 'Test returned false' });
                console.log(`❌ ${testName} - Test returned false`);
            }
        } catch (error) {
            this.failedTests++;
            this.testResults.push({ name: testName, status: 'ERROR', error: error.message });
            console.error(`💥 ${testName} - Error: ${error.message}`);
        }
    }

    /**
     * Reset test results
     */
    resetResults() {
        this.testResults = [];
        this.totalTests = 0;
        this.passedTests = 0;
        this.failedTests = 0;
    }

    /**
     * Display test results summary
     */
    displayResults() {
        console.log('\n' + '='.repeat(50));
        console.log('📊 UI TEST SUITE RESULTS');
        console.log('='.repeat(50));
        console.log(`Total Tests: ${this.totalTests}`);
        console.log(`✅ Passed: ${this.passedTests}`);
        console.log(`❌ Failed: ${this.failedTests}`);
        console.log(`📈 Success Rate: ${((this.passedTests / this.totalTests) * 100).toFixed(1)}%`);
        console.log('='.repeat(50));

        // Show failed tests
        if (this.failedTests > 0) {
            console.log('\n❌ FAILED TESTS:');
            this.testResults
                .filter(test => test.status !== 'PASS')
                .forEach(test => {
                    console.log(`  • ${test.name}: ${test.error || 'Unknown error'}`);
                });
        }
    }

    /**
     * Get test summary object
     */
    getTestSummary() {
        return {
            total: this.totalTests,
            passed: this.passedTests,
            failed: this.failedTests,
            successRate: (this.passedTests / this.totalTests) * 100,
            results: this.testResults
        };
    }
}

// Make UI tests available globally
window.UITestSuite = UITestSuite;

// Auto-run tests if requested
if (window.location.search.includes('run-tests=true')) {
    window.addEventListener('load', async () => {
        console.log('🤖 Auto-running UI tests...');
        const testSuite = new UITestSuite();
        await testSuite.runAllTests();
    });
}

// Export for manual testing
window.runUITests = async function() {
    const testSuite = new UITestSuite();
    return await testSuite.runAllTests();
};

console.log('🧪 UI Test Suite loaded. Run tests with: runUITests()');
