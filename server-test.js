/**
 * Simple HTTP server for testing PWA features
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = 8085; // Using 8085 to avoid conflicts with other services
const MIME_TYPES = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.wav': 'audio/wav',
    '.mp4': 'video/mp4',
    '.woff': 'application/font-woff',
    '.ttf': 'application/font-ttf',
    '.eot': 'application/vnd.ms-fontobject',
    '.otf': 'application/font-otf',
    '.wasm': 'application/wasm'
};

// Create HTTP server
const server = http.createServer((req, res) => {
    console.log(`${new Date().toISOString()} ${req.method} ${req.url}`);
    
    // Parse URL
    const parsedUrl = url.parse(req.url);
    
    // Handle API endpoints
    if (parsedUrl.pathname === '/api/config') {
        // Serve the client configuration
        const config = {
            vapidPublicKey: 'BF_gMSomRFiLtQbJKDxEefNWqD0Y_zNOUbYc4dKmYZUtD1v185QrNiDk7Bzg72AI2eBlKM0QLmHy-8vBYEs9ydA',
            vapidEmail: 'admin@digitaltwin-run.local',
            enablePushNotifications: true
        };
        
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(config));
        return;
    }
    
    // Handle root URL
    let pathname = path.join(process.cwd(), parsedUrl.pathname === '/' ? 'test-pwa.html' : parsedUrl.pathname.split('?')[0]);
    
    // Security: Prevent directory traversal
    if (!pathname.startsWith(process.cwd())) {
        pathname = path.join(process.cwd(), 'test-pwa.html');
    }
    
    // Check if file exists
    fs.exists(pathname, (exist) => {
        if (!exist) {
            // If the file is not found, try to serve offline.html
            if (req.method === 'GET' && !req.headers['x-requested-with'] === 'XMLHttpRequest') {
                fs.readFile(path.join(process.cwd(), 'offline.html'), (err, data) => {
                    if (err) {
                        res.statusCode = 404;
                        res.end(`File not found and offline page not available: ${pathname}`);
                    } else {
                        res.statusCode = 200;
                        res.setHeader('Content-Type', 'text/html');
                        res.end(data);
                    }
                });
            } else {
                res.statusCode = 404;
                res.end(`File not found: ${pathname}`);
            }
            return;
        }
        
        // If it's a directory, look for index.html
        if (fs.statSync(pathname).isDirectory()) {
            pathname += '/index.html';
        }
        
        // Read file from file system
        fs.readFile(pathname, (err, data) => {
            if (err) {
                res.statusCode = 500;
                res.end(`Error getting the file: ${err}.`);
            } else {
                // Based on the URL path, extract the file extension
                const ext = path.parse(pathname).ext;
                // If the file is found, set Content-type and send data
                res.setHeader('Content-type', MIME_TYPES[ext] || 'application/octet-stream');
                
                // Inject configuration into HTML files
                if (ext === '.html') {
                    let html = data.toString();
                    // Inject configuration script before the closing head tag
                    const configScript = `
                        <script>
                            window.APP_CONFIG = {
                                vapidPublicKey: 'BF_gMSomRFiLtQbJKDxEefNWqD0Y_zNOUbYc4dKmYZUtD1v185QrNiDk7Bzg72AI2eBlKM0QLmHy-8vBYEs9ydA',
                                vapidEmail: 'admin@digitaltwin-run.local',
                                enablePushNotifications: true,
                                enableOffline: true
                            };
                        </script>
                    `;
                    
                    if (html.includes('</head>')) {
                        html = html.replace('</head>', `${configScript}\n</head>`);
                    } else if (html.includes('</body>')) {
                        html = html.replace('</body>', `${configScript}\n</body>`);
                    } else {
                        html = configScript + html;
                    }
                    
                    res.end(html);
                } else {
                    res.end(data);
                }
            }
        });
    });
});

// Start server
server.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}/`);
    console.log('Available test pages:');
    console.log(`- PWA Test: http://localhost:${PORT}/test-pwa.html`);
    console.log(`- RPi5B Test: http://localhost:${PORT}/test-rpi5b-extended.html`);
});

// Handle server errors
server.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
        console.error(`Port ${PORT} is already in use. Please stop the other process or use a different port.`);
    } else {
        console.error('Server error:', error);
    }
    process.exit(1);
});

// Handle process termination
process.on('SIGINT', () => {
    console.log('\nShutting down server...');
    server.close(() => {
        console.log('Server stopped');
        process.exit(0);
    });
});
