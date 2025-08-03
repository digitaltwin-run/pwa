// Temporary fix for CollaborationManager
if (typeof CollaborationManager === 'undefined') {
    window.CollaborationManager = class CollaborationManager {
        constructor() {
            console.warn('CollaborationManager is running in compatibility mode');
            this.initialized = false;
        }
        
        init() {
            if (this.initialized) return Promise.resolve();
            this.initialized = true;
            console.log('CollaborationManager initialized in compatibility mode');
            return Promise.resolve();
        }
        
        // Add other required methods as no-ops
        connect() { return Promise.resolve(); }
        disconnect() { return Promise.resolve(); }
        send() { return Promise.resolve(); }
        on() { return this; }
        off() { return this; }
    };
}

// Initialize with safe defaults
if (typeof window !== 'undefined') {
    window.collaborationManager = new CollaborationManager();
    window.collaborationManager.init().catch(console.error);
}
