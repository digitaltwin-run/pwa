/**
 * Pattern-Based Workflow Logger - Solution 2
 * 
 * WORKFLOW-PATTERN APPROACH:
 * - Tracks user workflows: select→move, copy→paste, click→property-change
 * - Pattern matching: detects common UI interaction sequences
 * - Natural language events: "User selected LED component", "Moved component to new position"
 * - Automatic workflow success/failure detection
 */

export class PatternWorkflowLogger {
    constructor(sessionHash) {
        this.sessionHash = sessionHash;
        this.workflows = [];
        this.activeWorkflows = new Map();
        this.patterns = [];
        this.eventBuffer = [];
        this.workflowId = 0;
        this.startTime = Date.now();
        
        this.setupWorkflowPatterns();
        this.init();
    }

    init() {
        this.setupPatternTracking();
        console.info('🔄 Pattern Workflow Logger initialized');
    }

    /**
     * Define common workflow patterns
     */
    setupWorkflowPatterns() {
        this.patterns = [
            {
                name: 'component-selection',
                description: 'User selects component',
                trigger: { type: 'click', target: 'component' },
                success: { type: 'selection-change', timeout: 1000 },
                naturalLanguage: (data) => `User selected ${data.componentType} component`
            },
            {
                name: 'component-movement', 
                description: 'User moves component',
                trigger: { type: 'drag-start', target: 'component' },
                success: { type: 'position-change', timeout: 3000 },
                naturalLanguage: (data) => `User moved ${data.componentType} component ${data.distance}px`
            },
            {
                name: 'copy-paste-workflow',
                description: 'User copies and pastes component',
                sequence: [
                    { type: 'key', key: 'copy' },
                    { type: 'key', key: 'paste', timeout: 10000 }
                ],
                success: { type: 'component-created', timeout: 2000 },
                naturalLanguage: (data) => `User duplicated ${data.componentType} component via copy-paste`
            },
            {
                name: 'property-modification',
                description: 'User changes component property',
                trigger: { type: 'input-change', target: 'properties-panel' },
                success: { type: 'component-update', timeout: 1000 },
                naturalLanguage: (data) => `User changed ${data.property} of ${data.componentType} component`
            },
            {
                name: 'component-deletion',
                description: 'User deletes component',
                trigger: { type: 'key', key: 'delete' },
                success: { type: 'component-removed', timeout: 1000 },
                naturalLanguage: (data) => `User deleted ${data.count} component(s)`
            }
        ];
    }

    /**
     * Start tracking a workflow
     */
    startWorkflow(patternName, triggerData) {
        const workflow = {
            id: ++this.workflowId,
            pattern: patternName,
            startTime: Date.now() - this.startTime,
            triggerData: triggerData,
            status: 'active',
            steps: [],
            expectedCompletion: Date.now() + (this.getPattern(patternName)?.success?.timeout || 5000)
        };

        this.activeWorkflows.set(workflow.id, workflow);
        
        console.info(`🔄 Started workflow: ${patternName}`);
        return workflow.id;
    }

    /**
     * Complete workflow with success/failure
     */
    completeWorkflow(workflowId, status, resultData = {}) {
        const workflow = this.activeWorkflows.get(workflowId);
        if (!workflow) return;

        workflow.status = status;
        workflow.endTime = Date.now() - this.startTime;
        workflow.duration = workflow.endTime - workflow.startTime;
        workflow.resultData = resultData;

        // Generate natural language description
        const pattern = this.getPattern(workflow.pattern);
        if (pattern?.naturalLanguage) {
            workflow.description = pattern.naturalLanguage({
                ...workflow.triggerData,
                ...resultData
            });
        }

        this.workflows.push(workflow);
        this.activeWorkflows.delete(workflowId);

        // Send to backend
        this.sendWorkflowToBackend(workflow);

        const emoji = status === 'success' ? '✅' : '❌';
        console.info(`${emoji} ${workflow.description || workflow.pattern}: ${status}`);
    }

    /**
     * Get pattern by name
     */
    getPattern(name) {
        return this.patterns.find(p => p.name === name);
    }

    /**
     * Setup pattern-based tracking
     */
    setupPatternTracking() {
        // Track clicks for component selection
        document.addEventListener('click', (e) => {
            if (e.target?.dataset?.id) {
                const workflowId = this.startWorkflow('component-selection', {
                    componentId: e.target.dataset.id,
                    componentType: this.getComponentType(e.target)
                });

                // Check for selection success
                setTimeout(() => {
                    const isSelected = e.target.classList.contains('selected');
                    this.completeWorkflow(workflowId, 
                        isSelected ? 'success' : 'failed'
                    );
                }, 500);
            }
        });

        // Track drag operations for movement
        let dragWorkflowId = null;
        let dragStartPos = null;

        document.addEventListener('mousedown', (e) => {
            if (e.target?.dataset?.id) {
                dragStartPos = { x: e.clientX, y: e.clientY };
                dragWorkflowId = this.startWorkflow('component-movement', {
                    componentId: e.target.dataset.id,
                    componentType: this.getComponentType(e.target),
                    startPosition: dragStartPos
                });
            }
        });

        document.addEventListener('mouseup', (e) => {
            if (dragWorkflowId && dragStartPos) {
                const dragEndPos = { x: e.clientX, y: e.clientY };
                const distance = Math.sqrt(
                    Math.pow(dragEndPos.x - dragStartPos.x, 2) + 
                    Math.pow(dragEndPos.y - dragStartPos.y, 2)
                );

                this.completeWorkflow(dragWorkflowId, 
                    distance > 10 ? 'success' : 'failed',
                    { distance: Math.round(distance), endPosition: dragEndPos }
                );

                dragWorkflowId = null;
                dragStartPos = null;
            }
        });

        // Track copy-paste workflow
        let copyWorkflowId = null;

        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key === 'c') {
                copyWorkflowId = this.startWorkflow('copy-paste-workflow', {
                    selectedComponents: this.getSelectedComponents()
                });
            }

            if (e.ctrlKey && e.key === 'v' && copyWorkflowId) {
                const beforeCount = document.querySelectorAll('[data-id]').length;
                
                setTimeout(() => {
                    const afterCount = document.querySelectorAll('[data-id]').length;
                    const newComponentsCount = afterCount - beforeCount;
                    
                    this.completeWorkflow(copyWorkflowId,
                        newComponentsCount > 0 ? 'success' : 'failed',
                        { newComponentsCount }
                    );

                    copyWorkflowId = null;
                }, 1000);
            }

            if (e.key === 'Delete') {
                const selectedCount = this.getSelectedComponents().length;
                const deleteWorkflowId = this.startWorkflow('component-deletion', {
                    count: selectedCount
                });

                setTimeout(() => {
                    const remainingSelected = this.getSelectedComponents().length;
                    this.completeWorkflow(deleteWorkflowId,
                        remainingSelected < selectedCount ? 'success' : 'failed',
                        { deletedCount: selectedCount - remainingSelected }
                    );
                }, 500);
            }
        });

        // Track property changes
        document.addEventListener('input', (e) => {
            if (e.target.type === 'color' || e.target.type === 'range' || e.target.dataset.property) {
                const workflowId = this.startWorkflow('property-modification', {
                    property: e.target.dataset.property || e.target.type,
                    newValue: e.target.value,
                    componentType: this.getCurrentComponentType()
                });

                // Property changes are typically successful
                setTimeout(() => {
                    this.completeWorkflow(workflowId, 'success');
                }, 300);
            }
        });

        // Auto-cleanup expired workflows
        setInterval(() => this.cleanupExpiredWorkflows(), 5000);
    }

    /**
     * Cleanup workflows that didn't complete in time
     */
    cleanupExpiredWorkflows() {
        const now = Date.now();
        const expired = [];

        this.activeWorkflows.forEach((workflow, id) => {
            if (now > workflow.expectedCompletion) {
                expired.push(id);
            }
        });

        expired.forEach(id => {
            const workflow = this.activeWorkflows.get(id);
            this.completeWorkflow(id, 'timeout', { 
                reason: 'Workflow did not complete within expected time' 
            });
        });
    }

    /**
     * Helper methods
     */
    getComponentType(element) {
        return element?.dataset?.type || 
               element?.querySelector('circle') ? 'led' :
               element?.querySelector('rect') ? 'pump' : 'component';
    }

    getSelectedComponents() {
        return Array.from(document.querySelectorAll('[data-id].selected'))
            .map(el => el.dataset.id);
    }

    getCurrentComponentType() {
        const selected = document.querySelector('[data-id].selected');
        return selected ? this.getComponentType(selected) : 'unknown';
    }

    /**
     * Send workflow to backend (throttled)
     */
    async sendWorkflowToBackend(workflow) {
        if (!this.workflowQueue) {
            this.workflowQueue = [];
            setTimeout(() => this.flushWorkflowQueue(), 2000);
        }
        
        this.workflowQueue.push(workflow);
    }

    async flushWorkflowQueue() {
        if (this.workflowQueue?.length > 0) {
            try {
                await fetch('http://localhost:5006/workflows', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        sessionHash: this.sessionHash,
                        workflows: this.workflowQueue
                    })
                });
            } catch (error) {
                // Silent fail
            }
            
            this.workflowQueue = null;
        }
    }

    /**
     * Get workflow summary for testing
     */
    getWorkflowSummary(timeWindow = 10000) {
        const recent = this.workflows.filter(w => 
            Date.now() - this.startTime - w.endTime < timeWindow
        );

        return {
            total: recent.length,
            successful: recent.filter(w => w.status === 'success').length,
            failed: recent.filter(w => w.status === 'failed').length,
            timedOut: recent.filter(w => w.status === 'timeout').length,
            averageDuration: recent.reduce((sum, w) => sum + w.duration, 0) / recent.length || 0,
            activeWorkflows: this.activeWorkflows.size,
            recentWorkflows: recent.slice(-3).map(w => ({
                pattern: w.pattern,
                status: w.status,
                description: w.description,
                duration: w.duration
            }))
        };
    }
}

export default PatternWorkflowLogger;
