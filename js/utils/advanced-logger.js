/**
 * Advanced Logger - JSON Console Capture & Analysis System
 * Captures all console output as JSON, saves to uniquely named files per session,
 * and provides automated real-time error analysis and proactive fixes.
 */

class AdvancedLogger {
    constructor() {
        this.sessionHash = this.generateSessionHash();
        this.logs = [];
        this.startTime = Date.now();
        this.originalConsole = {};
        this.errorPatterns = [];
        this.autoFixEnabled = true;
        this.logServerUrl = 'http://localhost:5006';
        this.filename = `${this.sessionHash}.log.json`;
        this.filepath = null;
        this.backendAvailable = true; // Assume backend is available until proven otherwise
        
        this.init();
    }

    /**
     * Generate unique session hash from URL and timestamp
     */
    generateSessionHash() {
        const url = window.location.href;
        const timestamp = Date.now();
        const random = Math.floor(Math.random() * 1000000);
        
        // Create hash from URL + timestamp + random
        const hashInput = `${url}-${timestamp}-${random}`;
        let hash = 0;
        for (let i = 0; i < hashInput.length; i++) {
            const char = hashInput.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        
        return Math.abs(hash).toString(36) + '-' + timestamp;
    }

    /**
     * Initialize console capture and error patterns
     */
    async init() {
        this.captureConsole();
        this.setupErrorPatterns();
        await this.initializeSession();
        await this.initializeHMITracking();
        this.setupPageUnloadHandler();
        
        console.info('🚀 Advanced Logger initialized with session:', this.sessionHash);
        console.info('📁 Log file:', this.filename);
        console.info('🔗 Backend:', this.logServerUrl);
    }

    /**
     * Initialize HMI event tracking
     */
    async initializeHMITracking() {
        try {
            // Dynamic import to avoid circular dependencies
            const { default: HMIEventTracker } = await import('./hmi-event-tracker.js');
            this.hmiTracker = new HMIEventTracker(this);
            console.info('🎯 HMI Event Tracker initialized');
        } catch (error) {
            console.warn('⚠️ Failed to initialize HMI tracking:', error.message);
        }
    }

    /**
     * Capture all console methods (log, warn, error, info, debug, trace, hmi)
     */
    captureConsole() {
        const methods = ['log', 'warn', 'error', 'info', 'debug', 'trace', 'hmi'];
        
        methods.forEach(method => {
            this.originalConsole[method] = console[method] || console.log;
            
            console[method] = (...args) => {
                // Call original console method (use log for hmi if not exists)
                if (method === 'hmi') {
                    this.originalConsole.log.apply(console, ['🎯 HMI:', ...args]);
                } else {
                    this.originalConsole[method].apply(console, args);
                }
                
                // Capture for JSON log
                this.captureLogEntry(method, args);
            };
        });
    }

    /**
     * Initialize session with Node.js backend
     */
    async initializeSession() {
        try {
            const response = await fetch(`${this.logServerUrl}/session`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    sessionHash: this.sessionHash,
                    url: window.location.href,
                    userAgent: navigator.userAgent,
                    startTime: this.startTime
                })
            });

            if (response.ok) {
                const result = await response.json();
                this.filepath = result.filepath;
                
                // Update URL hash to show current session
                this.updateUrlHash();
                
                console.info('✅ Session initialized on backend:', result.filename);
                console.info('📁 File path:', result.filepath);
                console.info('🔗 URL updated with session hash:', window.location.href);
            } else {
                console.warn('⚠️ Failed to initialize session on backend');
            }
        } catch (error) {
            console.warn('⚠️ Log server not available, falling back to local logging:', error.message);
        }
    }

    /**
     * Send log entry to Node.js backend in real-time
     */
    async sendLogToBackend(entry) {
        // Skip if we know backend is not available
        if (!this.backendAvailable) {
            return;
        }
        
        try {
            const response = await fetch(`${this.logServerUrl}/log`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(entry)
            });

            if (!response.ok) {
                console.warn('Failed to send log to backend, disabling further attempts');
                this.backendAvailable = false;
            }
        } catch (error) {
            // Disable further attempts to contact the backend
            this.backendAvailable = false;
            console.warn('Backend logging disabled: Could not connect to log server');
        }
    }

    /**
     * Capture individual log entry
     */
    captureLogEntry(level, args) {
        const entry = {
            timestamp: Date.now(),
            sessionTime: Date.now() - this.startTime,
            level: level,
            message: this.formatArgs(args),
            stack: level === 'error' ? new Error().stack : null,
            url: window.location.href,
            userAgent: navigator.userAgent,
            sessionHash: this.sessionHash
        };

        this.logs.push(entry);
        
        // Send to backend in real-time
        this.sendLogToBackend(entry);
        
        // Real-time error analysis
        if (level === 'error' || level === 'warn') {
            this.analyzeError(entry);
        }
    }

    /**
     * Format console arguments for JSON storage
     */
    formatArgs(args) {
        return args.map(arg => {
            if (typeof arg === 'object') {
                try {
                    return JSON.stringify(arg, null, 2);
                } catch (e) {
                    return '[Object: circular reference or non-serializable]';
                }
            }
            return String(arg);
        }).join(' ');
    }

    /**
     * Setup common error patterns for automated detection
     */
    setupErrorPatterns() {
        this.errorPatterns = [
            {
                pattern: /is not defined/i,
                type: 'undefined_variable',
                autoFix: (error) => this.suggestVariableDefinition(error)
            },
            {
                pattern: /is not a function/i,
                type: 'missing_method',
                autoFix: (error) => this.suggestMethodImplementation(error)
            },
            {
                pattern: /Cannot read prop.*of (null|undefined)/i,
                type: 'null_reference',
                autoFix: (error) => this.suggestNullCheck(error)
            },
            {
                pattern: /Failed to fetch/i,
                type: 'network_error',
                autoFix: (error) => this.suggestNetworkRetry(error)
            },
            {
                pattern: /data-id.*not found/i,
                type: 'missing_component',
                autoFix: (error) => this.suggestComponentCheck(error)
            }
        ];
    }

    /**
     * Analyze error and provide automated fixes
     */
    analyzeError(logEntry) {
        const message = logEntry.message;
        
        for (const pattern of this.errorPatterns) {
            if (pattern.pattern.test(message)) {
                const suggestion = pattern.autoFix(logEntry);
                
                this.logs.push({
                    timestamp: Date.now(),
                    sessionTime: Date.now() - this.startTime,
                    level: 'analysis',
                    message: `🤖 Auto-Analysis: ${pattern.type} detected`,
                    suggestion: suggestion,
                    originalError: logEntry,
                    sessionHash: this.sessionHash
                });

                // Display suggestion to user
                this.displayErrorSuggestion(pattern.type, suggestion);
                break;
            }
        }
    }

    /**
     * Auto-fix suggestions for different error types
     */
    suggestVariableDefinition(error) {
        const match = error.message.match(/(\w+) is not defined/i);
        if (match) {
            const variable = match[1];
            return `Variable '${variable}' is not defined. Check if it should be imported or initialized. Consider adding: let ${variable} = null; or importing the required module.`;
        }
        return 'Undefined variable detected. Check imports and variable declarations.';
    }

    suggestMethodImplementation(error) {
        const match = error.message.match(/(\w+\.\w+) is not a function/i);
        if (match) {
            const method = match[1];
            return `Method '${method}' is missing. Check if the object is properly initialized or if the method name is correct.`;
        }
        return 'Missing method detected. Verify object initialization and method existence.';
    }

    suggestNullCheck(error) {
        return 'Null/undefined reference detected. Add null checks before accessing properties: if (object && object.property) { ... }';
    }

    suggestNetworkRetry(error) {
        return 'Network error detected. Consider implementing retry logic with exponential backoff or checking network connectivity.';
    }

    suggestComponentCheck(error) {
        return 'Component with data-id not found. Verify component is properly added to DOM and has correct data-id attribute.';
    }

    /**
     * Display error suggestion to user (DISABLED - working silently)
     */
    displayErrorSuggestion(errorType, suggestion) {
        // Silent mode - only log to console, no UI notifications
        console.info(`🤖 Auto-Fix Suggestion [${errorType}]: ${suggestion}`);
        
        // Log suggestion for analysis but don't show popup
        this.logs.push({
            timestamp: Date.now(),
            sessionTime: Date.now() - this.startTime,
            level: 'suggestion',
            message: `Auto-Fix Suggestion: ${errorType}`,
            suggestion: suggestion,
            sessionHash: this.sessionHash
        });
    }

    /**
     * Add CSS styles for notifications
     */
    addNotificationStyles() {
        const styles = document.createElement('style');
        styles.id = 'advanced-logger-styles';
        styles.textContent = `
            .advanced-logger-notification {
                position: fixed;
                top: 20px;
                right: 20px;
                background: #fff;
                border: 1px solid #ddd;
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                max-width: 400px;
                z-index: 10000;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                font-size: 14px;
            }
            .notification-header {
                background: #f8f9fa;
                padding: 12px 16px;
                border-bottom: 1px solid #ddd;
                font-weight: bold;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            .close-btn {
                background: none;
                border: none;
                font-size: 16px;
                cursor: pointer;
                color: #666;
            }
            .notification-body {
                padding: 16px;
                line-height: 1.4;
            }
            .notification-actions {
                padding: 12px 16px;
                border-top: 1px solid #eee;
                display: flex;
                gap: 8px;
            }
            .btn-accept, .btn-dismiss {
                padding: 6px 12px;
                border: 1px solid #ddd;
                border-radius: 4px;
                cursor: pointer;
                font-size: 12px;
            }
            .btn-accept {
                background: #28a745;
                color: white;
                border-color: #28a745;
            }
            .btn-dismiss {
                background: #6c757d;
                color: white;
                border-color: #6c757d;
            }
        `;
        document.head.appendChild(styles);
    }

    /**
     * Accept auto-fix suggestion
     */
    acceptSuggestion(errorType) {
        console.info(`🤖 Auto-fix accepted for: ${errorType}`);
        // Here you could implement actual auto-fixes
        // For now, just log the acceptance
    }

    /**
     * Get current log filename
     */
    getLogFilename() {
        return `${this.sessionHash}.log.json`;
    }

    /**
     * Update URL hash to show current session
     */
    updateUrlHash() {
        try {
            // Update URL hash without triggering page reload
            const newUrl = `${window.location.origin}${window.location.pathname}#${this.sessionHash}`;
            window.history.replaceState(null, '', newUrl);
            
            console.info(`🔗 URL updated with session hash: ${newUrl}`);
        } catch (error) {
            console.warn('Failed to update URL hash:', error);
        }
    }

    /**
     * Get session hash from URL if available
     */
    getHashFromUrl() {
        const hash = window.location.hash;
        if (hash && hash.length > 1) {
            return hash.substring(1); // Remove the # character
        }
        return null;
    }

    /**
     * Get backend server status
     */
    async getBackendStatus() {
        try {
            const response = await fetch(`${this.logServerUrl}/status`);
            if (response.ok) {
                return await response.json();
            }
        } catch (error) {
            return null;
        }
        return null;
    }

    /**
     * Setup page unload handler for backend notification
     */
    setupPageUnloadHandler() {
        window.addEventListener('beforeunload', () => {
            // Backend automatically saves on each log entry, no action needed
            console.info('🔄 Page unloading, logs are saved in real-time to backend');
        });
    }

    /**
     * Get log statistics
     */
    getStats() {
        return {
            totalLogs: this.logs.length,
            errorCount: this.logs.filter(log => log.level === 'error').length,
            warnCount: this.logs.filter(log => log.level === 'warn').length,
            infoCount: this.logs.filter(log => log.level === 'info').length,
            sessionDuration: Date.now() - this.startTime,
            sessionHash: this.sessionHash
        };
    }

    /**
     * Manual trigger for log analysis
     */
    analyzeAllLogs() {
        const errors = this.logs.filter(log => log.level === 'error');
        const warnings = this.logs.filter(log => log.level === 'warn');
        
        console.info('📊 Log Analysis Results:', {
            totalErrors: errors.length,
            totalWarnings: warnings.length,
            mostCommonErrors: this.getMostCommonErrors(errors),
            suggestions: this.generateGlobalSuggestions()
        });
    }

    /**
     * Get most common error patterns
     */
    getMostCommonErrors(errors) {
        const errorCounts = {};
        
        errors.forEach(error => {
            for (const pattern of this.errorPatterns) {
                if (pattern.pattern.test(error.message)) {
                    errorCounts[pattern.type] = (errorCounts[pattern.type] || 0) + 1;
                }
            }
        });

        return Object.entries(errorCounts)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 5);
    }

    /**
     * Generate global improvement suggestions
     */
    generateGlobalSuggestions() {
        const stats = this.getStats();
        const suggestions = [];

        if (stats.errorCount > 5) {
            suggestions.push('High error count detected. Consider adding more error handling and validation.');
        }

        if (stats.warnCount > 10) {
            suggestions.push('Many warnings detected. Review and fix warnings to improve code quality.');
        }

        return suggestions;
    }
}

// Auto-initialize when script loads
if (typeof window !== 'undefined') {
    window.advancedLogger = new AdvancedLogger();
}

export default AdvancedLogger;
