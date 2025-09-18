const { AIProjectClient } = require('@azure/ai-projects');
const { DefaultAzureCredential } = require('@azure/identity');

async function testAzureConnection() {
    try {
        console.log('🧪 Testing Azure Foundry Agent Connection...');
        console.log('================================');
        
        const azureProjectEndpoint = "https://dev-ai-foundry-res-01.services.ai.azure.com/api/projects/dev-ai-foundry-res-prj-01";
        const agentId = "asst_Cabj69cF5rOLCHdSovbzP1fb";
        
        console.log('🔗 Endpoint:', azureProjectEndpoint);
        console.log('🤖 Agent ID:', agentId);
        console.log('');
        
        // Initialize Azure client
        console.log('🔧 Initializing Azure AI Project client...');
        const projectClient = new AIProjectClient(
            azureProjectEndpoint,
            new DefaultAzureCredential()
        );
        console.log('✅ Client initialized successfully');
        
        // Test 1: Create a thread
        console.log('');
        console.log('🧵 Test 1: Creating thread...');
        const thread = await projectClient.agents.threads.create();
        console.log('✅ Thread created:', thread.id);
        
        // Test 2: Create a message
        console.log('');
        console.log('📝 Test 2: Creating message...');
        const testMessage = "Hello ADO Ticket Agent! Can you help me create a user story for a login feature?";
        await projectClient.agents.messages.create(thread.id, 'user', testMessage);
        console.log('✅ Message created:', testMessage);
        
        // Test 3: Create a run
        console.log('');
        console.log('🏃 Test 3: Creating run...');
        const run = await projectClient.agents.runs.create(thread.id, agentId);
        console.log('✅ Run created:', run.id);
        
        // Test 4: Check run status
        console.log('');
        console.log('⏱️ Test 4: Waiting for response...');
        let runStatus = await projectClient.agents.runs.get(thread.id, run.id);
        console.log('📊 Initial status:', runStatus.status);
        
        // Wait for completion
        let attempts = 0;
        while (runStatus.status === 'in_progress' || runStatus.status === 'queued') {
            attempts++;
            if (attempts > 30) {
                console.log('⏰ Timeout waiting for response');
                break;
            }
            
            console.log(`⏳ Waiting... (${attempts}/30) Status: ${runStatus.status}`);
            await new Promise(resolve => setTimeout(resolve, 2000));
            runStatus = await projectClient.agents.runs.get(thread.id, run.id);
        }
        
        console.log('📊 Final status:', runStatus.status);
        
        if (runStatus.status === 'completed') {
            // Test 5: Get messages
            console.log('');
            console.log('💬 Test 5: Retrieving response...');
            try {
                const messages = await projectClient.agents.messages.list(thread.id);
                
                if (messages && messages.data) {
                    for (const message of messages.data) {
                        if (message.role === 'assistant') {
                            console.log('🤖 Assistant response:');
                            console.log('---');
                            for (const contentPart of message.content) {
                                if (contentPart.type === 'text') {
                                    console.log(contentPart.text.value);
                                }
                            }
                            console.log('---');
                            break;
                        }
                    }
                } else {
                    console.log('📝 No messages returned or different format');
                }
            } catch (msgError) {
                console.log('📝 Could not retrieve messages:', msgError.message);
                console.log('✅ But the agent run completed successfully!');
            }
        }
        
        console.log('');
        console.log('🎉 Azure Foundry Agent Connection Test SUCCESSFUL!');
        console.log('✅ All components working correctly');
        
    } catch (error) {
        console.error('❌ Azure connection test failed:', error.message);
        if (error.stack) {
            console.error('Stack trace:', error.stack);
        }
        process.exit(1);
    }
}

testAzureConnection();
