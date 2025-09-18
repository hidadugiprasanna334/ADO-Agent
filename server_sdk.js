const express = require('express');
const cors = require('cors');
const path = require('path');
const { AIProjectsClient } = require('@azure/ai-projects');
const { AzureKeyCredential } = require('@azure/core-auth');

const app = express();
const PORT = 3000;

// Enable CORS for all routes
app.use(cors());
app.use(express.json());

// Serve static files
app.use(express.static(path.join(__dirname)));

// Azure AI Projects configuration
const AZURE_CONFIG = {
    endpoint: "https://dev-ai-foundry-res-01.services.ai.azure.com",
    projectName: "dev-ai-foundry-res-prj-01",
    apiKey: "YOUR_AZURE_API_KEY_HERE",
    agentId: "asst_Cabj69cF5rOLCHdSovbzP1fb"
};

// Initialize Azure AI Projects client
let projectClient;
let agentsClient;

try {
    console.log('🚀 Initializing Azure AI Projects client...');
    console.log('📊 Configuration:');
    console.log('  🔗 Endpoint:', AZURE_CONFIG.endpoint);
    console.log('  📁 Project:', AZURE_CONFIG.projectName);
    console.log('  🤖 Agent ID:', AZURE_CONFIG.agentId);
    console.log('  🔑 API Key (first 10 chars):', AZURE_CONFIG.apiKey.substring(0, 10) + '...');

    // Create the credential
    const credential = new AzureKeyCredential(AZURE_CONFIG.apiKey);
    
    // Create the AI Projects client
    projectClient = new AIProjectsClient(
        AZURE_CONFIG.endpoint,
        credential,
        { projectName: AZURE_CONFIG.projectName }
    );
    
    // Get the agents client
    agentsClient = projectClient.agents;
    
    console.log('✅ Azure AI Projects client initialized successfully');
} catch (error) {
    console.error('❌ Failed to initialize Azure client:', error);
}

// API Routes using Azure SDK

// Create a new thread
app.post('/api/threads', async (req, res) => {
    try {
        console.log('🧵 Creating new thread...');
        
        const thread = await agentsClient.createThread();
        
        console.log('✅ Thread created:', thread.id);
        res.json(thread);
    } catch (error) {
        console.error('❌ Error creating thread:', error);
        res.status(500).json({ error: error.message });
    }
});

// Create a message in a thread
app.post('/api/threads/:threadId/messages', async (req, res) => {
    try {
        const { threadId } = req.params;
        const { role, content } = req.body;
        
        console.log(`📝 Creating message in thread ${threadId}:`);
        console.log(`  👤 Role: ${role}`);
        console.log(`  💬 Content: ${content}`);
        
        const message = await agentsClient.createMessage(threadId, role, content);
        
        console.log('✅ Message created:', message.id);
        res.json(message);
    } catch (error) {
        console.error('❌ Error creating message:', error);
        res.status(500).json({ error: error.message });
    }
});

// Create a run
app.post('/api/threads/:threadId/runs', async (req, res) => {
    try {
        const { threadId } = req.params;
        const { assistant_id } = req.body;
        
        console.log(`🏃 Creating run for thread ${threadId} with assistant ${assistant_id}...`);
        
        const run = await agentsClient.createRun(threadId, {
            assistantId: assistant_id
        });
        
        console.log('✅ Run created:', run.id);
        res.json(run);
    } catch (error) {
        console.error('❌ Error creating run:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get a run status
app.get('/api/threads/:threadId/runs/:runId', async (req, res) => {
    try {
        const { threadId, runId } = req.params;
        
        console.log(`🔍 Getting run ${runId} for thread ${threadId}...`);
        
        const run = await agentsClient.getRun(threadId, runId);
        
        console.log(`📊 Run status: ${run.status}`);
        res.json(run);
    } catch (error) {
        console.error('❌ Error getting run:', error);
        res.status(500).json({ error: error.message });
    }
});

// List messages in a thread
app.get('/api/threads/:threadId/messages', async (req, res) => {
    try {
        const { threadId } = req.params;
        
        console.log(`📋 Listing messages for thread ${threadId}...`);
        
        const messages = await agentsClient.listMessages(threadId);
        
        console.log(`📄 Found ${messages.data.length} messages`);
        res.json(messages);
    } catch (error) {
        console.error('❌ Error listing messages:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get assistant details
app.get('/api/assistants/:assistantId', async (req, res) => {
    try {
        const { assistantId } = req.params;
        
        console.log(`🤖 Getting assistant ${assistantId}...`);
        
        const assistant = await agentsClient.getAgent(assistantId);
        
        console.log(`✅ Assistant found: ${assistant.name}`);
        res.json(assistant);
    } catch (error) {
        console.error('❌ Error getting assistant:', error);
        res.status(500).json({ error: error.message });
    }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'healthy', 
        timestamp: new Date().toISOString(),
        azure_client: projectClient ? 'initialized' : 'not initialized'
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`\n🌟 Azure Foundry Chat Server running at http://localhost:${PORT}`);
    console.log('📊 Server Details:');
    console.log('  🤖 Agent: ADOTicketAgent');
    console.log('  🆔 Agent ID:', AZURE_CONFIG.agentId);
    console.log('  🔗 Endpoint:', AZURE_CONFIG.endpoint);
    console.log('  📁 Project:', AZURE_CONFIG.projectName);
    console.log('\n🚀 Ready to handle requests!');
});
