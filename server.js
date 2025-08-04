/**
 * 🚀 Digital Twin PWA - Development Server
 * Proper HTTP server with correct MIME types for ES6 modules
 */

// Load environment variables from .env file
require('dotenv').config();

const express = require('express');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const { updateComponentsJson } = require('./scripts/update-components');

const app = express();
const PORT = process.env.PORT || 4000;
const HOST = process.env.HOST || 'localhost';
const NODE_ENV = process.env.NODE_ENV || 'development';

// Enable CORS if configured
if (process.env.CORS_ENABLED === 'true') {
  const allowedOrigins = (process.env.ALLOWED_ORIGINS || '').split(',');
  app.use(cors({
    origin: function(origin, callback) {
      // Allow requests with no origin (like mobile apps, curl, etc)
      if (!origin) return callback(null, true);
      if (allowedOrigins.indexOf(origin) === -1) {
        return callback(null, false);
      }
      return callback(null, true);
    },
    credentials: true
  }));
  console.log('✅ CORS enabled for origins:', allowedOrigins);
}

// Setup basic middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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

// 🔧 Configuration endpoint for frontend
app.get('/api/config', (req, res) => {
    // Only expose frontend-relevant configuration
    const config = {
        // Environment info
        environment: process.env.NODE_ENV || 'development',
        debugMode: process.env.DEBUG_MODE === 'true',
        
        // PWA settings
        pwa: {
            enabled: process.env.PWA_ENABLED === 'true',
            offlineSupport: process.env.OFFLINE_SUPPORT === 'true',
            pushNotifications: process.env.PUSH_NOTIFICATIONS === 'true'
        },
        
        // Service Worker settings
        serviceWorker: {
            enabled: process.env.SERVICE_WORKER_ENABLED === 'true',
            autoRegister: process.env.SERVICE_WORKER_AUTO_REGISTER === 'true',
            skipWaiting: process.env.SERVICE_WORKER_SKIP_WAITING === 'true',
            updateCheck: process.env.SERVICE_WORKER_UPDATE_CHECK === 'true',
            devMode: process.env.SERVICE_WORKER_DEV_MODE === 'true'
        },
        
        // Debug settings
        debug: {
            serviceWorker: process.env.DEBUG_SERVICE_WORKER === 'true',
            pwa: process.env.DEBUG_PWA === 'true',
            cache: process.env.DEBUG_CACHE === 'true',
            offline: process.env.DEBUG_OFFLINE === 'true',
            console: process.env.DEBUG_CONSOLE === 'true'
        },
        
        // Environment detection overrides
        overrides: {
            forceProductionMode: process.env.FORCE_PRODUCTION_MODE === 'true',
            disableDevModeCheck: process.env.DISABLE_DEV_MODE_CHECK === 'true'
        }
    };
    
    res.json(config);
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
app.listen(PORT, HOST, async () => {
    // Update components.json on server start
    try {
        console.log('🔄 Updating components configuration...');
        const success = await updateComponentsJson();
        if (success) {
            console.log('✅ Components configuration updated successfully');
        } else {
            console.warn('⚠️ Could not update components configuration, using existing file');
        }
    } catch (error) {
        console.error('❌ Error updating components configuration:', error.message);
    }
    
    console.log(`\n🚀 Digital Twin PWA ${process.env.APP_NAME || ''} Server running in ${NODE_ENV} mode`);
    console.log(`🌐 Application: http://${HOST}:${PORT}`);
    console.log(`🏥 Health Check: http://${HOST}:${PORT}/health`);
    console.log(`📊 Status: http://${HOST}:${PORT}/api/status`);
    console.log(`🧪 Test Results: http://${HOST}:${PORT}/test-results/`);
    console.log(`📚 Documentation: http://${HOST}:${PORT}/docs/`);
    console.log('');
    console.log('✅ ES6 modules properly configured');
    console.log('✅ MIME types set correctly');
    console.log('✅ Static file serving enabled');
    
    // Log PWA status
    if (process.env.PWA_ENABLED === 'true') {
        console.log('✅ PWA mode enabled');
        console.log(`✅ Offline support: ${process.env.OFFLINE_SUPPORT === 'true' ? 'enabled' : 'disabled'}`);
        console.log(`✅ Push notifications: ${process.env.PUSH_NOTIFICATIONS === 'true' ? 'enabled' : 'disabled'}`);
    }
    
    // Log collaboration status
    if (process.env.WEBSOCKET_ENABLED === 'true') {
        console.log(`✅ WebSocket server enabled on port ${process.env.WEBSOCKET_PORT || PORT}`); 
        console.log(`✅ Real-time collaboration ${process.env.COLLABORATION_MODE === 'true' ? 'enabled' : 'disabled'}`);
    }
    
    console.log('');
    console.log(`🔧 ${NODE_ENV.toUpperCase()} MODE ACTIVE`);
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
