// Diagnostic server to identify Azure authentication issues
const express = require('express');
const cors = require('cors');

console.log('🔍 AZURE DIAGNOSTIC SERVER');
console.log('⏰ Starting at:', new Date().toISOString());

const app = express();
app.use(cors());
app.use(express.json());

// Configuration we're trying to use
const CONFIG = {
    endpoint: "https://dev-ai-foundry-res-01.services.ai.azure.com/api/projects/dev-ai-foundry-res-prj-01",
    agentId: "asst_Cabj69cF5rOLCHdSovbzP1fb",
    apiKey: "YOUR_AZURE_API_KEY_HERE"
};

console.log('📋 Configuration Check:');
console.log('   Endpoint:', CONFIG.endpoint);
console.log('   Agent ID:', CONFIG.agentId);
console.log('   API Key (first 10):', CONFIG.apiKey.substring(0, 10) + '...');

// Test 1: Can we load the Azure modules?
console.log('\n🧪 TEST 1: Loading Azure modules...');
try {
    const { AIProjectClient } = require('@azure/ai-projects');
    const { AzureKeyCredential } = require('@azure/core-auth');
    const { DefaultAzureCredential } = require('@azure/identity');
    console.log('✅ All Azure modules loaded successfully');
} catch (error) {
    console.error('❌ Failed to load Azure modules:', error.message);
    process.exit(1);
}

// Test 2: Can we create credentials?
console.log('\n🧪 TEST 2: Creating credentials...');
try {
    const { AzureKeyCredential } = require('@azure/core-auth');
    const { DefaultAzureCredential } = require('@azure/identity');
    
    const apiKeyCredential = new AzureKeyCredential(CONFIG.apiKey);
    console.log('✅ AzureKeyCredential created');
    
    const defaultCredential = new DefaultAzureCredential();
    console.log('✅ DefaultAzureCredential created');
} catch (error) {
    console.error('❌ Failed to create credentials:', error.message);
}

// Test 3: Can we create the client (without calling it)?
console.log('\n🧪 TEST 3: Creating AIProjectClient...');
let client = null;
try {
    const { AIProjectClient } = require('@azure/ai-projects');
    const { AzureKeyCredential } = require('@azure/core-auth');
    
    client = new AIProjectClient(CONFIG.endpoint, new AzureKeyCredential(CONFIG.apiKey));
    console.log('✅ AIProjectClient created with API key');
} catch (error) {
    console.error('❌ Failed to create AIProjectClient:', error.message);
    console.error('   Error details:', {
        name: error.name,
        message: error.message,
        code: error.code
    });
}

// Health endpoint for browser testing
app.get('/api/health', (req, res) => {
    res.json({
        status: 'diagnostic_mode',
        client_created: client !== null,
        timestamp: new Date().toISOString(),
        config: {
            endpoint: CONFIG.endpoint,
            agentId: CONFIG.agentId,
            hasApiKey: !!CONFIG.apiKey
        }
    });
});

// Test endpoint
app.post('/api/test', async (req, res) => {
    if (!client) {
        return res.json({
            success: false,
            error: 'Client not initialized',
            message: 'Could not create Azure client'
        });
    }
    
    try {
        console.log('🧪 Testing actual Azure call...');
        
        // Try a simple operation
        const thread = await client.agents.threads.create();
        console.log('✅ Successfully created thread:', thread.id);
        
        res.json({
            success: true,
            message: 'Azure connection working!',
            threadId: thread.id
        });
        
    } catch (error) {
        console.error('❌ Azure call failed:', error.message);
        console.error('   Error details:', {
            name: error.name,
            message: error.message,
            code: error.code,
            status: error.status
        });
        
        res.json({
            success: false,
            error: error.message,
            errorDetails: {
                name: error.name,
                code: error.code,
                status: error.status
            }
        });
    }
});

// Start server
const PORT = 3000;
app.listen(PORT, () => {
    console.log('\n🌟 ================================');
    console.log('🌟 DIAGNOSTIC SERVER RUNNING');
    console.log('🌟 ================================');
    console.log(`🔗 URL: http://localhost:${PORT}`);
    console.log('📋 Endpoints:');
    console.log('   GET  /api/health - Check status');
    console.log('   POST /api/test   - Test Azure connection');
    console.log('\n💡 Open browser and test /api/test endpoint');
    console.log('🌟 ================================\n');
});

// Handle errors
process.on('uncaughtException', (error) => {
    console.error('💥 Uncaught Exception:', error.message);
    console.error('Stack:', error.stack);
});

process.on('unhandledRejection', (reason) => {
    console.error('💥 Unhandled Rejection:', reason);
});
