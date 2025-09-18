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

// Azure configuration - using the exact pattern from your working cardiac agent
const AZURE_CONFIG = {
    // Use the direct Azure AI Foundry project endpoint format
    azureProjectEndpoint: "https://dev-ai-foundry-res-01.services.ai.azure.com/api/projects/dev-ai-foundry-res-prj-01",
    agentId: "asst_Cabj69cF5rOLCHdSovbzP1fb"
};

// Initialize Azure client using the exact working pattern
let projectClient = null;

async function initializeAzureClient() {
    try {
        console.log('📦 Loading Azure modules...');
        
        // Import modules using the exact same pattern
        const { AIProjectClient } = require('@azure/ai-projects');
        const { DefaultAzureCredential } = require('@azure/identity');
        
        console.log('✅ Azure modules loaded successfully');
        console.log('🔧 Initializing Azure client...');
        console.log('🔗 Azure Project Endpoint:', AZURE_CONFIG.azureProjectEndpoint);
        console.log('🤖 Agent ID:', AZURE_CONFIG.agentId);
        
        // Initialize Azure AI Projects client - EXACT SAME AS WORKING CARDIAC AGENT
        projectClient = new AIProjectClient(
            AZURE_CONFIG.azureProjectEndpoint,
            new DefaultAzureCredential()
        );
        
        console.log('✅ Azure AI Project client initialized successfully');
        console.log('🎯 Using the exact same working pattern as cardiac agent');
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
        timestamp: new Date().toISOString(),
        pattern: 'cardiac_agent_working_pattern'
    });
});

// Create a new thread using the EXACT WORKING PATTERN
app.post('/api/threads', async (req, res) => {
    try {
        if (!projectClient) {
            throw new Error('Azure client not initialized');
        }
        
        console.log('🧵 Creating thread using EXACT working pattern...');
        
        // EXACT SAME AS WORKING CARDIAC AGENT CODE
        const thread = await projectClient.agents.threads.create();
        
        console.log('✅ Thread created:', thread.id);
        res.json(thread);
        
    } catch (error) {
        console.error('❌ Error creating thread:', error.message);
        res.status(500).json({ error: error.message });
    }
});

// Create a message using the EXACT WORKING PATTERN  
app.post('/api/threads/:threadId/messages', async (req, res) => {
    try {
        const { threadId } = req.params;
        const { role, content } = req.body;
        
        if (!projectClient) {
            throw new Error('Azure client not initialized');
        }
        
        console.log(`📝 Creating message in thread ${threadId}: ${content}`);
        
        // EXACT SAME AS WORKING CARDIAC AGENT CODE - 3 parameters: threadId, role, content
        await projectClient.agents.messages.create(threadId, role, content);
        
        console.log('✅ Message created successfully');
        res.json({ success: true, threadId, role, content });
        
    } catch (error) {
        console.error('❌ Error creating message:', error.message);
        res.status(500).json({ error: error.message });
    }
});

// Create a run using the EXACT WORKING PATTERN
app.post('/api/threads/:threadId/runs', async (req, res) => {
    try {
        const { threadId } = req.params;
        const { assistant_id } = req.body;
        
        if (!projectClient) {
            throw new Error('Azure client not initialized');
        }
        
        const agentId = assistant_id || AZURE_CONFIG.agentId;
        console.log(`🏃 Creating run with agent ${agentId}`);
        
        // EXACT SAME AS WORKING CARDIAC AGENT CODE - 2 parameters: threadId, agentId
        const run = await projectClient.agents.runs.create(threadId, agentId);
        
        console.log('✅ Run created:', run.id);
        res.json(run);
        
    } catch (error) {
        console.error('❌ Error creating run:', error.message);
        res.status(500).json({ error: error.message });
    }
});

// Get run status using the EXACT WORKING PATTERN
app.get('/api/threads/:threadId/runs/:runId', async (req, res) => {
    try {
        const { threadId, runId } = req.params;
        
        if (!projectClient) {
            throw new Error('Azure client not initialized');
        }
        
        // EXACT SAME AS WORKING CARDIAC AGENT CODE
        const runStatus = await projectClient.agents.runs.get(threadId, runId);
        
        console.log(`📊 Run ${runId} status: ${runStatus.status}`);
        res.json(runStatus);
        
    } catch (error) {
        console.error('❌ Error getting run:', error.message);
        res.status(500).json({ error: error.message });
    }
});

// List messages using the EXACT WORKING PATTERN
app.get('/api/threads/:threadId/messages', async (req, res) => {
    try {
        const { threadId } = req.params;
        
        if (!projectClient) {
            throw new Error('Azure client not initialized');
        }
        
        console.log(`📥 Listing messages from thread ${threadId}`);
        
        // EXACT SAME AS WORKING CARDIAC AGENT CODE
        const messages = await projectClient.agents.messages.list(threadId);
        
        // Convert PagedAsyncIterableIterator to array - EXACT SAME PATTERN
        const messageArray = [];
        for await (const message of messages) {
            messageArray.push(message);
        }
        
        console.log(`✅ Retrieved ${messageArray.length} messages`);
        
        // Return in the expected format
        res.json({
            data: messageArray,
            object: 'list'
        });
        
    } catch (error) {
        console.error('❌ Error listing messages:', error.message);
        res.status(500).json({ error: error.message });
    }
});

// Complete message flow endpoint - matches the working cardiac agent pattern
app.post('/api/chat', async (req, res) => {
    try {
        const { message, conversationId } = req.body;
        
        if (!projectClient || !message) {
            throw new Error('Invalid request - missing client or message');
        }
        
        console.log('🚀 Processing chat request via ADO Ticket Agent');
        console.log('📋 Request Details:', {
            messageLength: message.length,
            conversationId: conversationId || 'new',
            timestamp: new Date().toISOString()
        });
        
        // Create new thread for this conversation
        const thread = await projectClient.agents.threads.create();
        const threadId = thread.id;
        console.log('🧵 Created new thread:', threadId);
        
        // Add message using working API (3 parameters: threadId, role, content)
        await projectClient.agents.messages.create(threadId, 'user', message);
        console.log('📝 Message added to Azure AI Foundry agent thread');
        
        // Start run using working API (2 parameters: threadId, agentId)
        const run = await projectClient.agents.runs.create(threadId, AZURE_CONFIG.agentId);
        console.log('🏃 Started Azure AI Foundry agent run:', run.id);
        
        // Wait for completion with timeout - EXACT SAME AS WORKING CODE
        let runStatus = await projectClient.agents.runs.get(threadId, run.id);
        let attempts = 0;
        const maxAttempts = 30;
        
        while (runStatus.status === 'in_progress' || runStatus.status === 'queued') {
            if (attempts >= maxAttempts) {
                console.log('⏰ Azure AI Foundry agent run timeout after 30 attempts');
                return res.json({
                    success: false,
                    message: 'I apologize, but my response is taking longer than expected. Please try again.',
                    error: 'Agent response timeout'
                });
            }
            
            await new Promise(resolve => setTimeout(resolve, 1000));
            runStatus = await projectClient.agents.runs.get(threadId, run.id);
            attempts++;
            console.log(`⏳ Azure AI Foundry agent run status: ${runStatus.status} (attempt ${attempts}/${maxAttempts})`);
        }
        
        if (runStatus.status === 'completed') {
            // Get the Azure AI Foundry agent's response - EXACT SAME AS WORKING CODE
            const messages = await projectClient.agents.messages.list(threadId);
            
            // Handle PagedAsyncIterableIterator - EXACT SAME AS WORKING CODE
            for await (const agentMessage of messages) {
                if (agentMessage.role === 'assistant') {
                    if (agentMessage.content && agentMessage.content.length > 0) {
                        const responseContent = agentMessage.content[0];
                        if (responseContent.type === 'text') {
                            // Extract text content (handle different possible structures) - EXACT SAME AS WORKING CODE
                            const responseText = responseContent.text?.value || responseContent.text || responseContent.content || 'No text content';
                            console.log('📥 ADO Ticket agent response via Azure AI Foundry:', String(responseText).substring(0, 100) + '...');
                            return res.json({
                                success: true,
                                message: String(responseText),
                                threadId: threadId
                            });
                        }
                    }
                }
            }
        }
        
        console.log(`❌ Azure AI Foundry ADO ticket agent failed. Status: ${runStatus.status}`);
        res.json({
            success: false,
            message: 'Sorry, I cannot process your request at this moment. Please try again.',
            error: `Agent failed: ${runStatus.status}`
        });
        
    } catch (error) {
        console.error('❌ Chat error:', error.message);
        res.status(500).json({
            success: false,
            message: 'I apologize, but I\'m experiencing technical difficulties. Please try again.',
            error: error.message
        });
    }
});

// Start server
async function startServer() {
    // Initialize Azure client first
    const initialized = await initializeAzureClient();
    
    if (!initialized) {
        console.log('⚠️  Server will start but Azure features will not work');
    }
    
    app.listen(PORT, () => {
        console.log(`\n🌟 Server running at http://localhost:${PORT}`);
        console.log('💡 Azure Foundry Agent: ADOTicketAgent');
        console.log('📱 Open your browser to start chatting!');
        console.log('🎯 Using EXACT working pattern from cardiac agent');
        
        if (initialized) {
            console.log('✅ Azure AI Projects SDK integration: READY');
        } else {
            console.log('❌ Azure AI Projects SDK integration: FAILED');
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
