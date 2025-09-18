const express = require('express');
const cors = require('cors');
const path = require('path');

console.log('🚀 Starting Azure Chat Server with API Key Auth...');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// Azure configuration with API key fallback
const AZURE_CONFIG = {
    azureProjectEndpoint: "https://dev-ai-foundry-res-01.services.ai.azure.com/api/projects/dev-ai-foundry-res-prj-01",
    agentId: "asst_Cabj69cF5rOLCHdSovbzP1fb",
    apiKey: "YOUR_AZURE_API_KEY_HERE"
};

let projectClient = null;
let isReady = false;

// Logging
app.use((req, res, next) => {
    console.log(`📝 ${req.method} ${req.path}`);
    next();
});

// Try API Key authentication first
async function initWithApiKey() {
    try {
        console.log('🔑 Trying API Key authentication...');
        const { AIProjectClient } = require('@azure/ai-projects');
        const { AzureKeyCredential } = require('@azure/core-auth');
        
        projectClient = new AIProjectClient(
            AZURE_CONFIG.azureProjectEndpoint,
            new AzureKeyCredential(AZURE_CONFIG.apiKey)
        );
        
        console.log('✅ API Key authentication successful');
        isReady = true;
        return true;
    } catch (error) {
        console.error('❌ API Key auth failed:', error.message);
        return false;
    }
}

// Try DefaultAzureCredential as backup
async function initWithDefaultCredential() {
    try {
        console.log('🔐 Trying DefaultAzureCredential...');
        const { AIProjectClient } = require('@azure/ai-projects');
        const { DefaultAzureCredential } = require('@azure/identity');
        
        projectClient = new AIProjectClient(
            AZURE_CONFIG.azureProjectEndpoint,
            new DefaultAzureCredential()
        );
        
        console.log('✅ DefaultAzureCredential successful');
        isReady = true;
        return true;
    } catch (error) {
        console.error('❌ DefaultAzureCredential failed:', error.message);
        return false;
    }
}

// Health check
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        azure_client: isReady ? 'initialized' : 'not_initialized',
        timestamp: new Date().toISOString()
    });
});

// Simple chat endpoint
app.post('/api/chat', async (req, res) => {
    const { message } = req.body;
    
    if (!isReady) {
        return res.json({
            success: true,
            message: `Hello! I received: "${message}". I'm your ADO Ticket Agent in test mode. Azure authentication is being configured.`,
            source: 'fallback'
        });
    }
    
    try {
        console.log('🗨️  Processing:', message?.substring(0, 30) + '...');
        
        // Use exact working pattern
        const thread = await projectClient.agents.threads.create();
        await projectClient.agents.messages.create(thread.id, 'user', message);
        const run = await projectClient.agents.runs.create(thread.id, AZURE_CONFIG.agentId);
        
        // Simple polling
        let attempts = 0;
        let runStatus = await projectClient.agents.runs.get(thread.id, run.id);
        
        while ((runStatus.status === 'in_progress' || runStatus.status === 'queued') && attempts < 20) {
            await new Promise(r => setTimeout(r, 1000));
            runStatus = await projectClient.agents.runs.get(thread.id, run.id);
            attempts++;
            console.log(`⏳ Status: ${runStatus.status} (${attempts}/20)`);
        }
        
        if (runStatus.status === 'completed') {
            const messages = await projectClient.agents.messages.list(thread.id);
            
            for await (const msg of messages) {
                if (msg.role === 'assistant' && msg.content?.length > 0) {
                    const content = msg.content[0];
                    if (content.type === 'text') {
                        const responseText = content.text?.value || content.text || 'No response';
                        console.log('✅ Got response');
                        return res.json({
                            success: true,
                            message: String(responseText),
                            source: 'azure'
                        });
                    }
                }
            }
        }
        
        return res.json({
            success: false,
            message: 'Agent did not complete successfully. Please try again.',
            error: `Status: ${runStatus.status}`
        });
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        return res.json({
            success: true,
            message: `I'm having trouble connecting to Azure, but I received your message: "${message}". Please try again in a moment.`,
            source: 'error_fallback'
        });
    }
});

// Start server
async function start() {
    console.log('🔧 Initializing authentication...');
    
    // Try API Key first, then DefaultAzureCredential
    const apiKeySuccess = await initWithApiKey();
    if (!apiKeySuccess) {
        console.log('🔄 API Key failed, trying DefaultAzureCredential...');
        await initWithDefaultCredential();
    }
    
    app.listen(PORT, () => {
        console.log('\n🌟 SERVER RUNNING');
        console.log(`🔗 http://localhost:${PORT}`);
        console.log(`🎯 Auth Status: ${isReady ? '✅ READY' : '⚠️  FALLBACK'}`);
        console.log('📱 Open browser to test\n');
    });
}

start();
