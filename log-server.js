#!/usr/bin/env node
/**
 * Real-time Log Server for Digital Twin IDE
 * Receives logs from frontend and saves them to files in real-time
 * Files are accessible to windsurf with explicit naming
 */

const http = require('http');
const fs = require('fs').promises;
const path = require('path');
const url = require('url');

class LogServer {
    constructor(port = 5006) {
        this.port = port;
        this.logsDir = path.join(__dirname, 'logs');
        this.activeSessions = new Map(); // sessionHash -> logData
        this.init();
    }

    async init() {
        // Create logs directory if it doesn't exist
        try {
            await fs.mkdir(this.logsDir, { recursive: true });
            console.log(`📁 Logs directory created: ${this.logsDir}`);
        } catch (error) {
            console.error('Failed to create logs directory:', error);
        }

        // Create HTTP server
        this.server = http.createServer((req, res) => {
            this.handleRequest(req, res);
        });

        this.server.listen(this.port, () => {
            console.log(`🚀 Log Server running on http://localhost:${this.port}`);
            console.log(`📁 Logs saved to: ${this.logsDir}`);
        });
    }

    async handleRequest(req, res) {
        // Enable CORS for frontend access
        this.setCORSHeaders(res);

        if (req.method === 'OPTIONS') {
            res.writeHead(200);
            res.end();
            return;
        }

        const parsedUrl = url.parse(req.url, true);
        const pathname = parsedUrl.pathname;

        try {
            if (pathname === '/log' && req.method === 'POST') {
                await this.handleLogEntry(req, res);
            } else if (pathname === '/session' && req.method === 'POST') {
                await this.handleSessionInit(req, res);
            } else if (pathname === '/status' && req.method === 'GET') {
                await this.handleStatus(req, res);
            } else if (pathname === '/files' && req.method === 'GET') {
                await this.handleListFiles(req, res);
            } else if (pathname === '/api/components' && req.method === 'GET') {
                await this.handleComponentsAPI(req, res);
            } else {
                res.writeHead(404, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Not found' }));
            }
        } catch (error) {
            console.error('Request error:', error);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Internal server error' }));
        }
    }

    setCORSHeaders(res) {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    }

    async handleSessionInit(req, res) {
        const body = await this.getRequestBody(req);
        const sessionData = JSON.parse(body);
        
        const sessionHash = sessionData.sessionHash;
        const filename = `${sessionHash}.log.json`;
        const filepath = path.join(this.logsDir, filename);

        // Initialize session data
        const logData = {
            sessionHash: sessionHash,
            filename: filename,
            filepath: filepath,
            startTime: Date.now(),
            url: sessionData.url,
            userAgent: sessionData.userAgent,
            totalLogs: 0,
            errorCount: 0,
            warnCount: 0,
            logs: []
        };

        this.activeSessions.set(sessionHash, logData);

        // Save initial file
        await this.saveLogFile(sessionHash);

        console.log(`📝 New session initialized: ${filename}`);

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
            success: true, 
            filename: filename,
            filepath: filepath
        }));
    }

    async handleLogEntry(req, res) {
        const body = await this.getRequestBody(req);
        const logEntry = JSON.parse(body);
        
        const sessionHash = logEntry.sessionHash;
        
        if (!this.activeSessions.has(sessionHash)) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Session not initialized' }));
            return;
        }

        const sessionData = this.activeSessions.get(sessionHash);
        
        // Add log entry
        sessionData.logs.push(logEntry);
        sessionData.totalLogs++;
        
        if (logEntry.level === 'error') sessionData.errorCount++;
        if (logEntry.level === 'warn') sessionData.warnCount++;
        
        sessionData.lastUpdate = Date.now();

        // Save to file immediately (real-time)
        await this.saveLogFile(sessionHash);

        console.log(`📝 Log saved: ${sessionData.filename} (${sessionData.totalLogs} entries)`);

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
            success: true,
            filename: sessionData.filename,
            totalLogs: sessionData.totalLogs
        }));
    }

    async handleStatus(req, res) {
        const status = {
            server: 'running',
            port: this.port,
            logsDir: this.logsDir,
            activeSessions: this.activeSessions.size,
            sessions: Array.from(this.activeSessions.values()).map(session => ({
                sessionHash: session.sessionHash,
                filename: session.filename,
                totalLogs: session.totalLogs,
                errorCount: session.errorCount,
                warnCount: session.warnCount,
                startTime: session.startTime,
                lastUpdate: session.lastUpdate || session.startTime
            }))
        };

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(status, null, 2));
    }

    async handleListFiles(req, res) {
        try {
            const files = await fs.readdir(this.logsDir);
            const logFiles = files.filter(file => file.endsWith('.log.json'));
            
            const fileDetails = await Promise.all(
                logFiles.map(async (filename) => {
                    const filepath = path.join(this.logsDir, filename);
                    const stats = await fs.stat(filepath);
                    return {
                        filename,
                        filepath,
                        size: stats.size,
                        created: stats.birthtime,
                        modified: stats.mtime
                    };
                })
            );

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ files: fileDetails }, null, 2));
        } catch (error) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Failed to list files' }));
        }
    }

    async handleComponentsAPI(req, res) {
        try {
            // Scan components/*.svg directory dynamically
            const componentsDir = path.join(__dirname, 'components');
            const svgFiles = await fs.readdir(componentsDir);
            const components = [];
            
            // Process each SVG file
            for (const filename of svgFiles) {
                if (filename.endsWith('.svg') && !filename.includes('.bak')) {
                    const componentId = filename.replace('.svg', '').toLowerCase();
                    const componentName = this.formatComponentName(componentId);
                    const svgPath = `components/${filename}`;
                    
                    components.push({
                        id: componentId,
                        name: componentName,
                        svg: svgPath,
                        category: this.getComponentCategory(componentId),
                        description: `${componentName} component`,
                        draggable: true,
                        clickable: true
                    });
                }
            }
            
            // Sort components alphabetically
            components.sort((a, b) => a.name.localeCompare(b.name));
            
            const responseData = {
                components: components,
                generated: new Date().toISOString(),
                count: components.length,
                source: 'components/*.svg'
            };
            
            // Set strong cache-busting headers
            res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate, max-age=0');
            res.setHeader('Pragma', 'no-cache');
            res.setHeader('Expires', '0');
            res.setHeader('Last-Modified', new Date().toUTCString());
            res.setHeader('ETag', `"${Date.now()}"`);
            
            console.log(`📦 Generated ${components.length} components from components/*.svg with cache-busting headers`);
            
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(responseData, null, 2));
        } catch (error) {
            console.error('Failed to scan components directory:', error);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Failed to scan components directory' }));
        }
    }

    // Helper method to format component names from filenames
    formatComponentName(componentId) {
        const nameMap = {
            'gauge': 'Analog Gauge',
            'led': 'Animated LED',
            'pump': 'Centrifugal Pump',
            'valve': 'Control Valve',
            'motor': 'Electric Motor',
            'display': 'HTML Display',
            'modbus8adc': 'Modbus RTU Analog Input 8CH',
            'modbus8i8o': 'Modbus RTU IO 8CH',
            'counter': 'Numeric Counter',
            'button': 'Push Button',
            'button-new': 'Push Button (New)',
            'button2': 'Push Button Alt',
            'rpi3b': 'Raspberry Pi 3B',
            'rpi4b': 'Raspberry Pi 4 Model B',
            'rpi5b': 'Raspberry Pi 5',
            'rpizero2w': 'Raspberry Pi Zero 2 W',
            'relay': 'Relay',
            'sensor': 'Temperature Sensor',
            'knob': 'Rotary Knob',
            'slider': 'Slider',
            'switch': 'Switch',
            'toggle': 'Toggle Switch',
            'usb2rs485': 'USB to RS485 Converter'
        };
        
        return nameMap[componentId] || componentId.split(/[_-]/).map(word => 
            word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ');
    }
    
    // Helper method to categorize components
    getComponentCategory(componentId) {
        const categoryMap = {
            'gauge': 'Indicators',
            'led': 'Indicators', 
            'display': 'Indicators',
            'counter': 'Indicators',
            'pump': 'Actuators',
            'valve': 'Actuators',
            'motor': 'Actuators',
            'relay': 'Actuators',
            'button': 'Controls',
            'button-new': 'Controls',
            'button2': 'Controls',
            'knob': 'Controls',
            'slider': 'Controls',
            'switch': 'Controls',
            'toggle': 'Controls',
            'sensor': 'Sensors',
            'rpi3b': 'Hardware',
            'rpi4b': 'Hardware',
            'rpi5b': 'Hardware',
            'rpizero2w': 'Hardware',
            'modbus8adc': 'Communication',
            'modbus8i8o': 'Communication',
            'usb2rs485': 'Communication'
        };
        
        return categoryMap[componentId] || 'General';
    }

    async saveLogFile(sessionHash) {
        const sessionData = this.activeSessions.get(sessionHash);
        if (!sessionData) return;

        const fileContent = {
            ...sessionData,
            endTime: Date.now(),
            duration: Date.now() - sessionData.startTime
        };

        await fs.writeFile(
            sessionData.filepath, 
            JSON.stringify(fileContent, null, 2),
            'utf8'
        );
    }

    async getRequestBody(req) {
        return new Promise((resolve, reject) => {
            let body = '';
            req.on('data', chunk => {
                body += chunk.toString();
            });
            req.on('end', () => {
                resolve(body);
            });
            req.on('error', reject);
        });
    }

    async shutdown() {
        console.log('🛑 Shutting down log server...');
        
        // Save all active sessions
        for (const sessionHash of this.activeSessions.keys()) {
            await this.saveLogFile(sessionHash);
        }
        
        this.server.close();
        console.log('✅ Log server shutdown complete');
    }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
    if (global.logServer) {
        await global.logServer.shutdown();
    }
    process.exit(0);
});

process.on('SIGTERM', async () => {
    if (global.logServer) {
        await global.logServer.shutdown();
    }
    process.exit(0);
});

// Start server
global.logServer = new LogServer(5006);

module.exports = LogServer;
