/**
 * 🌐 Real-time Collaboration Manager
 * WebSocket/WebRTC implementation for multi-user editing
 */

class CollaborationManager {
    constructor() {
        this.isEnabled = false;
        this.websocket = null;
        this.rtcConnection = null;
        this.localUser = null;
        this.connectedUsers = new Map();
        this.cursors = new Map();
        this.roomId = null;
        this.isHost = false;
        
        // Configuration
        this.config = {
            websocketUrl: 'ws://localhost:4001', // Browser-compatible hardcoded websocket URL
            iceServers: [
                { urls: 'stun:stun.l.google.com:19302' },
                { urls: 'stun:stun1.l.google.com:19302' }
            ]
        };
        
        console.log('🌐 Collaboration Manager initialized');
        this.init();
    }

    async init() {
        // Check if collaboration is enabled (browser-compatible)
        this.isEnabled = localStorage.getItem('collaboration-enabled') === 'true' || false;
                        
        if (!this.isEnabled) {
            console.log('📴 Collaboration disabled');
            return;
        }

        console.log('🚀 Initializing real-time collaboration...');
        
        // Generate or retrieve user ID
        this.localUser = this.getOrCreateUser();
        
        // Set up collaboration UI
        this.setupCollaborationUI();
        
        // Set up canvas event listeners
        this.setupCanvasListeners();
        
        console.log('✅ Collaboration Manager ready');
    }

    // Generate or retrieve user identity
    getOrCreateUser() {
        let user = JSON.parse(localStorage.getItem('collaboration-user') || 'null');
        
        if (!user) {
            const colors = ['#3498db', '#e74c3c', '#2ecc71', '#f39c12', '#9b59b6', '#1abc9c'];
            user = {
                id: this.generateUserId(),
                name: `User ${Math.floor(Math.random() * 1000)}`,
                color: colors[Math.floor(Math.random() * colors.length)],
                avatar: this.generateAvatar(),
                joinedAt: Date.now()
            };
            localStorage.setItem('collaboration-user', JSON.stringify(user));
        }
        
        console.log('👤 Local user:', user);
        return user;
    }

    // Generate unique user ID
    generateUserId() {
        return 'user_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
    }

    // Generate user avatar
    generateAvatar() {
        const emojis = ['👨‍💻', '👩‍💻', '🧑‍🔬', '👨‍🔧', '👩‍🔧', '🧑‍💼', '👨‍🎨', '👩‍🎨'];
        return emojis[Math.floor(Math.random() * emojis.length)];
    }

    // Create or join a collaboration room
    async joinRoom(roomId = null) {
        if (!this.isEnabled) {
            console.warn('❌ Collaboration not enabled');
            return false;
        }

        try {
            this.roomId = roomId || this.generateRoomId();
            this.isHost = !roomId; // Host if creating new room
            
            console.log(`🚪 ${this.isHost ? 'Creating' : 'Joining'} room:`, this.roomId);
            
            // Connect to WebSocket server
            await this.connectWebSocket();
            
            // Join the room
            this.sendMessage({
                type: 'join-room',
                roomId: this.roomId,
                user: this.localUser,
                isHost: this.isHost
            });
            
            return this.roomId;
        } catch (error) {
            console.error('❌ Failed to join room:', error);
            return false;
        }
    }

    // Generate room ID
    generateRoomId() {
        return 'room_' + Math.random().toString(36).substr(2, 6).toUpperCase();
    }

    // Connect to WebSocket server
    async connectWebSocket() {
        return new Promise((resolve, reject) => {
            try {
                this.websocket = new WebSocket(this.config.websocketUrl);
                
                this.websocket.onopen = () => {
                    console.log('✅ WebSocket connected');
                    this.updateConnectionStatus('connected');
                    resolve();
                };
                
                this.websocket.onmessage = (event) => {
                    this.handleWebSocketMessage(event);
                };
                
                this.websocket.onerror = (error) => {
                    console.error('❌ WebSocket error:', error);
                    this.updateConnectionStatus('error');
                    reject(error);
                };
                
                this.websocket.onclose = () => {
                    console.log('📴 WebSocket disconnected');
                    this.updateConnectionStatus('disconnected');
                    this.handleDisconnection();
                };
                
            } catch (error) {
                console.error('❌ WebSocket connection failed:', error);
                reject(error);
            }
        });
    }

    // Handle WebSocket messages
    handleWebSocketMessage(event) {
        try {
            const message = JSON.parse(event.data);
            console.log('📨 Received message:', message.type);
            
            switch (message.type) {
                case 'room-joined':
                    this.handleRoomJoined(message);
                    break;
                case 'user-joined':
                    this.handleUserJoined(message);
                    break;
                case 'user-left':
                    this.handleUserLeft(message);
                    break;
                case 'canvas-update':
                    this.handleCanvasUpdate(message);
                    break;
                case 'cursor-move':
                    this.handleCursorMove(message);
                    break;
                case 'component-select':
                    this.handleComponentSelect(message);
                    break;
                case 'rtc-offer':
                case 'rtc-answer':
                case 'rtc-ice-candidate':
                    this.handleRTCMessage(message);
                    break;
                default:
                    console.log('🤷‍♂️ Unknown message type:', message.type);
            }
        } catch (error) {
            console.error('❌ Failed to handle WebSocket message:', error);
        }
    }

    // Handle room joined
    handleRoomJoined(message) {
        console.log('🎉 Successfully joined room:', message.roomId);
        this.connectedUsers = new Map(message.users.map(user => [user.id, user]));
        this.updateUsersList();
        this.showNotification(`Joined room ${message.roomId}`, 'success');
    }

    // Handle user joined
    handleUserJoined(message) {
        const user = message.user;
        this.connectedUsers.set(user.id, user);
        this.updateUsersList();
        this.showNotification(`${user.name} joined`, 'info');
        console.log('👋 User joined:', user.name);
    }

    // Handle user left
    handleUserLeft(message) {
        const userId = message.userId;
        const user = this.connectedUsers.get(userId);
        if (user) {
            this.connectedUsers.delete(userId);
            this.cursors.delete(userId);
            this.updateUsersList();
            this.showNotification(`${user.name} left`, 'info');
            console.log('👋 User left:', user.name);
        }
    }

    // Handle canvas updates from other users
    handleCanvasUpdate(message) {
        if (message.userId === this.localUser.id) return; // Ignore own updates
        
        console.log('🎨 Canvas update from:', message.user.name);
        
        // Apply the update to local canvas
        this.applyCanvasUpdate(message.update);
        
        // Show visual indicator
        this.showUpdateIndicator(message.user);
    }

    // Handle cursor movements
    handleCursorMove(message) {
        if (message.userId === this.localUser.id) return; // Ignore own cursor
        
        this.updateRemoteCursor(message.userId, message.position, message.user);
    }

    // Handle component selection
    handleComponentSelect(message) {
        if (message.userId === this.localUser.id) return; // Ignore own selection
        
        this.showRemoteSelection(message.componentId, message.user);
    }

    // Setup canvas event listeners for collaboration
    setupCanvasListeners() {
        const canvas = document.getElementById('svg-canvas');
        if (!canvas) return;

        // Track mouse movements for cursor sharing
        canvas.addEventListener('mousemove', (event) => {
            if (this.websocket && this.websocket.readyState === WebSocket.OPEN) {
                const rect = canvas.getBoundingClientRect();
                const position = {
                    x: event.clientX - rect.left,
                    y: event.clientY - rect.top,
                    timestamp: Date.now()
                };
                
                // Throttle cursor updates
                if (!this.lastCursorUpdate || Date.now() - this.lastCursorUpdate > 50) {
                    this.sendMessage({
                        type: 'cursor-move',
                        position,
                        user: this.localUser
                    });
                    this.lastCursorUpdate = Date.now();
                }
            }
        });

        // Track canvas changes
        const observer = new MutationObserver((mutations) => {
            if (this.websocket && this.websocket.readyState === WebSocket.OPEN) {
                mutations.forEach((mutation) => {
                    if (mutation.type === 'childList' || mutation.type === 'attributes') {
                        this.broadcastCanvasUpdate(mutation);
                    }
                });
            }
        });

        observer.observe(canvas, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['data-id', 'x', 'y', 'transform']
        });
    }

    // Broadcast canvas updates to other users
    broadcastCanvasUpdate(mutation) {
        const update = {
            type: mutation.type,
            target: this.serializeElement(mutation.target),
            timestamp: Date.now()
        };

        this.sendMessage({
            type: 'canvas-update',
            update,
            user: this.localUser
        });
    }

    // Apply canvas update from remote user
    applyCanvasUpdate(update) {
        try {
            // Find target element
            const targetElement = this.findElementFromSerialized(update.target);
            if (!targetElement) return;

            // Apply the update based on type
            switch (update.type) {
                case 'childList':
                    // Handle added/removed elements
                    console.log('📝 Applying child list update');
                    break;
                case 'attributes':
                    // Handle attribute changes
                    console.log('📝 Applying attribute update');
                    break;
            }
        } catch (error) {
            console.error('❌ Failed to apply canvas update:', error);
        }
    }

    // Setup collaboration UI
    setupCollaborationUI() {
        // Create collaboration panel
        const collaborationPanel = document.createElement('div');
        collaborationPanel.id = 'collaboration-panel';
        collaborationPanel.innerHTML = `
            <div class="collaboration-header">
                <h3>🌐 Collaboration</h3>
                <div class="connection-status" id="connection-status">Disconnected</div>
            </div>
            <div class="room-controls">
                <input type="text" id="room-id-input" placeholder="Room ID (optional)">
                <button id="join-room-btn">Join Room</button>
                <button id="create-room-btn">Create Room</button>
                <button id="leave-room-btn" style="display:none;">Leave Room</button>
            </div>
            <div class="users-list" id="users-list">
                <h4>Connected Users</h4>
                <div id="users-container"></div>
            </div>
        `;

        // Add to page
        document.body.appendChild(collaborationPanel);

        // Add event listeners
        document.getElementById('join-room-btn').onclick = () => {
            const roomId = document.getElementById('room-id-input').value.trim();
            this.joinRoom(roomId || null);
        };

        document.getElementById('create-room-btn').onclick = () => {
            this.joinRoom();
        };

        document.getElementById('leave-room-btn').onclick = () => {
            this.leaveRoom();
        };
    }

    // Update connection status in UI
    updateConnectionStatus(status) {
        const statusElement = document.getElementById('connection-status');
        if (statusElement) {
            statusElement.textContent = status;
            statusElement.className = `connection-status status-${status}`;
        }
    }

    // Update users list in UI
    updateUsersList() {
        const container = document.getElementById('users-container');
        if (!container) return;

        container.innerHTML = '';
        
        // Add local user
        const localUserDiv = this.createUserElement(this.localUser, true);
        container.appendChild(localUserDiv);
        
        // Add remote users
        this.connectedUsers.forEach(user => {
            if (user.id !== this.localUser.id) {
                const userDiv = this.createUserElement(user, false);
                container.appendChild(userDiv);
            }
        });
    }

    // Create user element for UI
    createUserElement(user, isLocal) {
        const userDiv = document.createElement('div');
        userDiv.className = `user-item ${isLocal ? 'local-user' : 'remote-user'}`;
        userDiv.innerHTML = `
            <div class="user-avatar" style="background-color: ${user.color}">
                ${user.avatar}
            </div>
            <div class="user-info">
                <div class="user-name">${user.name} ${isLocal ? '(You)' : ''}</div>
                <div class="user-status">Active</div>
            </div>
        `;
        return userDiv;
    }

    // Send message via WebSocket
    sendMessage(message) {
        if (this.websocket && this.websocket.readyState === WebSocket.OPEN) {
            message.userId = this.localUser.id;
            message.roomId = this.roomId;
            message.timestamp = Date.now();
            
            this.websocket.send(JSON.stringify(message));
        }
    }

    // Show notification
    showNotification(message, type = 'info') {
        console.log(`🔔 ${type.toUpperCase()}: ${message}`);
        
        // Use PWA Manager if available
        if (window.pwaManager) {
            window.pwaManager.showNotification('Collaboration', {
                body: message,
                icon: '🌐'
            });
        }
    }

    // Utility functions
    serializeElement(element) {
        return {
            tagName: element.tagName,
            id: element.id,
            className: element.className,
            attributes: Array.from(element.attributes).map(attr => ({
                name: attr.name,
                value: attr.value
            }))
        };
    }

    findElementFromSerialized(serialized) {
        if (serialized.id) {
            return document.getElementById(serialized.id);
        }
        // More complex element finding logic would go here
        return null;
    }

    // Leave room
    leaveRoom() {
        if (this.websocket) {
            this.sendMessage({
                type: 'leave-room'
            });
            this.websocket.close();
        }
        
        this.connectedUsers.clear();
        this.cursors.clear();
        this.roomId = null;
        this.updateUsersList();
        this.updateConnectionStatus('disconnected');
        
        console.log('👋 Left collaboration room');
    }

    // Handle disconnection
    handleDisconnection() {
        this.connectedUsers.clear();
        this.cursors.clear();
        this.updateUsersList();
        
        // Try to reconnect after delay
        setTimeout(() => {
            if (this.roomId) {
                console.log('🔄 Attempting to reconnect...');
                this.joinRoom(this.roomId);
            }
        }, 5000);
    }

    // Public API
    enable() {
        this.isEnabled = true;
        localStorage.setItem('collaboration-enabled', 'true');
        this.init();
    }

    disable() {
        this.isEnabled = false;
        localStorage.setItem('collaboration-enabled', 'false');
        this.leaveRoom();
    }

    getStatus() {
        return {
            enabled: this.isEnabled,
            connected: this.websocket?.readyState === WebSocket.OPEN,
            roomId: this.roomId,
            isHost: this.isHost,
            connectedUsers: this.connectedUsers.size,
            localUser: this.localUser
        };
    }
}

// Global collaboration manager instance
window.collaborationManager = new CollaborationManager();

// Export for module usage
export { CollaborationManager };
export default CollaborationManager;

console.log('🌐 Collaboration Manager loaded!');
console.log('📋 Available collaboration commands:');
console.log('  collaborationManager.enable() - Enable collaboration');
console.log('  collaborationManager.joinRoom(roomId) - Join/create room');
console.log('  collaborationManager.getStatus() - Get collaboration status');
