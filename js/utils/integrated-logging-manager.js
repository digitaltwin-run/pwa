/**
 * Integrated Logging Manager - Combines Both Solutions
 * 
 * PRODUCTION-READY APPROACH:
 * - Uses both Simple Event Logger and Pattern Workflow Logger
 * - Automatically switches between detailed/simple logging based on performance
 * - Provides unified API for testing and analysis
 * - Background operation with minimal performance impact
 */

import SimpleEventLogger from './simple-event-logger.js';
import PatternWorkflowLogger from './pattern-workflow-logger.js';

export class IntegratedLoggingManager {
    constructor(sessionHash) {
        this.sessionHash = sessionHash;
        this.mode = 'auto'; // auto, simple, workflow, both
        this.performanceThreshold = 100; // ms
        this.lastPerformanceCheck = Date.now();
        
        this.simpleLogger = null;
        this.workflowLogger = null;
        this.isEnabled = true;
        this.stats = {
            eventsLogged: 0,
            workflowsCompleted: 0,
            performanceImpact: 0
        };
        
        this.init();
    }

    async init() {
        // Initialize both loggers
        this.simpleLogger = new SimpleEventLogger(this.sessionHash);
        this.workflowLogger = new PatternWorkflowLogger(this.sessionHash);
        
        // Expose globally for testing
        window.simpleEventLogger = this.simpleLogger;
        window.patternWorkflowLogger = this.workflowLogger;
        window.integratedLoggingManager = this;
        
        // Setup performance monitoring
        this.setupPerformanceMonitoring();
        
        console.info('🎯 Integrated Logging Manager initialized');
        this.logSystemEvent('Logging system initialized', { 
            mode: this.mode, 
            sessionHash: this.sessionHash 
        });
    }

    /**
     * Log system event with both loggers
     */
    logSystemEvent(message, context = {}) {
        if (!this.isEnabled) return;
        
        const startTime = performance.now();
        
        try {
            // Simple event logging
            if (this.shouldUseSimpleLogger()) {
                this.simpleLogger?.logEvent('system.event', message, 'success', context);
            }
            
            // Workflow logging (for system events)
            if (this.shouldUseWorkflowLogger()) {
                // System events don't need workflow tracking, just log
                console.info(`🎯 System: ${message}`);
            }
            
            this.stats.eventsLogged++;
            
        } catch (error) {
            console.warn('Logging error:', error.message);
        } finally {
            const duration = performance.now() - startTime;
            this.stats.performanceImpact += duration;
            
            // Auto-adjust mode based on performance
            if (duration > this.performanceThreshold) {
                this.adjustPerformanceMode();
            }
        }
    }

    /**
     * Check which loggers should be active
     */
    shouldUseSimpleLogger() {
        return this.mode === 'simple' || this.mode === 'both' || this.mode === 'auto';
    }

    shouldUseWorkflowLogger() {
        return this.mode === 'workflow' || this.mode === 'both' || this.mode === 'auto';
    }

    /**
     * Adjust logging mode based on performance
     */
    adjustPerformanceMode() {
        const avgImpact = this.stats.performanceImpact / this.stats.eventsLogged;
        
        if (avgImpact > this.performanceThreshold && this.mode === 'both') {
            this.mode = 'simple';
            console.info('🚀 Switched to simple logging mode for better performance');
        } else if (avgImpact > this.performanceThreshold * 2) {
            this.isEnabled = false;
            console.warn('⚠️ Logging disabled due to performance impact');
        }
    }

    /**
     * Setup performance monitoring
     */
    setupPerformanceMonitoring() {
        // Monitor every 10 seconds
        setInterval(() => {
            const now = Date.now();
            const timeElapsed = now - this.lastPerformanceCheck;
            
            if (timeElapsed > 10000) { // 10 seconds
                this.performanceCheck();
                this.lastPerformanceCheck = now;
            }
        }, 10000);
    }

    performanceCheck() {
        const avgEventTime = this.stats.eventsLogged > 0 ? 
            this.stats.performanceImpact / this.stats.eventsLogged : 0;
        
        console.info(`📊 Logging Performance: ${avgEventTime.toFixed(2)}ms/event, ${this.stats.eventsLogged} events, mode: ${this.mode}`);
        
        // Reset stats for next period
        this.stats.performanceImpact = 0;
        this.stats.eventsLogged = 0;
    }

    /**
     * Get unified summary from both loggers
     */
    getUnifiedSummary(timeWindow = 10000) {
        const summary = {
            timestamp: Date.now(),
            timeWindow: timeWindow,
            mode: this.mode,
            isEnabled: this.isEnabled,
            performance: {
                avgImpact: this.stats.eventsLogged > 0 ? 
                    this.stats.performanceImpact / this.stats.eventsLogged : 0
            }
        };

        // Get simple events summary
        if (this.simpleLogger) {
            summary.simpleEvents = this.simpleLogger.getEventSummary(timeWindow);
        }

        // Get workflow summary
        if (this.workflowLogger) {
            summary.workflows = this.workflowLogger.getWorkflowSummary(timeWindow);
        }

        return summary;
    }

    /**
     * Generate human-readable status report
     */
    getStatusReport() {
        const summary = this.getUnifiedSummary();
        const report = [];

        report.push(`🎯 Logging Status: ${this.isEnabled ? 'ACTIVE' : 'DISABLED'} (${this.mode} mode)`);
        
        if (summary.simpleEvents) {
            report.push(`📝 Recent Events: ${summary.simpleEvents.total} (${summary.simpleEvents.successes}✅ ${summary.simpleEvents.failures}❌)`);
        }
        
        if (summary.workflows) {
            report.push(`🔄 Workflows: ${summary.workflows.total} (${summary.workflows.successful}✅ ${summary.workflows.failed}❌)`);
            
            if (summary.workflows.recentWorkflows?.length > 0) {
                report.push('📋 Recent Activities:');
                summary.workflows.recentWorkflows.forEach(w => {
                    const status = w.status === 'success' ? '✅' : '❌';
                    report.push(`   ${status} ${w.description || w.pattern} (${w.duration}ms)`);
                });
            }
        }

        return report.join('\n');
    }

    /**
     * Enable/disable logging
     */
    setEnabled(enabled) {
        this.isEnabled = enabled;
        console.info(`🎯 Logging ${enabled ? 'enabled' : 'disabled'}`);
    }

    /**
     * Change logging mode
     */
    setMode(mode) {
        if (['auto', 'simple', 'workflow', 'both'].includes(mode)) {
            this.mode = mode;
            console.info(`🎯 Logging mode changed to: ${mode}`);
        }
    }

    /**
     * Force performance optimization
     */
    optimizePerformance() {
        this.mode = 'simple';
        this.performanceThreshold = 50; // Lower threshold
        console.info('🚀 Performance optimization applied');
    }
}

// Global initialization function
export async function initializeIntegratedLogging(sessionHash) {
    if (!window.integratedLoggingManager) {
        window.integratedLoggingManager = new IntegratedLoggingManager(sessionHash);
        
        // Add to advanced logger as well
        if (window.advancedLogger) {
            window.advancedLogger.integratedLogging = window.integratedLoggingManager;
        }
    }
    
    return window.integratedLoggingManager;
}

// Quick status check function
export function getLoggingStatus() {
    if (window.integratedLoggingManager) {
        return window.integratedLoggingManager.getStatusReport();
    }
    return '❌ Integrated logging not initialized';
}

// Auto-initialize for browser
if (typeof window !== 'undefined') {
    window.initializeIntegratedLogging = initializeIntegratedLogging;
    window.getLoggingStatus = getLoggingStatus;
}
