const express = require('express');
const cors = require('cors');
const path = require('path');
const { AIProjectClient } = require('@azure/ai-projects');
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

// Initialize Azure AI Project client
let project;
let projectClient;

async function initializeAzureClient() {
    try {
        console.log('🚀 Initializing Azure AI Project client...');
        console.log('📊 Configuration:');
        console.log('  🔗 Endpoint:', AZURE_CONFIG.endpoint);
        console.log('  📁 Project:', AZURE_CONFIG.projectName);
        console.log('  🤖 Agent ID:', AZURE_CONFIG.agentId);
        console.log('  🔑 API Key (first 10 chars):', AZURE_CONFIG.apiKey.substring(0, 10) + '...');

        // Create the credential
        const credential = new AzureKeyCredential(AZURE_CONFIG.apiKey);
        
        // Create the AI Project client using the pattern from your sample
        project = new AIProjectClient(AZURE_CONFIG.endpoint, credential);
        
        // Get the Azure OpenAI client as shown in your sample
        projectClient = await project.getAzureOpenAIClient({
            // The API version should match the version of the Azure OpenAI resource
            apiVersion: "2024-12-01-preview"
        });
        
        console.log('✅ Azure AI Project client initialized successfully');
        return true;
    } catch (error) {
        console.error('❌ Failed to initialize Azure client:', error);
        console.error('Error details:', error.stack);
        return false;
    }
}

// Health check endpoint
app.get('/api/health', async (req, res) => {
    try {
        const isInitialized = projectClient !== undefined && project !== undefined;
        res.json({
            status: 'ok',
            azure_client: isInitialized ? 'initialized' : 'not_initialized',
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({ 
            status: 'error', 
            azure_client: 'error',
            error: error.message 
        });
    }
});

// Create a new thread
app.post('/api/threads', async (req, res) => {
    try {
        console.log('🧵 Creating new thread...');
        
        if (!projectClient) {
            throw new Error('Project client not initialized');
        }
        
        // Use the beta assistants API to create a thread
        const thread = await projectClient.beta.threads.create();
        
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
        
        if (!projectClient) {
            throw new Error('Project client not initialized');
        }
        
        // Use the beta assistants API to create a message
        const message = await projectClient.beta.threads.messages.create(threadId, {
            role: role,
            content: content
        });
        
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
        
        console.log(`🏃 Creating run in thread ${threadId} with assistant ${assistant_id}`);
        
        if (!projectClient) {
            throw new Error('Project client not initialized');
        }
        
        // Use the beta assistants API to create a run
        const run = await projectClient.beta.threads.runs.create(threadId, {
            assistant_id: assistant_id || AZURE_CONFIG.agentId
        });
        
        console.log('✅ Run created:', run.id);
        res.json(run);
    } catch (error) {
        console.error('❌ Error creating run:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get a run
app.get('/api/threads/:threadId/runs/:runId', async (req, res) => {
    try {
        const { threadId, runId } = req.params;
        
        console.log(`🔍 Getting run ${runId} from thread ${threadId}`);
        
        if (!projectClient) {
            throw new Error('Project client not initialized');
        }
        
        // Use the beta assistants API to get a run
        const run = await projectClient.beta.threads.runs.retrieve(threadId, runId);
        
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
        
        console.log(`📥 Listing messages from thread ${threadId}`);
        
        if (!projectClient) {
            throw new Error('Project client not initialized');
        }
        
        // Use the beta assistants API to list messages
        const messages = await projectClient.beta.threads.messages.list(threadId);
        
        console.log(`✅ Retrieved ${messages.data?.length || 0} messages`);
        res.json(messages);
    } catch (error) {
        console.error('❌ Error listing messages:', error);
        res.status(500).json({ error: error.message });
    }
});

// Error handling middleware
app.use((error, req, res, next) => {
    console.error('❌ Unhandled error:', error);
    res.status(500).json({ error: 'Internal server error' });
});

// Start server
async function startServer() {
    console.log('🌟 Starting Azure Foundry Chat Server...');
    
    // Initialize Azure client first
    const initialized = await initializeAzureClient();
    
    if (!initialized) {
        console.error('❌ Failed to initialize Azure client. Server will start but API calls will fail.');
    }
    
    app.listen(PORT, () => {
        console.log(`🚀 Server running at http://localhost:${PORT}`);
        console.log('📱 Open your browser to start chatting!');
        console.log('💡 Azure AI Foundry Agent: ' + AZURE_CONFIG.agentId);
    });
}

// Handle process termination gracefully
process.on('SIGINT', () => {
    console.log('\n👋 Shutting down server...');
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\n👋 Shutting down server...');
    process.exit(0);
});

// Start the server
startServer().catch(error => {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
});
