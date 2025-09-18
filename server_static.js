const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const port = 3000;

// MIME types for different file extensions
const mimeTypes = {
    '.html': 'text/html',
    '.js': 'application/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.gif': 'image/gif',
    '.ico': 'image/x-icon',
    '.svg': 'image/svg+xml'
};

const server = http.createServer((req, res) => {
    const parsedUrl = url.parse(req.url);
    let pathname = parsedUrl.pathname;
    
    // Default to index.html
    if (pathname === '/') {
        pathname = '/index.html';
    }
    
    const filePath = path.join(__dirname, pathname);
    const ext = path.extname(filePath);
    const mimeType = mimeTypes[ext] || 'text/plain';
    
    console.log(`📁 Requested: ${pathname}`);
    
    fs.readFile(filePath, (err, data) => {
        if (err) {
            console.log(`❌ Error reading file: ${filePath}`);
            res.writeHead(404, { 'Content-Type': 'text/html' });
            res.end('<h1>404 Not Found</h1>');
            return;
        }
        
        console.log(`✅ Serving: ${pathname}`);
        res.writeHead(200, { 
            'Content-Type': mimeType,
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        });
        res.end(data);
    });
});

server.listen(port, () => {
    console.log(`🌐 Static server running at http://localhost:${port}`);
    console.log(`📂 Serving files from: ${__dirname}`);
    console.log(`🚀 Open http://localhost:${port} in your browser`);
});

server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.log(`❌ Port ${port} is already in use. Trying port ${port + 1}...`);
        server.listen(port + 1);
    } else {
        console.error('❌ Server error:', err);
    }
});
