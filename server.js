/**
 * 🚀 Digital Twin PWA - Development Server
 * Proper HTTP server with correct MIME types for ES6 modules
 */

const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 8080;

// 🔧 Configure proper MIME types for ES6 modules
app.use(express.static('.', {
    setHeaders: (res, filePath) => {
        if (filePath.endsWith('.js')) {
            res.setHeader('Content-Type', 'application/javascript');
        } else if (filePath.endsWith('.mjs')) {
            res.setHeader('Content-Type', 'application/javascript');
        } else if (filePath.endsWith('.json')) {
            res.setHeader('Content-Type', 'application/json');
        } else if (filePath.endsWith('.css')) {
            res.setHeader('Content-Type', 'text/css');
        } else if (filePath.endsWith('.html')) {
            res.setHeader('Content-Type', 'text/html');
        } else if (filePath.endsWith('.svg')) {
            res.setHeader('Content-Type', 'image/svg+xml');
        }
    }
}));

// 🏥 Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development'
    });
});

// 📊 API endpoints for testing and monitoring
app.get('/api/status', (req, res) => {
    res.json({
        server: 'Digital Twin PWA Development Server',
        version: '1.0.0',
        node: process.version,
        memory: process.memoryUsage(),
        environment: process.env.NODE_ENV || 'development'
    });
});

// 📄 Serve test results
app.use('/test-results', express.static('test-results'));

// 📚 Serve documentation
app.use('/docs', express.static('docs'));

// 🧪 API endpoint for error reports (for future integration)
app.post('/api/errors', express.json(), (req, res) => {
    const error = req.body;
    console.error('🚨 Client Error Report:', error);
    
    // In production, you'd save this to a database
    // For development, just log it
    res.json({ status: 'logged', timestamp: new Date().toISOString() });
});

// 🎯 Fallback to index.html for SPA routing
app.get('*', (req, res) => {
    // Don't interfere with API routes or static assets
    if (req.path.startsWith('/api/') || 
        req.path.includes('.') || 
        req.path.startsWith('/test-results/') ||
        req.path.startsWith('/docs/')) {
        return res.status(404).send('Not Found');
    }
    
    res.sendFile(path.join(__dirname, 'index.html'));
});

// 🚀 Start server
app.listen(PORT, () => {
    console.log(`🚀 Digital Twin PWA Development Server running on port ${PORT}`);
    console.log(`🌐 Application: http://localhost:${PORT}`);
    console.log(`🏥 Health Check: http://localhost:${PORT}/health`);
    console.log(`📊 Status: http://localhost:${PORT}/api/status`);
    console.log(`🧪 Test Results: http://localhost:${PORT}/test-results/`);
    console.log(`📚 Documentation: http://localhost:${PORT}/docs/`);
    console.log('');
    console.log('✅ ES6 modules properly configured');
    console.log('✅ MIME types set correctly');
    console.log('✅ Static file serving enabled');
    console.log('');
    console.log('🔧 Development mode active');
});

// 🛑 Graceful shutdown
process.on('SIGTERM', () => {
    console.log('🛑 Received SIGTERM, shutting down gracefully...');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('🛑 Received SIGINT, shutting down gracefully...');
    process.exit(0);
});

module.exports = app;
