// Working chat server without Azure - for immediate testing
const express = require('express');
const cors = require('cors');
const path = require('path');

console.log('🚀 Starting Mock ADO Ticket Agent Server...');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// Mock ADO agent responses
const mockResponses = [
    "I can help you create, update, and manage Azure DevOps work items. What would you like to do?",
    "I can assist with Azure DevOps tickets, user stories, bugs, and task management. How can I help?",
    "I'm your ADO Ticket Agent. I can help you with work items, sprints, and project tracking. What do you need?",
    "I can help you manage Azure DevOps work items, create tickets, and track project progress. What's your request?",
    "I'm designed to assist with Azure DevOps operations. I can create tickets, update work items, and help with project management. How can I assist you today?"
];

// Health check
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        azure_client: 'mock_mode',
        timestamp: new Date().toISOString(),
        message: 'Running in mock mode - Azure integration being configured'
    });
});

// Chat endpoint with realistic ADO responses
app.post('/api/chat', async (req, res) => {
    try {
        const { message, conversationId } = req.body;
        
        console.log('🗨️  Chat request:', message?.substring(0, 50) + '...');
        
        // Simulate processing time
        await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
        
        let response;
        
        // Generate contextual responses based on message content
        const lowerMessage = message.toLowerCase();
        
        if (lowerMessage.includes('create') || lowerMessage.includes('new')) {
            response = `I can help you create new work items in Azure DevOps. Based on your request "${message}", I would typically create a work item with the appropriate type (user story, bug, task, etc.) and set the necessary fields like title, description, assigned user, and iteration path. Would you like me to proceed with creating this work item?`;
        } else if (lowerMessage.includes('update') || lowerMessage.includes('modify')) {
            response = `I can help you update existing work items. For your request "${message}", I would locate the specified work item and update the relevant fields such as status, description, assigned user, or any custom fields. Please provide the work item ID or title you'd like to update.`;
        } else if (lowerMessage.includes('bug') || lowerMessage.includes('issue')) {
            response = `I can help you manage bugs and issues in Azure DevOps. Regarding "${message}", I would create a bug work item with detailed reproduction steps, severity level, and assign it to the appropriate team member. I can also help track bug status and resolution progress.`;
        } else if (lowerMessage.includes('sprint') || lowerMessage.includes('iteration')) {
            response = `I can assist with sprint and iteration management. For "${message}", I can help you assign work items to sprints, check sprint capacity, monitor sprint progress, and generate sprint reports. Which specific sprint operation would you like me to help with?`;
        } else if (lowerMessage.includes('query') || lowerMessage.includes('search') || lowerMessage.includes('find')) {
            response = `I can help you query and search work items in Azure DevOps. Based on "${message}", I would construct appropriate WIQL (Work Item Query Language) queries to find work items matching your criteria such as status, assigned user, area path, tags, or any custom fields. What specific work items are you looking for?`;
        } else {
            // Use random response for general queries
            response = mockResponses[Math.floor(Math.random() * mockResponses.length)] + 
                      `\n\nRegarding your message: "${message}" - I would analyze this request and provide appropriate Azure DevOps assistance. ` +
                      `Currently running in demonstration mode while Azure integration is being configured.`;
        }
        
        console.log('📤 Sending response:', response.substring(0, 100) + '...');
        
        res.json({
            success: true,
            message: response,
            threadId: 'mock_thread_' + Date.now(),
            source: 'mock_ado_agent'
        });
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        res.status(500).json({
            success: false,
            message: 'I apologize, but I encountered an error. Please try again.',
            error: error.message
        });
    }
});

// Additional mock endpoints for compatibility
app.post('/api/threads', (req, res) => {
    res.json({ id: 'mock_thread_' + Date.now(), object: 'thread' });
});

app.post('/api/threads/:threadId/messages', (req, res) => {
    res.json({ id: 'mock_message_' + Date.now(), object: 'message' });
});

app.listen(PORT, () => {
    console.log('\n🌟 ================================');
    console.log('🌟 MOCK ADO TICKET AGENT READY');
    console.log('🌟 ================================');
    console.log(`🔗 URL: http://localhost:${PORT}`);
    console.log('🎭 Mode: Mock/Demo (Azure integration pending)');
    console.log('📱 Open browser to test the chat interface');
    console.log('💡 The agent will provide realistic ADO responses');
    console.log('🌟 ================================\n');
});
