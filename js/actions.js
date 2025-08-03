// Digital Twin IDE - Actions Module
export class ActionManager {
    constructor(componentManager) {
        this.componentManager = componentManager;
        this.actions = new Map();
        this.setupBuiltInActions();
    }

    // Register built-in actions
    setupBuiltInActions() {
        // HTTP Request Action
        this.registerAction('http-request', async (params) => {
            try {
                const { method = 'GET', url, headers = {}, body } = params;
                const options = { method, headers };
                
                if (body && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
                    options.body = typeof body === 'string' ? body : JSON.stringify(body);
                    if (!options.headers['Content-Type']) {
                        options.headers['Content-Type'] = 'application/json';
                    }
                }

                const response = await fetch(url, options);
                const responseData = await response.json().catch(() => ({}));
                
                return {
                    status: response.status,
                    statusText: response.statusText,
                    data: responseData
                };
            } catch (error) {
                console.error('HTTP Request Error:', error);
                throw error;
            }
        });

        // Toggle State Action
        this.registerAction('toggle-state', (params, componentId) => {
            const component = this.componentManager.getComponent(componentId);
            if (component) {
                const currentState = component.state?.active || false;
                component.state = { ...component.state, active: !currentState };
                this.componentManager.updateComponentState(componentId, component.state);
                return { newState: !currentState };
            }
            return null;
        });
    }

    // Register a new action type
    registerAction(actionType, handler) {
        this.actions.set(actionType, handler);
    }

    // Execute an action
    async executeAction(actionConfig, componentId) {
        if (!actionConfig || !actionConfig.type) {
            console.warn('Invalid action configuration');
            return null;
        }

        const handler = this.actions.get(actionConfig.type);
        if (!handler) {
            console.warn(`No handler found for action type: ${actionConfig.type}`);
            return null;
        }

        try {
            return await handler(actionConfig.params || {}, componentId);
        } catch (error) {
            console.error(`Error executing action ${actionConfig.type}:`, error);
            throw error;
        }
    }

    // Execute all actions for a specific event
    async triggerEvent(componentId, eventName) {
        const component = this.componentManager.getComponent(componentId);
        if (!component || !component.events || !component.events[eventName]) {
            return;
        }

        const eventActions = Array.isArray(component.events[eventName])
            ? component.events[eventName]
            : [component.events[eventName]];

        const results = [];
        for (const action of eventActions) {
            try {
                const result = await this.executeAction(action, componentId);
                results.push({ action, result });
            } catch (error) {
                console.error(`Error in ${eventName} action:`, error);
                results.push({ action, error: error.message });
            }
        }

        return results;
    }
}
