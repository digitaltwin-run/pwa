/**
 * Anomaly Detection Test Base Class
 * Standardized framework for HMI-Log correlation testing
 * 
 * Each test verifies that user HMI actions produce expected log entries
 * and detects anomalies when expected outcomes don't occur
 */

export class AnomalyTestBase {
    constructor(testName, description) {
        this.testName = testName;
        this.description = description;
        this.testId = this.generateTestId();
        this.startTime = Date.now();
        this.logEntries = [];
        this.hmiEvents = [];
        this.assertions = [];
        this.anomalies = [];
        this.timeout = 5000; // 5 second default timeout
        this.status = 'pending';
        
        console.info(`🧪 Starting anomaly test: ${this.testName}`);
    }

    /**
     * Generate unique test ID
     */
    generateTestId() {
        return `anomaly_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Setup test environment and capture baseline
     */
    async setup() {
        this.logCapture = new LogCapture(this.testId);
        this.hmiCapture = new HMICapture(this.testId);
        
        // Capture baseline state
        this.baselineState = await this.captureCurrentState();
        
        console.info(`🏁 Test setup complete: ${this.testName}`);
    }

    /**
     * Execute the test scenario
     * Override this method in specific test classes
     */
    async execute() {
        throw new Error('execute() method must be implemented in test class');
    }

    /**
     * Verify expected outcomes and detect anomalies
     * Override this method in specific test classes
     */
    async verify() {
        throw new Error('verify() method must be implemented in test class');
    }

    /**
     * Cleanup after test execution
     */
    async cleanup() {
        if (this.logCapture) {
            this.logCapture.stop();
        }
        if (this.hmiCapture) {
            this.hmiCapture.stop();
        }
        
        console.info(`🧹 Test cleanup complete: ${this.testName}`);
    }

    /**
     * Run the complete test cycle
     */
    async run() {
        try {
            this.status = 'running';
            
            await this.setup();
            await this.execute();
            await this.verify();
            
            this.status = this.anomalies.length > 0 ? 'anomalies_detected' : 'passed';
            
        } catch (error) {
            this.status = 'failed';
            this.addAnomaly('test_execution_error', {
                error: error.message,
                stack: error.stack
            });
        } finally {
            await this.cleanup();
            await this.generateReport();
        }
        
        return this.getResults();
    }

    /**
     * Add assertion to verify HMI-Log correlation
     */
    addAssertion(description, hmiEvent, expectedLogPattern, timeoutMs = 1000) {
        const assertion = {
            id: this.assertions.length + 1,
            description: description,
            hmiEvent: hmiEvent,
            expectedLogPattern: expectedLogPattern,
            timeout: timeoutMs,
            status: 'pending',
            actualLogs: [],
            timestamp: Date.now()
        };
        
        this.assertions.push(assertion);
        return assertion;
    }

    /**
     * Wait for expected log entry after HMI event
     */
    async waitForLogEntry(pattern, timeoutMs = 1000) {
        return new Promise((resolve, reject) => {
            const startTime = Date.now();
            
            const checkLogs = () => {
                const recentLogs = this.logCapture.getRecentLogs(startTime);
                const matchingLog = recentLogs.find(log => this.matchesPattern(log, pattern));
                
                if (matchingLog) {
                    resolve(matchingLog);
                } else if (Date.now() - startTime > timeoutMs) {
                    reject(new Error(`Log pattern not found within ${timeoutMs}ms: ${JSON.stringify(pattern)}`));
                } else {
                    setTimeout(checkLogs, 50); // Check every 50ms
                }
            };
            
            checkLogs();
        });
    }

    /**
     * Check if log entry matches expected pattern
     */
    matchesPattern(logEntry, pattern) {
        if (pattern.level && logEntry.level !== pattern.level) return false;
        if (pattern.messageContains && !logEntry.message.includes(pattern.messageContains)) return false;
        if (pattern.eventType && logEntry.eventType !== pattern.eventType) return false;
        if (pattern.dataContains) {
            const logData = typeof logEntry.data === 'string' ? logEntry.data : JSON.stringify(logEntry.data);
            if (!logData.includes(pattern.dataContains)) return false;
        }
        return true;
    }

    /**
     * Simulate HMI event (mouse click, key press, etc.)
     */
    async simulateHMIEvent(eventType, eventData) {
        const hmiEvent = {
            id: this.hmiEvents.length + 1,
            type: eventType,
            data: eventData,
            timestamp: Date.now(),
            testId: this.testId
        };
        
        this.hmiEvents.push(hmiEvent);
        
        // Execute the actual HMI event
        await this.executeHMIEvent(eventType, eventData);
        
        return hmiEvent;
    }

    /**
     * Execute actual HMI event in the browser
     */
    async executeHMIEvent(eventType, eventData) {
        switch (eventType) {
            case 'mouse_click':
                await this.simulateMouseClick(eventData);
                break;
            case 'key_press':
                await this.simulateKeyPress(eventData);
                break;
            case 'mouse_move':
                await this.simulateMouseMove(eventData);
                break;
            case 'drag_drop':
                await this.simulateDragDrop(eventData);
                break;
            default:
                throw new Error(`Unknown HMI event type: ${eventType}`);
        }
    }

    /**
     * Simulate mouse click
     */
    async simulateMouseClick(data) {
        const element = data.element || document.elementFromPoint(data.x, data.y);
        if (!element) {
            throw new Error(`No element found at coordinates ${data.x}, ${data.y}`);
        }
        
        const clickEvent = new MouseEvent('click', {
            clientX: data.x,
            clientY: data.y,
            button: data.button || 0,
            ctrlKey: data.ctrlKey || false,
            shiftKey: data.shiftKey || false
        });
        
        element.dispatchEvent(clickEvent);
        
        // Small delay to allow event processing
        await this.delay(50);
    }

    /**
     * Simulate key press
     */
    async simulateKeyPress(data) {
        const keyEvent = new KeyboardEvent('keydown', {
            key: data.key,
            code: data.code,
            ctrlKey: data.ctrlKey || false,
            shiftKey: data.shiftKey || false,
            altKey: data.altKey || false
        });
        
        (data.target || document.activeElement || document.body).dispatchEvent(keyEvent);
        
        await this.delay(50);
    }

    /**
     * Add anomaly detection result
     */
    addAnomaly(type, data, severity = 'medium') {
        const anomaly = {
            id: this.anomalies.length + 1,
            type: type,
            data: data,
            severity: severity,
            timestamp: Date.now(),
            testId: this.testId
        };
        
        this.anomalies.push(anomaly);
        
        console.warn(`🚨 Anomaly detected in ${this.testName}:`, anomaly);
        
        return anomaly;
    }

    /**
     * Capture current application state
     */
    async captureCurrentState() {
        return {
            timestamp: Date.now(),
            url: window.location.href,
            selectedComponents: this.getSelectedComponents(),
            canvasComponents: this.getCanvasComponents(),
            activeElement: document.activeElement?.tagName || null,
            mousePosition: this.getCurrentMousePosition()
        };
    }

    /**
     * Get currently selected components
     */
    getSelectedComponents() {
        const selected = document.querySelectorAll('[data-id].selected');
        return Array.from(selected).map(el => el.dataset.id);
    }

    /**
     * Get all components on canvas
     */
    getCanvasComponents() {
        const components = document.querySelectorAll('[data-id]');
        return Array.from(components).map(el => ({
            id: el.dataset.id,
            type: el.dataset.type || 'unknown',
            position: el.getBoundingClientRect()
        }));
    }

    /**
     * Get current mouse position (approximate)
     */
    getCurrentMousePosition() {
        return window.lastMousePosition || { x: 0, y: 0 };
    }

    /**
     * Utility delay function
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Generate test report
     */
    async generateReport() {
        const report = {
            testId: this.testId,
            testName: this.testName,
            description: this.description,
            status: this.status,
            startTime: this.startTime,
            endTime: Date.now(),
            duration: Date.now() - this.startTime,
            assertions: this.assertions,
            anomalies: this.anomalies,
            hmiEvents: this.hmiEvents,
            logEntries: this.logEntries,
            baselineState: this.baselineState,
            finalState: await this.captureCurrentState()
        };
        
        // Save report to file
        await this.saveReport(report);
        
        return report;
    }

    /**
     * Save test report
     */
    async saveReport(report) {
        try {
            const response = await fetch('http://localhost:5006/test-report', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(report)
            });
            
            if (response.ok) {
                console.info(`📊 Test report saved: ${this.testName}`);
            }
        } catch (error) {
            console.warn('Failed to save test report:', error.message);
        }
    }

    /**
     * Get test results
     */
    getResults() {
        return {
            testId: this.testId,
            testName: this.testName,
            status: this.status,
            anomaliesCount: this.anomalies.length,
            anomalies: this.anomalies,
            assertions: this.assertions,
            duration: Date.now() - this.startTime
        };
    }
}

/**
 * Log Capture Helper
 */
class LogCapture {
    constructor(testId) {
        this.testId = testId;
        this.logs = [];
        this.startTime = Date.now();
        this.isCapturing = true;
        
        this.originalLog = console.log;
        this.setupCapture();
    }
    
    setupCapture() {
        const self = this;
        
        ['log', 'info', 'warn', 'error', 'hmi'].forEach(level => {
            const originalMethod = console[level] || console.log;
            
            console[level] = function(...args) {
                if (self.isCapturing) {
                    self.logs.push({
                        level: level,
                        message: args.join(' '),
                        timestamp: Date.now(),
                        testId: self.testId
                    });
                }
                
                return originalMethod.apply(console, args);
            };
        });
    }
    
    getRecentLogs(sinceTimestamp) {
        return this.logs.filter(log => log.timestamp >= sinceTimestamp);
    }
    
    stop() {
        this.isCapturing = false;
    }
}

/**
 * HMI Capture Helper
 */
class HMICapture {
    constructor(testId) {
        this.testId = testId;
        this.events = [];
        this.isCapturing = true;
        
        this.setupCapture();
    }
    
    setupCapture() {
        // Capture mouse events
        document.addEventListener('mousedown', this.captureEvent.bind(this));
        document.addEventListener('mouseup', this.captureEvent.bind(this));
        document.addEventListener('click', this.captureEvent.bind(this));
        
        // Capture keyboard events
        document.addEventListener('keydown', this.captureEvent.bind(this));
        document.addEventListener('keyup', this.captureEvent.bind(this));
    }
    
    captureEvent(event) {
        if (!this.isCapturing) return;
        
        this.events.push({
            type: event.type,
            timestamp: Date.now(),
            target: {
                tag: event.target.tagName,
                id: event.target.id,
                class: event.target.className,
                dataId: event.target.dataset?.id
            },
            testId: this.testId
        });
    }
    
    stop() {
        this.isCapturing = false;
    }
}

export default AnomalyTestBase;
