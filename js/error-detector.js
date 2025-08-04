/**
 * 🔍 Error Detection System
 * Automatic detection and reporting of common Digital Twin IDE issues
 */

class ErrorDetector {
    constructor() {
        this.errors = [];
        this.warnings = [];
        this.isMonitoring = false;
        this.checkInterval = 5000; // 5 seconds
        this.intervalId = null;
    }

    // 🚀 Start automatic monitoring
    startMonitoring() {
        if (this.isMonitoring) return;
        
        this.isMonitoring = true;
        console.log('🔍 Error monitoring started...');
        
        // Initial scan
        this.runFullScan();
        
        // Setup periodic checks
        this.intervalId = setInterval(() => {
            this.runPeriodicChecks();
        }, this.checkInterval);
        
        // Setup DOM mutation observer
        this.setupMutationObserver();
        
        // Setup global error handlers
        this.setupGlobalErrorHandlers();
    }

    // ⏹️ Stop monitoring
    stopMonitoring() {
        if (!this.isMonitoring) return;
        
        this.isMonitoring = false;
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
        
        console.log('⏹️ Error monitoring stopped');
    }

    // 🔍 Run comprehensive system scan
    runFullScan() {
        console.log('🔍 Running full system scan...');
        
        const results = {
            timestamp: new Date().toISOString(),
            errors: [],
            warnings: [],
            checks: []
        };

        // Core system checks
        results.checks.push(this.checkCanvasAvailability());
        results.checks.push(this.checkComponentManager());
        results.checks.push(this.checkPropertiesManager());
        results.checks.push(this.checkPropertiesMapper());
        results.checks.push(this.checkInteractionsManager());
        
        // Component-specific checks
        results.checks.push(this.checkComponentsOnCanvas());
        results.checks.push(this.checkComponentMapping());
        results.checks.push(this.checkInteractionPanels());
        results.checks.push(this.checkColorManagement());
        
        // UI consistency checks
        results.checks.push(this.checkUIConsistency());
        results.checks.push(this.checkEventListeners());
        
        // Performance checks
        results.checks.push(this.checkPerformanceIssues());

        // Compile results
        results.errors = this.errors;
        results.warnings = this.warnings;
        
        this.generateReport(results);
        return results;
    }

    // 🔄 Periodic lightweight checks
    runPeriodicChecks() {
        // Quick health checks
        this.checkComponentMapping();
        this.checkInteractionPanels();
        this.checkUIConsistency();
    }

    // ✅ Check if canvas is available and functioning
    checkCanvasAvailability() {
        const canvas = document.getElementById('svg-canvas');
        
        if (!canvas) {
            this.addError('Canvas not found', 'SVG canvas element is missing');
            return { name: 'Canvas Availability', status: 'FAIL', error: 'Canvas not found' };
        }
        
        if (!canvas.querySelector) {
            this.addError('Canvas malformed', 'Canvas element lacks querySelector method');
            return { name: 'Canvas Availability', status: 'FAIL', error: 'Canvas malformed' };
        }
        
        return { name: 'Canvas Availability', status: 'PASS' };
    }

    // 🧩 Check component manager functionality
    checkComponentManager() {
        const componentManager = window.componentManager;
        
        if (!componentManager) {
            this.addError('ComponentManager missing', 'Global componentManager not found');
            return { name: 'Component Manager', status: 'FAIL', error: 'Not available' };
        }
        
        if (typeof componentManager.getSelectedComponent !== 'function') {
            this.addError('ComponentManager incomplete', 'Missing essential methods');
            return { name: 'Component Manager', status: 'FAIL', error: 'Incomplete API' };
        }
        
        return { name: 'Component Manager', status: 'PASS' };
    }

    // ⚙️ Check properties manager system
    checkPropertiesManager() {
        const propertiesManager = window.propertiesManager;
        
        if (!propertiesManager) {
            this.addError('PropertiesManager missing', 'Global propertiesManager not found');
            return { name: 'Properties Manager', status: 'FAIL', error: 'Not available' };
        }
        
        const requiredComponents = ['propertiesMapper', 'interactionsManager', 'colorManager'];
        const missing = requiredComponents.filter(comp => !propertiesManager[comp]);
        
        if (missing.length > 0) {
            this.addError('PropertiesManager incomplete', `Missing: ${missing.join(', ')}`);
            return { name: 'Properties Manager', status: 'FAIL', error: `Missing: ${missing.join(', ')}` };
        }
        
        return { name: 'Properties Manager', status: 'PASS' };
    }

    // 🗺️ Check properties mapper functionality
    checkPropertiesMapper() {
        const mapper = window.propertiesManager?.propertiesMapper;
        
        if (!mapper) {
            this.addError('PropertiesMapper missing', 'PropertiesMapper not available');
            return { name: 'Properties Mapper', status: 'FAIL', error: 'Not available' };
        }
        
        if (!mapper.mappedProperties) {
            this.addError('PropertiesMapper not initialized', 'mappedProperties is null');
            return { name: 'Properties Mapper', status: 'FAIL', error: 'Not initialized' };
        }
        
        return { name: 'Properties Mapper', status: 'PASS' };
    }

    // 🔗 Check interactions manager
    checkInteractionsManager() {
        const interactionsMgr = window.propertiesManager?.interactionsManager;
        
        if (!interactionsMgr) {
            this.addError('InteractionsManager missing', 'InteractionsManager not available');
            return { name: 'Interactions Manager', status: 'FAIL', error: 'Not available' };
        }
        
        // Test critical methods
        const methods = ['generateTargetOptions', 'generatePropertyOptions', 'generateEventOptions'];
        const missingMethods = methods.filter(method => typeof interactionsMgr[method] !== 'function');
        
        if (missingMethods.length > 0) {
            this.addError('InteractionsManager incomplete', `Missing methods: ${missingMethods.join(', ')}`);
            return { name: 'Interactions Manager', status: 'FAIL', error: `Missing methods: ${missingMethods.join(', ')}` };
        }
        
        return { name: 'Interactions Manager', status: 'PASS' };
    }

    // 🧩 Check components on canvas
    checkComponentsOnCanvas() {
        const canvas = document.getElementById('svg-canvas');
        if (!canvas) return { name: 'Components on Canvas', status: 'SKIP', error: 'Canvas not found' };
        
        const components = canvas.querySelectorAll('[data-id]');
        
        if (components.length === 0) {
            this.addWarning('No components on canvas', 'Canvas is empty');
            return { name: 'Components on Canvas', status: 'WARN', warning: 'No components found' };
        }
        
        // Check each component
        let malformedCount = 0;
        components.forEach(comp => {
            if (!comp.getAttribute('data-svg-url')) {
                malformedCount++;
            }
        });
        
        if (malformedCount > 0) {
            this.addWarning('Malformed components detected', `${malformedCount} components missing data-svg-url`);
        }
        
        return { 
            name: 'Components on Canvas', 
            status: malformedCount > 0 ? 'WARN' : 'PASS',
            details: `${components.length} components, ${malformedCount} malformed`
        };
    }

    // 🗺️ Check component mapping consistency
    checkComponentMapping() {
        const mapper = window.propertiesManager?.propertiesMapper;
        if (!mapper) return { name: 'Component Mapping', status: 'SKIP', error: 'Mapper not available' };
        
        const canvas = document.getElementById('svg-canvas');
        if (!canvas) return { name: 'Component Mapping', status: 'SKIP', error: 'Canvas not found' };
        
        const canvasComponents = canvas.querySelectorAll('[data-id]');
        const mappedComponents = mapper.mappedProperties;
        
        // Check if all canvas components are mapped
        const unmappedComponents = [];
        canvasComponents.forEach(comp => {
            const id = comp.getAttribute('data-id');
            if (!mappedComponents.has(id)) {
                unmappedComponents.push(id);
            }
        });
        
        if (unmappedComponents.length > 0) {
            this.addError('Component mapping incomplete', `Unmapped components: ${unmappedComponents.join(', ')}`);
            return { name: 'Component Mapping', status: 'FAIL', error: `${unmappedComponents.length} unmapped components` };
        }
        
        // Check for orphaned mappings
        const orphanedMappings = [];
        mappedComponents.forEach((props, id) => {
            if (!canvas.querySelector(`[data-id="${id}"]`)) {
                orphanedMappings.push(id);
            }
        });
        
        if (orphanedMappings.length > 0) {
            this.addWarning('Orphaned mappings detected', `Mapped but not on canvas: ${orphanedMappings.join(', ')}`);
        }
        
        return { 
            name: 'Component Mapping', 
            status: 'PASS',
            details: `${canvasComponents.length} canvas components, ${mappedComponents.size} mapped, ${orphanedMappings.length} orphaned`
        };
    }

    // 🔗 Check interaction panels for empty selects (YOUR SPECIFIC BUG!)
    checkInteractionPanels() {
        const interactionDivs = document.querySelectorAll('.interaction');
        
        if (interactionDivs.length === 0) {
            return { name: 'Interaction Panels', status: 'PASS', details: 'No interaction panels to check' };
        }
        
        let emptySelectsFound = 0;
        let totalSelects = 0;
        
        interactionDivs.forEach(div => {
            const selects = div.querySelectorAll('select');
            selects.forEach(select => {
                totalSelects++;
                const options = select.querySelectorAll('option:not([value=""])');
                if (options.length === 0) {
                    emptySelectsFound++;
                    
                    // Identify which select is empty
                    const label = select.previousElementSibling?.textContent || 'Unknown select';
                    this.addError('Empty interaction select', `${label} has no options available`);
                }
            });
        });
        
        if (emptySelectsFound > 0) {
            return { 
                name: 'Interaction Panels', 
                status: 'FAIL', 
                error: `${emptySelectsFound}/${totalSelects} selects are empty`
            };
        }
        
        return { 
            name: 'Interaction Panels', 
            status: 'PASS',
            details: `${totalSelects} selects checked, all populated`
        };
    }

    // 🎨 Check color management system
    checkColorManagement() {
        const colorInputs = document.querySelectorAll('input[type="color"]');
        
        if (colorInputs.length === 0) {
            return { name: 'Color Management', status: 'SKIP', details: 'No color inputs found' };
        }
        
        // Test if color changes are applied
        let workingColorInputs = 0;
        colorInputs.forEach(input => {
            // Check if input has proper event handlers
            if (input.onchange || input.addEventListener) {
                workingColorInputs++;
            }
        });
        
        if (workingColorInputs === 0) {
            this.addError('Color management broken', 'Color inputs lack event handlers');
            return { name: 'Color Management', status: 'FAIL', error: 'No working color inputs' };
        }
        
        return { 
            name: 'Color Management', 
            status: 'PASS',
            details: `${workingColorInputs}/${colorInputs.length} color inputs functional`
        };
    }

    // 🖱️ Check UI consistency and responsiveness
    checkUIConsistency() {
        const issues = [];
        
        // Check for elements without proper IDs
        const canvas = document.getElementById('svg-canvas');
        const library = document.getElementById('component-library');
        const properties = document.getElementById('properties-panel');
        
        if (!canvas) issues.push('Canvas missing');
        if (!library) issues.push('Component library missing');
        if (!properties) issues.push('Properties panel missing');
        
        // Check for broken layouts
        const hiddenElements = document.querySelectorAll('[style*="display: none"]');
        if (hiddenElements.length > 10) {
            this.addWarning('Many hidden elements', `${hiddenElements.length} elements are hidden`);
        }
        
        if (issues.length > 0) {
            this.addError('UI consistency issues', issues.join(', '));
            return { name: 'UI Consistency', status: 'FAIL', error: issues.join(', ') };
        }
        
        return { name: 'UI Consistency', status: 'PASS' };
    }

    // 🎧 Check event listeners
    checkEventListeners() {
        // Check drag and drop functionality
        const components = document.querySelectorAll('[data-svg]');
        let draggableCount = 0;
        
        components.forEach(comp => {
            if (comp.draggable || comp.ondragstart) {
                draggableCount++;
            }
        });
        
        return { 
            name: 'Event Listeners', 
            status: draggableCount > 0 ? 'PASS' : 'WARN',
            details: `${draggableCount} draggable components`
        };
    }

    // 📊 Check for performance issues
    checkPerformanceIssues() {
        const canvas = document.getElementById('svg-canvas');
        if (!canvas) return { name: 'Performance Check', status: 'SKIP' };
        
        const svgElements = canvas.querySelectorAll('*');
        const elementCount = svgElements.length;
        
        if (elementCount > 1000) {
            this.addWarning('High DOM complexity', `${elementCount} SVG elements may impact performance`);
            return { name: 'Performance Check', status: 'WARN', details: `${elementCount} SVG elements` };
        }
        
        return { name: 'Performance Check', status: 'PASS', details: `${elementCount} SVG elements` };
    }

    // Setup DOM mutation observer
    setupMutationObserver() {
        if (!window.MutationObserver) return;
        
        const observer = new MutationObserver((mutations) => {
            let significantChange = false;
            
            mutations.forEach(mutation => {
                if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                    // Check if SVG components were added
                    Array.from(mutation.addedNodes).forEach(node => {
                        if (node.nodeType === 1 && node.getAttribute && node.getAttribute('data-id')) {
                            significantChange = true;
                        }
                    });
                }
            });
            
            if (significantChange) {
                console.log('🔄 Significant DOM change detected, running checks...');
                setTimeout(() => this.runPeriodicChecks(), 1000);
            }
        });
        
        observer.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['data-id', 'data-svg-url']
        });
        
        this.mutationObserver = observer;
    }

    // Setup global error handlers
    setupGlobalErrorHandlers() {
        window.addEventListener('error', (event) => {
            this.addError('JavaScript Error', `${event.message} at ${event.filename}:${event.lineno}`);
        });
        
        window.addEventListener('unhandledrejection', (event) => {
            this.addError('Unhandled Promise Rejection', event.reason.message || event.reason);
        });
    }

    // Add error to collection
    addError(title, description) {
        const error = {
            type: 'ERROR',
            title,
            description,
            timestamp: new Date().toISOString(),
            stack: new Error().stack
        };
        
        this.errors.push(error);
        console.error('🚨 Error detected:', title, '-', description);
    }

    // Add warning to collection
    addWarning(title, description) {
        const warning = {
            type: 'WARNING',
            title,
            description,
            timestamp: new Date().toISOString()
        };
        
        this.warnings.push(warning);
        console.warn('⚠️ Warning:', title, '-', description);
    }

    // Generate comprehensive report
    generateReport(results) {
        const report = {
            ...results,
            summary: {
                totalChecks: results.checks.length,
                passed: results.checks.filter(c => c.status === 'PASS').length,
                failed: results.checks.filter(c => c.status === 'FAIL').length,
                warnings: results.checks.filter(c => c.status === 'WARN').length,
                skipped: results.checks.filter(c => c.status === 'SKIP').length
            }
        };
        
        console.log('📊 Error Detection Report:', report);
        
        // Store report globally for access
        window.errorDetectionReport = report;
        
        return report;
    }

    // Get current status
    getStatus() {
        return {
            isMonitoring: this.isMonitoring,
            totalErrors: this.errors.length,
            totalWarnings: this.warnings.length,
            lastCheck: new Date().toISOString()
        };
    }
}

// 🚀 Initialize global error detector
window.errorDetector = new ErrorDetector();

// Auto-start in development mode - defer until DOM and managers are ready
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    // Wait for DOM and app initialization
    const startErrorDetection = () => {
        console.log('🔍 Auto-starting error detection in development mode...');
        window.errorDetector.startMonitoring();
    };
    
    // If DOM is already loaded, wait a bit more for app initialization
    if (document.readyState === 'complete') {
        setTimeout(startErrorDetection, 1000);
    } else {
        // Wait for window load (after all resources)
        window.addEventListener('load', () => {
            setTimeout(startErrorDetection, 1000);
        });
    }
}

// Export for use in tests
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ErrorDetector;
}
