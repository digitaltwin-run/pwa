/**
 * Patched Collaboration Manager
 * This is a temporary fix for the 'process is not defined' error
 */

// Create a safe process.env if it doesn't exist
if (typeof process === 'undefined') {
    window.process = { env: {} };
} else if (!process.env) {
    process.env = {};
}

// Default environment variables
process.env.NODE_ENV = process.env.NODE_ENV || 'development';
process.env.COLLABORATION_SERVER = process.env.COLLABORATION_SERVER || 'http://localhost:3001';

// Export the original CollaborationManager
import { CollaborationManager as OriginalCollaborationManager } from './collaboration-manager.js';

export class CollaborationManager extends OriginalCollaborationManager {
    constructor() {
        // Ensure process.env is available
        if (typeof process === 'undefined' || !process.env) {
            window.process = window.process || { env: {} };
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
