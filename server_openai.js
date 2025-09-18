// Server using Azure OpenAI SDK for assistants
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
    agentId: "asst_Cabj69cF5rOLCHdSovbzP1fb",
    apiVersion: "2024-12-01-preview"
};

// Azure OpenAI client
let openaiClient = null;

async function initializeAzureClient() {
    try {
        console.log('📦 Loading Azure OpenAI module...');
        
        // Use the Azure OpenAI SDK instead
        const { AzureOpenAI } = require('openai');
        
        console.log('✅ Azure OpenAI module loaded');
        console.log('🔧 Initializing Azure OpenAI client...');
        
        // Create Azure OpenAI client
        openaiClient = new AzureOpenAI({
            endpoint: AZURE_CONFIG.endpoint,
            apiKey: AZURE_CONFIG.apiKey,
            apiVersion: AZURE_CONFIG.apiVersion,
        });
        
        console.log('✅ Azure OpenAI client initialized successfully');
        return true;
        
    } catch (error) {
        console.error('❌ Failed to initialize Azure OpenAI client:', error.message);
        console.error('Stack trace:', error.stack);
        return false;
    }
}

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        azure_client: openaiClient ? 'initialized' : 'not_initialized',
        timestamp: new Date().toISOString()
    });
});

// Create a new thread using Azure OpenAI SDK
app.post('/api/threads', async (req, res) => {
    try {
        if (!openaiClient) {
            throw new Error('Azure OpenAI client not initialized');
        }
        
        console.log('🧵 Creating thread using Azure OpenAI SDK...');
        const thread = await openaiClient.beta.threads.create();
        
        console.log('✅ Thread created:', thread.id);
        res.json(thread);
        
    } catch (error) {
        console.error('❌ Error creating thread:', error.message);
        if (error.response) {
            console.error('Response data:', error.response.data);
        }
        res.status(500).json({ error: error.message });
    }
});

// Create a message using Azure OpenAI SDK
app.post('/api/threads/:threadId/messages', async (req, res) => {
    try {
        const { threadId } = req.params;
        const { role, content } = req.body;
        
        if (!openaiClient) {
            throw new Error('Azure OpenAI client not initialized');
        }
        
        console.log(`📝 Creating message in thread ${threadId}: ${content}`);
        
        const message = await openaiClient.beta.threads.messages.create(threadId, {
            role: role,
            content: content
        });
        
        console.log('✅ Message created:', message.id);
        res.json(message);
        
    } catch (error) {
        console.error('❌ Error creating message:', error.message);
        if (error.response) {
            console.error('Response data:', error.response.data);
        }
        res.status(500).json({ error: error.message });
    }
});

// Create a run using Azure OpenAI SDK
app.post('/api/threads/:threadId/runs', async (req, res) => {
    try {
        const { threadId } = req.params;
        const { assistant_id } = req.body;
        
        if (!openaiClient) {
            throw new Error('Azure OpenAI client not initialized');
        }
        
        console.log(`🏃 Creating run with assistant ${assistant_id || AZURE_CONFIG.agentId}`);
        
        const run = await openaiClient.beta.threads.runs.create(threadId, {
            assistant_id: assistant_id || AZURE_CONFIG.agentId
        });
        
        console.log('✅ Run created:', run.id);
        res.json(run);
        
    } catch (error) {
        console.error('❌ Error creating run:', error.message);
        if (error.response) {
            console.error('Response data:', error.response.data);
        }
        res.status(500).json({ error: error.message });
    }
});

// Get run status using Azure OpenAI SDK
app.get('/api/threads/:threadId/runs/:runId', async (req, res) => {
    try {
        const { threadId, runId } = req.params;
        
        if (!openaiClient) {
            throw new Error('Azure OpenAI client not initialized');
        }
        
        const run = await openaiClient.beta.threads.runs.retrieve(threadId, runId);
        
        console.log(`📊 Run ${runId} status: ${run.status}`);
        res.json(run);
        
    } catch (error) {
        console.error('❌ Error getting run:', error.message);
        if (error.response) {
            console.error('Response data:', error.response.data);
        }
        res.status(500).json({ error: error.message });
    }
});

// List messages using Azure OpenAI SDK
app.get('/api/threads/:threadId/messages', async (req, res) => {
    try {
        const { threadId } = req.params;
        
        if (!openaiClient) {
            throw new Error('Azure OpenAI client not initialized');
        }
        
        const messages = await openaiClient.beta.threads.messages.list(threadId);
        
        console.log(`✅ Retrieved ${messages.data?.length || 0} messages`);
        res.json(messages);
        
    } catch (error) {
        console.error('❌ Error listing messages:', error.message);
        if (error.response) {
            console.error('Response data:', error.response.data);
        }
        res.status(500).json({ error: error.message });
    }
});

// Start server
async function startServer() {
    // Initialize Azure OpenAI client
    const initialized = await initializeAzureClient();
    
    if (!initialized) {
        console.log('⚠️  Server will start but Azure features will not work');
    }
    
    app.listen(PORT, () => {
        console.log(`\n🌟 Server running at http://localhost:${PORT}`);
        console.log('💡 Azure Foundry Agent: ADOTicketAgent');
        console.log('📱 Open your browser to start chatting!');
        
        if (initialized) {
            console.log('✅ Azure OpenAI SDK integration: READY');
        } else {
            console.log('❌ Azure OpenAI SDK integration: FAILED');
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
