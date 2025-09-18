const express = require('express');
const cors = require('cors');
const path = require('path');

console.log('🚀 Starting Robust Azure Chat Server...');
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

// Azure configuration
const AZURE_CONFIG = {
    azureProjectEndpoint: "https://dev-ai-foundry-res-01.services.ai.azure.com/api/projects/dev-ai-foundry-res-prj-01",
    agentId: "asst_Cabj69cF5rOLCHdSovbzP1fb"
};

// Azure client state
let projectClient = null;
let azureInitialized = false;
let azureError = null;

// Safe Azure client initialization with proper error handling - EXACT WORKING PATTERN
async function initializeAzureClient() {
    try {
        console.log('📦 Attempting to load Azure modules...');
        
        // Try to load Azure modules - EXACT SAME AS CARDIAC AGENT
        const { AIProjectClient } = require('@azure/ai-projects');
        const { DefaultAzureCredential } = require('@azure/identity');
        
        console.log('✅ Azure modules loaded successfully');
        
        // Debug environment variables like cardiac agent
        console.log('� ENVIRONMENT VARIABLE DEBUG:');
        console.log('   AZURE_CLIENT_ID:', process.env.AZURE_CLIENT_ID || 'NOT SET');
        console.log('   AZURE_CLIENT_SECRET:', process.env.AZURE_CLIENT_SECRET ? 'SET' : 'NOT SET');
        console.log('   AZURE_TENANT_ID:', process.env.AZURE_TENANT_ID || 'NOT SET');
        console.log('   Your Azure CLI Tenant ID: 7f2fd8be-bc72-440a-afa0-72751a6f4c97');
        
        console.log('�🔧 Initializing Azure client...');
        console.log('🔗 Azure Project Endpoint:', AZURE_CONFIG.azureProjectEndpoint);
        console.log('🤖 Agent ID:', AZURE_CONFIG.agentId);
        
        // Set environment variables to match your Azure CLI session
        if (!process.env.AZURE_TENANT_ID) {
            process.env.AZURE_TENANT_ID = '7f2fd8be-bc72-440a-afa0-72751a6f4c97';
            console.log('🔧 Set AZURE_TENANT_ID to match your CLI session');
        }
        
        // Try different credential approaches
        let credential;
        let credentialType = 'unknown';
        
        try {
            // First try: DefaultAzureCredential with tenant ID
            credential = new DefaultAzureCredential({
                tenantId: '7f2fd8be-bc72-440a-afa0-72751a6f4c97'
            });
            credentialType = 'DefaultAzureCredential with tenant';
            console.log('🔑 Using DefaultAzureCredential with explicit tenant');
        } catch (credError) {
            console.log('⚠️  Tenant-specific credential failed, trying default...');
            credential = new DefaultAzureCredential();
            credentialType = 'DefaultAzureCredential default';
        }
        
        // Initialize with timeout to prevent hanging - EXACT SAME PATTERN AS CARDIAC AGENT
        const initPromise = new Promise(async (resolve, reject) => {
            try {
                // EXACT SAME INITIALIZATION AS WORKING CARDIAC AGENT
                projectClient = new AIProjectClient(
                    AZURE_CONFIG.azureProjectEndpoint,
                    credential
                );
                
                console.log('✅ Azure AI Projects client created');
                console.log('🔑 Credential type:', credentialType);
                resolve(true);
            } catch (error) {
                console.error('❌ AIProjectClient creation failed:', error.message);
                reject(error);
            }
        });
        
        // Add timeout to prevent hanging
        const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Azure initialization timeout after 15 seconds')), 15000);
        });
        
        await Promise.race([initPromise, timeoutPromise]);
        
        console.log('✅ Azure AI Project client initialized successfully');
        console.log('🎯 Using the exact same working pattern as cardiac agent');
        azureInitialized = true;
        return true;
        
    } catch (error) {
        console.error('❌ Failed to initialize Azure client:', error.message);
        console.error('🔍 Error details:', {
            name: error.name,
            message: error.message,
            code: error.code
        });
        
        // Check for specific error types
        if (error.message.includes('tenant')) {
            console.error('🏢 TENANT ISSUE: The resource might be in a different tenant');
            console.error('💡 Try: az login --tenant <resource-tenant-id>');
        }
        if (error.message.includes('401') || error.message.includes('Unauthorized')) {
            console.error('🔐 AUTH ISSUE: Check your permissions for the AI Foundry resource');
        }
        if (error.message.includes('404') || error.message.includes('Not Found')) {
            console.error('🔍 RESOURCE ISSUE: Check the endpoint URL and project name');
        }
        
        azureError = error.message;
        azureInitialized = false;
        
        // Don't crash the server - continue in fallback mode
        console.log('⚠️  Server will continue in fallback mode with mock responses');
        return false;
    }
}

// Health check endpoint
app.get('/api/health', (req, res) => {
    console.log('🔍 Health check requested');
    res.json({
        status: 'ok',
        azure_client: azureInitialized ? 'initialized' : 'not_initialized',
        azure_error: azureError,
        timestamp: new Date().toISOString(),
        mode: azureInitialized ? 'azure' : 'fallback'
    });
});

// Robust chat endpoint that works with or without Azure
app.post('/api/chat', async (req, res) => {
    try {
        const { message, conversationId } = req.body;
        
        console.log('🗨️  Chat request received:');
        console.log('   Message:', message);
        console.log('   Conversation ID:', conversationId);
        console.log('   Azure Status:', azureInitialized ? 'Available' : 'Fallback Mode');
        
        if (azureInitialized && projectClient) {
            // Try Azure first
            try {
                console.log('🎯 Attempting Azure AI response...');
                
                // Create thread
                const thread = await projectClient.agents.threads.create();
                const threadId = thread.id;
                console.log('🧵 Created thread:', threadId);
                
                // Add message
                await projectClient.agents.messages.create(threadId, 'user', message);
                console.log('📝 Message added to thread');
                
                // Create run
                const run = await projectClient.agents.runs.create(threadId, AZURE_CONFIG.agentId);
                console.log('🏃 Started run:', run.id);
                
                // Wait for completion with shorter timeout
                let runStatus = await projectClient.agents.runs.get(threadId, run.id);
                let attempts = 0;
                const maxAttempts = 15; // Reduced from 30
                
                while (runStatus.status === 'in_progress' || runStatus.status === 'queued') {
                    if (attempts >= maxAttempts) {
                        console.log('⏰ Azure run timeout - falling back to mock response');
                        break;
                    }
                    
                    await new Promise(resolve => setTimeout(resolve, 1000));
                    runStatus = await projectClient.agents.runs.get(threadId, run.id);
                    attempts++;
                    console.log(`⏳ Run status: ${runStatus.status} (${attempts}/${maxAttempts})`);
                }
                
                if (runStatus.status === 'completed') {
                    // Get response
                    const messages = await projectClient.agents.messages.list(threadId);
                    
                    for await (const agentMessage of messages) {
                        if (agentMessage.role === 'assistant') {
                            if (agentMessage.content && agentMessage.content.length > 0) {
                                const responseContent = agentMessage.content[0];
                                if (responseContent.type === 'text') {
                                    const responseText = responseContent.text?.value || responseContent.text || 'No text content';
                                    console.log('📥 Azure response received:', String(responseText).substring(0, 100) + '...');
                                    return res.json({
                                        success: true,
                                        message: String(responseText),
                                        threadId: threadId,
                                        source: 'azure'
                                    });
                                }
                            }
                        }
                    }
                }
                
                // If we get here, Azure didn't work - fall through to mock
                console.log('⚠️  Azure response incomplete - using fallback');
                
            } catch (azureError) {
                console.error('❌ Azure error:', azureError.message);
                console.log('⚠️  Falling back to mock response');
            }
        }
        
        // Fallback mock response
        console.log('🎭 Generating mock response...');
        await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate processing
        
        const mockResponses = [
            `Hello! I received your message: "${message}". I'm your ADO Ticket Agent running in fallback mode. Azure connection is currently unavailable, but I'm still here to help!`,
            `I understand you're asking about: "${message}". While I'm currently running in test mode, I would normally help you with Azure DevOps tickets, work items, and project management tasks.`,
            `Thank you for your message: "${message}". I'm designed to assist with ADO (Azure DevOps) tasks. Currently running in fallback mode - the full Azure integration will provide more detailed responses.`
        ];
        
        const response = mockResponses[Math.floor(Math.random() * mockResponses.length)];
        
        console.log('📤 Sending fallback response:', response.substring(0, 50) + '...');
        res.json({
            success: true,
            message: response,
            threadId: 'fallback_thread_' + Date.now(),
            source: 'fallback'
        });
        
    } catch (error) {
        console.error('❌ Chat error:', error.message);
        res.status(500).json({
            success: false,
            message: 'I apologize, but I encountered an error processing your request. Please try again.',
            error: error.message,
            source: 'error'
        });
    }
});

// Mock endpoints for backward compatibility
app.post('/api/threads', (req, res) => {
    console.log('🧵 Mock thread creation');
    res.json({ id: 'mock_thread_' + Date.now(), object: 'thread' });
});

app.post('/api/threads/:threadId/messages', (req, res) => {
    console.log('📝 Mock message creation for thread:', req.params.threadId);
    res.json({ id: 'mock_message_' + Date.now(), object: 'message' });
});

app.post('/api/threads/:threadId/runs', (req, res) => {
    console.log('🏃 Mock run creation for thread:', req.params.threadId);
    res.json({ id: 'mock_run_' + Date.now(), status: 'completed' });
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
            content: [{ type: 'text', text: { value: 'This is a mock response - Azure integration is being initialized.' } }]
        }]
    });
});

// Global error handlers to prevent crashes
process.on('uncaughtException', (error) => {
    console.error('💥 Uncaught Exception:', error.message);
    console.error('Stack:', error.stack);
    console.log('⚠️  Continuing server operation...');
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('💥 Unhandled Rejection at:', promise);
    console.error('Reason:', reason);
    console.log('⚠️  Continuing server operation...');
});

// Error handling middleware
app.use((error, req, res, next) => {
    console.error('❌ Express error:', error.message);
    res.status(500).json({ 
        error: 'Internal server error',
        message: 'The server encountered an error but is still running.'
    });
});

// Start server function
async function startServer() {
    console.log('🌟 ================================');
    console.log('🌟 STARTING ROBUST CHAT SERVER');
    console.log('🌟 ================================');
    
    // Try to initialize Azure (but don't fail if it doesn't work)
    console.log('🔧 Attempting Azure initialization...');
    const azureSuccess = await initializeAzureClient();
    
    if (azureSuccess) {
        console.log('✅ Azure AI Projects integration: READY');
    } else {
        console.log('⚠️  Azure AI Projects integration: FALLBACK MODE');
        console.log('💡 Server will use mock responses until Azure is configured');
    }
    
    // Start the server regardless of Azure status
    app.listen(PORT, () => {
        console.log('\n🌟 ================================');
        console.log('🌟 SERVER RUNNING SUCCESSFULLY');
        console.log('🌟 ================================');
        console.log(`🔗 URL: http://localhost:${PORT}`);
        console.log('📱 Open your browser to start chatting');
        console.log(`🎯 Mode: ${azureInitialized ? 'Azure + Fallback' : 'Fallback Only'}`);
        console.log('✅ Server is ready for connections');
        console.log('⏰ Started at:', new Date().toISOString());
        console.log('🌟 ================================\n');
    });
}

// Handle shutdown gracefully
process.on('SIGINT', () => {
    console.log('\n👋 Shutting down server gracefully...');
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\n👋 Shutting down server gracefully...');
    process.exit(0);
});

// Start the server
startServer().catch(error => {
    console.error('💥 Failed to start server:', error);
    console.log('🔄 Attempting to start in fallback mode...');
    
    // Even if startup fails, try to start basic server
    app.listen(PORT, () => {
        console.log(`🚨 Emergency server started at http://localhost:${PORT}`);
    });
});
