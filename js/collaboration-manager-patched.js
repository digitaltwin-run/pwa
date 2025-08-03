/**
 * Patched Collaboration Manager
 * This is a temporary fix for the 'process is not defined' error
 */

// Browser-compatible configuration (no process.env)
const collaborationConfig = {
    NODE_ENV: 'development',
    COLLABORATION_SERVER: 'http://localhost:3001'
};

// Make config available globally for compatibility
if (typeof window !== 'undefined') {
    window.collaborationConfig = collaborationConfig;
}

// Export the original CollaborationManager
import { CollaborationManager as OriginalCollaborationManager } from './collaboration-manager.js';

export class CollaborationManager extends OriginalCollaborationManager {
    constructor() {
        // Ensure collaborationConfig is available
        if (typeof window === 'undefined' || !window.collaborationConfig) {
            window.collaborationConfig = collaborationConfig;
        }
        
        // Call parent constructor
        super();
        
        console.log('✅ CollaborationManager (patched) initialized');
    }
    
    // Add any necessary method overrides here
}

// Export a singleton instance
export const collaborationManager = new CollaborationManager();

export default collaborationManager;
