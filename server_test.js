const express = require('express');
const cors = require('cors');
const path = require('path');

console.log('🚀 Starting Simple Test Server...');
console.log('⏰ Timestamp:', new Date().toISOString());

const app = express();
const PORT = 3000;

// Enable CORS for all routes
app.use(cors());
app.use(express.json());

// Serve static files
app.use(express.static(path.join(__dirname)));

// Add logging middleware
app.use((req, res, next) => {
    console.log(`📝 ${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    console.log('🔍 Health check requested');
    res.json({
        status: 'ok',
        message: 'Simple test server is running',
        timestamp: new Date().toISOString(),
        azure_client: 'test_mode'
    });
});

// Test chat endpoint (without Azure for now)
app.post('/api/chat', async (req, res) => {
    try {
        const { message, conversationId } = req.body;
        
        console.log('🗨️  Chat request received:');
        console.log('   Message:', message);
        console.log('   Conversation ID:', conversationId);
        
        // Simulate some processing time
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Return a mock response for testing
        const mockResponse = {
            success: true,
            message: `Hello! I received your message: "${message}". This is a test response from your ADO Ticket Agent. The server is working correctly!`,
            threadId: 'test_thread_' + Date.now()
        };
        
        console.log('📤 Sending response:', mockResponse.message.substring(0, 50) + '...');
        res.json(mockResponse);
        
    } catch (error) {
        console.error('❌ Chat error:', error.message);
        res.status(500).json({
            success: false,
            message: 'Sorry, I encountered an error processing your request.',
            error: error.message
        });
    }
});

// Test Azure endpoints (mock for now)
app.post('/api/threads', (req, res) => {
    console.log('🧵 Mock thread creation');
    res.json({ id: 'test_thread_' + Date.now(), object: 'thread' });
});

app.post('/api/threads/:threadId/messages', (req, res) => {
    console.log('📝 Mock message creation for thread:', req.params.threadId);
    res.json({ id: 'test_message_' + Date.now(), object: 'message' });
});

app.post('/api/threads/:threadId/runs', (req, res) => {
    console.log('🏃 Mock run creation for thread:', req.params.threadId);
    res.json({ id: 'test_run_' + Date.now(), status: 'completed' });
});

app.get('/api/threads/:threadId/runs/:runId', (req, res) => {
    console.log('📊 Mock run status check');
    res.json({ id: req.params.runId, status: 'completed' });
});

app.get('/api/threads/:threadId/messages', (req, res) => {
    console.log('📥 Mock message listing');
    res.json({
        data: [{
            role: 'assistant',
            content: [{ type: 'text', text: { value: 'This is a test response from the mock server!' } }]
        }]
    });
});

// Error handling middleware
app.use((error, req, res, next) => {
    console.error('❌ Unhandled error:', error);
    res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
    console.log('\n🌟 ================================');
    console.log('🌟 SIMPLE TEST SERVER RUNNING');
    console.log('🌟 ================================');
    console.log(`🔗 URL: http://localhost:${PORT}`);
    console.log('📱 Open your browser to test the interface');
    console.log('🧪 This is a test server with mock responses');
    console.log('✅ Server is ready for connections');
    console.log('⏰ Started at:', new Date().toISOString());
    console.log('🌟 ================================\n');
});

// Handle shutdown gracefully
process.on('SIGINT', () => {
    console.log('\n👋 Shutting down test server...');
    process.exit(0);
});

// Log any unhandled errors
process.on('uncaughtException', (error) => {
    console.error('💥 Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
});
