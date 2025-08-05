/**
 * Anomaly Test Runner - HMI-Log Correlation Testing Suite
 * 
 * Executes all standardized anomaly detection tests and generates comprehensive reports
 * These tests verify that user HMI actions produce expected application responses and logs
 */

export class AnomalyTestRunner {
    constructor() {
        this.tests = [];
        this.results = [];
        this.runId = this.generateRunId();
        this.startTime = Date.now();
        this.isRunning = false;
        
        console.info('🧪 Anomaly Test Runner initialized:', this.runId);
    }

    generateRunId() {
        return `anomaly_run_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Register all available anomaly tests
     */
    async registerTests() {
        const testClasses = [
            'ComponentSelectionTest',
            'MouseDragMovementTest', 
            'CopyPasteWorkflowTest',
            'PropertyChangeSyncTest'
        ];

        for (const testClassName of testClasses) {
            try {
                // Dynamic import for modular loading
                const module = await import(`./${this.classNameToFileName(testClassName)}.js`);
                const TestClass = module[testClassName];
                
                if (TestClass) {
                    this.tests.push({
                        name: testClassName,
                        class: TestClass,
                        fileName: this.classNameToFileName(testClassName),
                        status: 'registered'
                    });
                    console.info(`✅ Registered test: ${testClassName}`);
                } else {
                    console.warn(`❌ Test class not found: ${testClassName}`);
                }
            } catch (error) {
                console.warn(`❌ Failed to load test: ${testClassName}`, error.message);
            }
        }

        console.info(`📋 Registered ${this.tests.length} anomaly tests`);
        return this.tests;
    }

    classNameToFileName(className) {
        // Convert ComponentSelectionTest → component-selection-test
        return className
            .replace(/Test$/, '')
            .replace(/([A-Z])/g, '-$1')
            .toLowerCase()
            .substring(1) + '-test';
    }

    /**
     * Run all registered tests
     */
    async runAllTests() {
        if (this.isRunning) {
            console.warn('⚠️ Tests are already running');
            return this.results;
        }

        this.isRunning = true;
        this.results = [];
        
        console.info(`🚀 Starting anomaly test suite (${this.tests.length} tests)`);
        
        for (const testInfo of this.tests) {
            console.info(`🧪 Running: ${testInfo.name}`);
            
            try {
                const testInstance = new testInfo.class();
                const result = await testInstance.run();
                
                this.results.push({
                    ...result,
                    testClass: testInfo.name,
                    fileName: testInfo.fileName,
                    runId: this.runId
                });
                
                console.info(`${result.status === 'passed' ? '✅' : '🚨'} ${testInfo.name}: ${result.status} (${result.anomaliesCount} anomalies)`);
                
            } catch (error) {
                this.results.push({
                    testId: `${testInfo.name}_failed`,
                    testName: testInfo.name,
                    status: 'failed',
                    error: error.message,
                    anomaliesCount: 1,
                    anomalies: [{
                        type: 'test_execution_error',
                        message: error.message,
                        severity: 'high'
                    }],
                    runId: this.runId
                });
                
                console.error(`❌ ${testInfo.name}: FAILED`, error.message);
            }
            
            // Pause between tests to avoid interference
            await this.delay(1000);
        }
        
        this.isRunning = false;
        
        const summary = await this.generateSummaryReport();
        console.info('📊 Anomaly test suite completed:', summary);
        
        return this.results;
    }

    /**
     * Run specific test by name
     */
    async runTest(testName) {
        const testInfo = this.tests.find(t => t.name === testName);
        if (!testInfo) {
            throw new Error(`Test not found: ${testName}`);
        }

        console.info(`🧪 Running single test: ${testName}`);
        
        const testInstance = new testInfo.class();
        const result = await testInstance.run();
        
        console.info(`${result.status === 'passed' ? '✅' : '🚨'} ${testName}: ${result.status} (${result.anomaliesCount} anomalies)`);
        
        return result;
    }

    /**
     * Generate comprehensive test summary
     */
    async generateSummaryReport() {
        const summary = {
            runId: this.runId,
            timestamp: Date.now(),
            duration: Date.now() - this.startTime,
            totalTests: this.results.length,
            passed: this.results.filter(r => r.status === 'passed').length,
            failed: this.results.filter(r => r.status === 'failed').length,
            anomaliesDetected: this.results.filter(r => r.status === 'anomalies_detected').length,
            totalAnomalies: this.results.reduce((sum, r) => sum + (r.anomaliesCount || 0), 0),
            criticalAnomalies: this.getCriticalAnomalies(),
            testResults: this.results,
            recommendations: this.generateRecommendations()
        };

        // Save summary report
        await this.saveSummaryReport(summary);
        
        return summary;
    }

    /**
     * Get critical anomalies across all tests
     */
    getCriticalAnomalies() {
        const critical = [];
        
        this.results.forEach(result => {
            if (result.anomalies) {
                result.anomalies.forEach(anomaly => {
                    if (anomaly.severity === 'high') {
                        critical.push({
                            testName: result.testName,
                            ...anomaly
                        });
                    }
                });
            }
        });
        
        return critical;
    }

    /**
     * Generate actionable recommendations based on test results
     */
    generateRecommendations() {
        const recommendations = [];
        const anomalyTypes = new Map();
        
        // Categorize anomalies
        this.results.forEach(result => {
            if (result.anomalies) {
                result.anomalies.forEach(anomaly => {
                    const count = anomalyTypes.get(anomaly.type) || 0;
                    anomalyTypes.set(anomaly.type, count + 1);
                });
            }
        });

        // Generate recommendations based on patterns
        anomalyTypes.forEach((count, type) => {
            switch (type) {
                case 'component_selection_failed':
                    recommendations.push({
                        priority: 'high',
                        area: 'component_selection',
                        issue: `Component selection failed ${count} time(s)`,
                        recommendation: 'Check mouse event handling and selection logic in canvas-selection-manager.js'
                    });
                    break;
                    
                case 'component_did_not_move':
                    recommendations.push({
                        priority: 'high',
                        area: 'drag_drop',
                        issue: `Component drag failed ${count} time(s)`,
                        recommendation: 'Verify drag event handling and position update logic'
                    });
                    break;
                    
                case 'missing_hmi_click_log':
                    recommendations.push({
                        priority: 'medium',
                        area: 'logging',
                        issue: `Missing HMI logs ${count} time(s)`,
                        recommendation: 'Check HMI event tracker initialization and event capture'
                    });
                    break;
                    
                case 'no_component_created_after_paste':
                    recommendations.push({
                        priority: 'high',
                        area: 'copy_paste',
                        issue: `Copy-paste failed ${count} time(s)`,
                        recommendation: 'Verify copy-paste implementation and clipboard handling'
                    });
                    break;
                    
                case 'property_not_updated_in_component':
                    recommendations.push({
                        priority: 'medium',
                        area: 'properties',
                        issue: `Property sync failed ${count} time(s)`,
                        recommendation: 'Check property change event handling and component update logic'
                    });
                    break;
            }
        });

        return recommendations;
    }

    /**
     * Save summary report to backend
     */
    async saveSummaryReport(summary) {
        try {
            const response = await fetch('http://localhost:5006/anomaly-report', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(summary)
            });
            
            if (response.ok) {
                console.info(`📊 Anomaly test report saved: ${this.runId}`);
            }
        } catch (error) {
            console.warn('Failed to save anomaly report:', error.message);
        }
    }

    /**
     * Get quick test status
     */
    getStatus() {
        return {
            isRunning: this.isRunning,
            testsRegistered: this.tests.length,
            testsCompleted: this.results.length,
            runId: this.runId
        };
    }

    /**
     * Utility delay
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Run tests continuously for monitoring
     */
    async startContinuousMonitoring(intervalMinutes = 30) {
        console.info(`🔄 Starting continuous anomaly monitoring (every ${intervalMinutes} minutes)`);
        
        const runTests = async () => {
            console.info('🕐 Scheduled anomaly test run starting...');
            await this.runAllTests();
        };
        
        // Run immediately
        await runTests();
        
        // Schedule regular runs
        setInterval(runTests, intervalMinutes * 60 * 1000);
    }
}

// Global instance for easy access
let globalTestRunner = null;

/**
 * Initialize and run anomaly tests
 */
export async function initializeAnomalyTesting() {
    if (!globalTestRunner) {
        globalTestRunner = new AnomalyTestRunner();
        await globalTestRunner.registerTests();
    }
    
    return globalTestRunner;
}

/**
 * Quick function to run all tests
 */
export async function runAnomalyTests() {
    const runner = await initializeAnomalyTesting();
    return await runner.runAllTests();
}

/**
 * Quick function to run specific test
 */
export async function runAnomalyTest(testName) {
    const runner = await initializeAnomalyTesting();
    return await runner.runTest(testName);
}

// Auto-initialize for browser
if (typeof window !== 'undefined') {
    window.AnomalyTestRunner = AnomalyTestRunner;
    window.runAnomalyTests = runAnomalyTests;
    window.runAnomalyTest = runAnomalyTest;
    window.initializeAnomalyTesting = initializeAnomalyTesting;
}
