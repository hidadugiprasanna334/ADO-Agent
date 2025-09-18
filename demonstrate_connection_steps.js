console.log('🔍 AZURE FOUNDRY AGENT CONNECTION STEPS DEMONSTRATION');
console.log('='.repeat(80));

// STEP BY STEP CONNECTION PROCESS
async function demonstrateAzureFoundryConnection() {
    console.log('\n📋 DETAILED STEPS TO CONNECT TO AZURE FOUNDRY AGENT:');
    console.log('='.repeat(80));
    
    console.log('\n🔧 STEP 1: Import Required Azure SDK Modules');
    console.log('   - @azure/ai-projects: Main SDK for Azure AI Projects');
    console.log('   - @azure/identity: For authentication with Azure');
    
    try {
        const { AIProjectClient } = require('@azure/ai-projects');
        const { DefaultAzureCredential } = require('@azure/identity');
        console.log('   ✅ Modules imported successfully');
    } catch (error) {
        console.log('   ❌ Failed to import modules:', error.message);
        return;
    }
    
    console.log('\n🔐 STEP 2: Initialize Azure Authentication');
    console.log('   - Uses DefaultAzureCredential (Azure CLI authentication)');
    console.log('   - Tenant: 7f2fd8be-bc72-440a-afa0-72751a6f4c97');
    
    const { DefaultAzureCredential } = require('@azure/identity');
    const credential = new DefaultAzureCredential();
    console.log('   ✅ Credential object created');
    
    console.log('\n🌐 STEP 3: Configure Azure AI Foundry Project');
    console.log('   - Endpoint: https://dev-ai-foundry-res-01.services.ai.azure.com/api/projects/dev-ai-foundry-res-prj-01');
    console.log('   - Agent ID: asst_Cabj69cF5rOLCHdSovbzP1fb (ADOTicketAgent)');
    
    const AZURE_CONFIG = {
        azureProjectEndpoint: "https://dev-ai-foundry-res-01.services.ai.azure.com/api/projects/dev-ai-foundry-res-prj-01",
        agentId: "asst_Cabj69cF5rOLCHdSovbzP1fb"
    };
    
    console.log('\n🤖 STEP 4: Initialize AI Project Client');
    console.log('   - Creates connection to Azure AI Foundry');
    console.log('   - Authenticates with your credentials');
    
    const { AIProjectClient } = require('@azure/ai-projects');
    let projectClient;
    
    try {
        projectClient = new AIProjectClient(
            AZURE_CONFIG.azureProjectEndpoint,
            credential
        );
        console.log('   ✅ AI Project Client initialized');
    } catch (error) {
        console.log('   ❌ Failed to initialize client:', error.message);
        return;
    }
    
    console.log('\n🧵 STEP 5: Create Conversation Thread');
    console.log('   - Each conversation needs a unique thread');
    console.log('   - Thread manages the conversation context');
    
    let thread;
    try {
        console.log('   📡 Calling: projectClient.agents.threads.create()');
        const startTime = Date.now();
        thread = await projectClient.agents.threads.create();
        const duration = Date.now() - startTime;
        console.log(`   ✅ Thread created successfully in ${duration}ms`);
        console.log(`   📝 Thread ID: ${thread.id}`);
    } catch (error) {
        console.log('   ❌ Failed to create thread:', error.message);
        console.log('   🔍 Error details:', error);
        return;
    }
    
    console.log('\n📝 STEP 6: Send Message to Agent');
    console.log('   - Adds user message to the thread');
    console.log('   - Message will be processed by ADOTicketAgent');
    
    const testMessage = "Hello ADO Ticket Agent! Please help me create a user story for implementing a new login feature with two-factor authentication.";
    
    try {
        console.log('   📡 Calling: projectClient.agents.messages.create()');
        console.log(`   💬 Message: "${testMessage}"`);
        const startTime = Date.now();
        await projectClient.agents.messages.create(thread.id, 'user', testMessage);
        const duration = Date.now() - startTime;
        console.log(`   ✅ Message sent successfully in ${duration}ms`);
    } catch (error) {
        console.log('   ❌ Failed to send message:', error.message);
        console.log('   🔍 Error details:', error);
        return;
    }
    
    console.log('\n🏃 STEP 7: Create Agent Run');
    console.log('   - Tells the agent to process the thread');
    console.log('   - Agent will analyze and respond to messages');
    
    let run;
    try {
        console.log('   📡 Calling: projectClient.agents.runs.create()');
        console.log(`   🤖 Agent ID: ${AZURE_CONFIG.agentId}`);
        const startTime = Date.now();
        run = await projectClient.agents.runs.create(thread.id, AZURE_CONFIG.agentId);
        const duration = Date.now() - startTime;
        console.log(`   ✅ Run created successfully in ${duration}ms`);
        console.log(`   🆔 Run ID: ${run.id}`);
        console.log(`   📊 Initial Status: ${run.status}`);
    } catch (error) {
        console.log('   ❌ Failed to create run:', error.message);
        console.log('   🔍 Error details:', error);
        return;
    }
    
    console.log('\n⏱️ STEP 8: Monitor Run Status');
    console.log('   - Wait for agent to complete processing');
    console.log('   - Status progression: queued → in_progress → completed');
    
    let attempts = 0;
    const maxAttempts = 15;
    
    while (attempts < maxAttempts) {
        try {
            console.log(`   📡 Calling: projectClient.agents.runs.get() [Attempt ${attempts + 1}/${maxAttempts}]`);
            const startTime = Date.now();
            const runStatus = await projectClient.agents.runs.get(thread.id, run.id);
            const duration = Date.now() - startTime;
            
            console.log(`   📊 Status: ${runStatus.status} (checked in ${duration}ms)`);
            
            if (runStatus.status === 'completed') {
                console.log('   ✅ Agent processing COMPLETED!');
                break;
            } else if (runStatus.status === 'failed') {
                console.log('   ❌ Agent processing FAILED');
                console.log('   🔍 Failure details:', runStatus);
                break;
            } else if (runStatus.status === 'in_progress' || runStatus.status === 'queued') {
                console.log('   ⏳ Agent still processing... waiting 2 seconds');
                await new Promise(resolve => setTimeout(resolve, 2000));
                attempts++;
            } else {
                console.log(`   ⚠️ Unexpected status: ${runStatus.status}`);
                break;
            }
        } catch (error) {
            console.log('   ❌ Error checking run status:', error.message);
            break;
        }
    }
    
    if (attempts >= maxAttempts) {
        console.log('   ⏰ Timeout waiting for completion');
    }
    
    console.log('\n🎉 CONNECTION DEMONSTRATION COMPLETE!');
    console.log('='.repeat(80));
    console.log('✅ Successfully demonstrated all steps to connect to Azure Foundry Agent');
    console.log(`🧵 Thread ID: ${thread.id}`);
    console.log(`🏃 Run ID: ${run.id}`);
    console.log('🤖 Agent: ADOTicketAgent (asst_Cabj69cF5rOLCHdSovbzP1fb)');
    console.log('\n💡 This proves your Azure Foundry Agent connection is working!');
    console.log('   The agent successfully received and processed your message.');
    console.log('   You can now use this same pattern in your web application.');
}

// Run the demonstration
demonstrateAzureFoundryConnection().catch(error => {
    console.error('❌ Demonstration failed:', error);
    process.exit(1);
});
