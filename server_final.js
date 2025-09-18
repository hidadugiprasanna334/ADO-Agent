const express = require('express');
const cors = require('cors');
const path = require('path');

console.log('🚀 Starting Azure Chat Server with Enhanced Auth...');
console.log('⏰ Timestamp:', new Date().toISOString());

const app = express();
const PORT = 3000;

// Enable CORS and JSON parsing
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// Azure configuration - EXACT SAME PATTERN AS WORKING CARDIAC AGENT
const AZURE_CONFIG = {
    azureProjectEndpoint: process.env.AZURE_AI_FOUNDRY_PROJECT_ENDPOINT || 
        "https://dev-ai-foundry-res-01.services.ai.azure.com/api/projects/dev-ai-foundry-res-prj-01",
    agentId: process.env.AZURE_AI_ORCHESTRATION_AGENT_ID || 
        "asst_Cabj69cF5rOLCHdSovbzP1fb"
};

// Client state
let projectClient = null;
let azureReady = false;
let initError = null;

// Logging middleware
app.use((req, res, next) => {
    console.log(`📝 ${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

// Initialize Azure - EXACT SAME PATTERN AS WORKING CARDIAC AGENT
async function initializeAzure() {
    try {
        console.log('🔍 ENVIRONMENT VARIABLE DEBUG:');
        console.log('   AZURE_AI_FOUNDRY_PROJECT_ENDPOINT:', process.env.AZURE_AI_FOUNDRY_PROJECT_ENDPOINT || 'NOT SET (using default)');
        console.log('   AZURE_AI_ORCHESTRATION_AGENT_ID:', process.env.AZURE_AI_ORCHESTRATION_AGENT_ID || 'NOT SET (using default)');
        console.log('   AZURE_TENANT_ID:', process.env.AZURE_TENANT_ID || 'NOT SET');
        console.log('   AZURE_CLIENT_ID:', process.env.AZURE_CLIENT_ID || 'NOT SET');
        
        console.log('📦 Loading Azure modules...');
        const { AIProjectClient } = require('@azure/ai-projects');
        const { DefaultAzureCredential } = require('@azure/identity');
        
        console.log('✅ Modules loaded');
        console.log('🔗 Endpoint:', AZURE_CONFIG.azureProjectEndpoint);
        console.log('🤖 Agent ID:', AZURE_CONFIG.agentId);
        
        // Initialize Azure AI Projects client - EXACT SAME AS WORKING CARDIAC AGENT
        console.log('🔧 Creating AIProjectClient...');
        projectClient = new AIProjectClient(
            AZURE_CONFIG.azureProjectEndpoint,
            new DefaultAzureCredential()
        );
        
        console.log('✅ AIProjectClient created successfully');
        azureReady = true;
        return true;
        
    } catch (error) {
        console.error('❌ Azure initialization failed:', error.message);
        
        // Detailed error analysis
        if (error.message.includes('tenant')) {
            console.error('🏢 TENANT MISMATCH DETECTED');
            console.error('💡 Your Azure AI Foundry resource might be in a different tenant');
            console.error('💡 Try: az logout && az login --tenant <correct-tenant-id>');
        }
        
        initError = error.message;
        azureReady = false;
        return false;
    }
}

// Health endpoint
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        azure_client: azureReady ? 'initialized' : 'not_initialized',
        error: initError,
        timestamp: new Date().toISOString()
    });
});

// Chat endpoint using EXACT WORKING PATTERN
app.post('/api/chat', async (req, res) => {
    try {
        const { message, conversationId } = req.body;
        
        console.log('🗨️  Chat request:', message?.substring(0, 50) + '...');
        
        if (!azureReady || !projectClient) {
            console.log('⚠️  Azure not ready, using fallback');
            return res.json({
                success: true,
                message: `Hello! I received: "${message}". I'm your ADO Ticket Agent. Currently running in test mode - Azure authentication is being configured.`,
                source: 'fallback'
            });
        }
        
        // EXACT SAME WORKING METHOD AS CARDIAC AGENT
        console.log(`📤 AZURE AI FOUNDRY AGENT CALL TO ${AZURE_CONFIG.agentId}`);
        
        // Create thread - EXACT SAME AS WORKING CODE
        const thread = await projectClient.agents.threads.create();
        const threadId = thread.id;
        console.log('🧵 Created thread:', threadId);
        
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
            console.log('🤖 ===================== AZURE AI FOUNDRY AGENT RESPONSES =====================');
            //print complete message object
            if (messages.data) {
                messages.data.forEach((msg, index) => {
                    if (msg.role === 'assistant') {
                        console.log(`\n📝 MESSAGE ${index + 1}:`);
                        console.log(`   Role: ${msg.role}`);
                        console.log(`   ID: ${msg.id}`);
                        console.log(`   Created: ${msg.created_at}`);
                        console.log(`   Content:`);
                        if (msg.content) {
                            msg.content.forEach((content, contentIndex) => {
                                console.log(`     Content ${contentIndex + 1}:`);
                                console.log(`       Type: ${content.type}`);
                                if (content.text && content.text.value) {
                                    console.log(`       Full Text Value:`);
                                    console.log('       =====================================');
                                    console.log(content.text.value);
                                    console.log('       =====================================');
                                }
                            });
                        }
                        console.log('   -----------------------------------');
                    }
                });
            }
            console.log('🤖 ===================================================================\n');

            // Handle PagedAsyncIterableIterator - EXACT SAME AS WORKING CODE
            for await (const agentMessage of messages) {
                if (agentMessage.role === 'assistant') {
                    if (agentMessage.content && agentMessage.content.length > 0) {
                        const responseContent = agentMessage.content[0];
                        if (responseContent.type === 'text') {
                            // Extract text content - EXACT SAME AS WORKING CODE
                            const responseText = responseContent.text?.value || responseContent.text || responseContent.content || 'No text content';
                            console.log('📥 ADO agent response via Azure AI Foundry:', String(responseText).substring(0, 100) + '...');
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
        
        console.log(`❌ Azure AI Foundry ADO agent failed. Status: ${runStatus.status}`);
        return res.json({
            success: false,
            message: 'Sorry, I cannot process your request at this moment. Please try again.',
            error: `Agent failed: ${runStatus.status}`
        });
        
    } catch (error) {
        console.error('❌ Chat error:', error.message);
        return res.json({
            success: true,
            message: `I encountered an issue, but I'm still here to help! You said: "${req.body.message}". This is a fallback response while I resolve the connection.`,
            source: 'error_fallback'
        });
    }
});

// Global error handlers
process.on('uncaughtException', (error) => {
    console.error('💥 Uncaught Exception:', error.message);
});

process.on('unhandledRejection', (reason) => {
    console.error('💥 Unhandled Rejection:', reason);
});

// Start server
async function startServer() {
    console.log('🌟 STARTING SERVER...');
    
    // Try Azure initialization (non-blocking)
    console.log('🔧 Attempting Azure initialization...');
    const azureOK = await initializeAzure();
    
    // Start server regardless
    app.listen(PORT, () => {
        console.log('\n🌟 ================================');
        console.log('🌟 SERVER IS RUNNING');
        console.log('🌟 ================================');
        console.log(`🔗 URL: http://localhost:${PORT}`);
        console.log(`🎯 Azure Status: ${azureOK ? '✅ READY' : '⚠️  FALLBACK MODE'}`);
        console.log('📱 Open browser to test');
        console.log('🌟 ================================\n');
    });
}

startServer();
