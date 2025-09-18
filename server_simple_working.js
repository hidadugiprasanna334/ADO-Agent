const express = require('express');
const path = require('path');

console.log('🚀 Starting Simple Working Server...');
console.log('⏰ Time:', new Date().toLocaleString());

const app = express();
const PORT = 3000;

// Basic middleware
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// Enable CORS manually
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    if (req.method === 'OPTIONS') {
        res.sendStatus(200);
    } else {
        next();
    }
});

// Log all requests
app.use((req, res, next) => {
    console.log(`📝 ${req.method} ${req.path}`);
    next();
});

// Health check
app.get('/api/health', (req, res) => {
    console.log('🔍 Health check requested');
    res.json({
        status: 'ok',
        azure_client: 'working_mock',
        timestamp: new Date().toISOString(),
        message: 'Server is running perfectly!'
    });
});

// Simple chat endpoint
app.post('/api/chat', (req, res) => {
    try {
        const { message } = req.body;
        console.log('🗨️  Received message:', message);
        
        // Simple response without async delays
        const response = `Hello! I'm your ADO Ticket Agent. You said: "${message}". I can help you with Azure DevOps work items, tickets, bugs, user stories, and project management. This is a working test response!`;
        
        console.log('📤 Sending response');
        res.json({
            success: true,
            message: response,
            source: 'simple_mock'
        });
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        res.status(500).json({
            success: false,
            message: 'Error occurred',
            error: error.message
        });
    }
});

// Start server immediately
console.log('🔧 Starting server on port', PORT);

app.listen(PORT, () => {
    console.log('\n✅ SERVER IS RUNNING!');
    console.log('🔗 URL: http://localhost:' + PORT);
    console.log('📱 Open your browser now!');
    console.log('⭐ Server started successfully at', new Date().toLocaleString());
});

// Error handlers
process.on('uncaughtException', (error) => {
    console.error('💥 Error:', error.message);
});

console.log('📋 Server script loaded successfully');
