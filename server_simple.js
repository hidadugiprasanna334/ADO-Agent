// Simple server to test Azure AI Projects integration
const express = require('express');
const cors = require('cors');
const path = require('path');

console.log('🚀 Starting Azure Foundry Chat Server...');

const app = express();
const PORT = 3000;

// Enable CORS for all routes
app.use(cors());
app.use(express.json());

// Serve static files
app.use(express.static(path.join(__dirname)));

// Azure configuration
const AZURE_CONFIG = {
    endpoint: "https://dev-ai-foundry-res-01.services.ai.azure.com",
    apiKey: "YOUR_AZURE_API_KEY_HERE",
    agentId: "asst_Cabj69cF5rOLCHdSovbzP1fb"
};

// Initialize Azure client
let projectClient = null;

async function initializeAzureClient() {
    try {
        console.log('📦 Loading Azure modules...');
        
        // Import the Azure modules
        const { AIProjectClient } = require('@azure/ai-projects');
        const { AzureKeyCredential } = require('@azure/core-auth');
        
        console.log('✅ Azure modules loaded successfully');
        console.log('🔧 Initializing Azure client...');
        
        // Use API key credential - this should work for Azure AI Projects
        console.log('Using AzureKeyCredential with API key');
        const credential = new AzureKeyCredential(AZURE_CONFIG.apiKey);
        
        // Set the API key as environment variable as well
        process.env.AZURE_OPENAI_API_KEY = AZURE_CONFIG.apiKey;
        
        // Create project client with proper options
        const project = new AIProjectClient(AZURE_CONFIG.endpoint, credential, {
            // Add any additional options if needed
        });
        
        // Get the Azure OpenAI client as shown in the sample
        projectClient = await project.getAzureOpenAIClient({
            apiVersion: "2024-12-01-preview"
        });
        
        console.log('✅ Azure AI Project client initialized successfully');
        return true;
        
    } catch (error) {
        console.error('❌ Failed to initialize Azure client:', error.message);
        if (error.stack) {
            console.error('Stack trace:', error.stack);
        }
        return false;
    }
}

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        azure_client: projectClient ? 'initialized' : 'not_initialized',
        timestamp: new Date().toISOString()
    });
});

// Create a new thread using Azure SDK
app.post('/api/threads', async (req, res) => {
    try {
        if (!projectClient) {
            throw new Error('Azure client not initialized');
        }
        
        console.log('🧵 Creating thread using Azure SDK...');
        const thread = await projectClient.beta.threads.create();
        
        console.log('✅ Thread created:', thread.id);
        res.json(thread);
        
    } catch (error) {
        console.error('❌ Error creating thread:', error.message);
        res.status(500).json({ error: error.message });
    }
});

// Create a message using Azure SDK
app.post('/api/threads/:threadId/messages', async (req, res) => {
    try {
        const { threadId } = req.params;
        const { role, content } = req.body;
        
        if (!projectClient) {
            throw new Error('Azure client not initialized');
        }
        
        console.log(`📝 Creating message in thread ${threadId}: ${content}`);
        
        const message = await projectClient.beta.threads.messages.create(threadId, {
            role: role,
            content: content
        });
        
        console.log('✅ Message created:', message.id);
        res.json(message);
        
    } catch (error) {
        console.error('❌ Error creating message:', error.message);
        res.status(500).json({ error: error.message });
    }
});

// Create a run using Azure SDK
app.post('/api/threads/:threadId/runs', async (req, res) => {
    try {
        const { threadId } = req.params;
        const { assistant_id } = req.body;
        
        if (!projectClient) {
            throw new Error('Azure client not initialized');
        }
        
        console.log(`🏃 Creating run with assistant ${assistant_id || AZURE_CONFIG.agentId}`);
        
        const run = await projectClient.beta.threads.runs.create(threadId, {
            assistant_id: assistant_id || AZURE_CONFIG.agentId
        });
        
        console.log('✅ Run created:', run.id);
        res.json(run);
        
    } catch (error) {
        console.error('❌ Error creating run:', error.message);
        res.status(500).json({ error: error.message });
    }
});

// Get run status using Azure SDK
app.get('/api/threads/:threadId/runs/:runId', async (req, res) => {
    try {
        const { threadId, runId } = req.params;
        
        if (!projectClient) {
            throw new Error('Azure client not initialized');
        }
        
        const run = await projectClient.beta.threads.runs.retrieve(threadId, runId);
        
        console.log(`📊 Run ${runId} status: ${run.status}`);
        res.json(run);
        
    } catch (error) {
        console.error('❌ Error getting run:', error.message);
        res.status(500).json({ error: error.message });
    }
});

// List messages using Azure SDK
app.get('/api/threads/:threadId/messages', async (req, res) => {
    try {
        const { threadId } = req.params;
        
        if (!projectClient) {
            throw new Error('Azure client not initialized');
        }
        
        const messages = await projectClient.beta.threads.messages.list(threadId);
        
        console.log(`✅ Retrieved ${messages.data?.length || 0} messages`);
        res.json(messages);
        
    } catch (error) {
        console.error('❌ Error listing messages:', error.message);
        res.status(500).json({ error: error.message });
    }
});

// Start server
async function startServer() {
    // First try to initialize Azure client
    const initialized = await initializeAzureClient();
    
    if (!initialized) {
        console.log('⚠️  Server will start but Azure features will not work');
    }
    
    app.listen(PORT, () => {
        console.log(`\n🌟 Server running at http://localhost:${PORT}`);
        console.log('💡 Azure Foundry Agent: ADOTicketAgent');
        console.log('📱 Open your browser to start chatting!');
        
        if (initialized) {
            console.log('✅ Azure SDK integration: READY');
        } else {
            console.log('❌ Azure SDK integration: FAILED');
        }
    });
}

// Handle shutdown gracefully
process.on('SIGINT', () => {
    console.log('\n👋 Shutting down server...');
    process.exit(0);
});

// Start the server
startServer();
