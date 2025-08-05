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
