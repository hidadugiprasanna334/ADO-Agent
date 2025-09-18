const express = require('express');
const cors = require('cors');
const path = require('path');

console.log('🚀 Starting DETAILED DIAGNOSTIC Azure Foundry Chat Server...');
console.log('='.repeat(80));

const app = express();
const PORT = 3000;

// Enable CORS for all routes
app.use(cors());
app.use(express.json());

// Serve static files
app.use(express.static(path.join(__dirname)));

// Azure configuration
const AZURE_CONFIG = {
    azureProjectEndpoint: "https://dev-ai-foundry-res-01.services.ai.azure.com/api/projects/dev-ai-foundry-res-prj-01",
    agentId: "asst_z6VW8C4AvFgj54g4EPzazeBu",  // InputUnderstandingAgent
    agentName: "InputUnderstandingAgent"
};

let projectClient = null;

// Detailed logging function
function logDetailed(level, title, data = null) {
    const timestamp = new Date().toISOString();
    const symbols = {
        'INFO': '📝',
        'SUCCESS': '✅',
        'ERROR': '❌',
        'WARNING': '⚠️',
        'DEBUG': '🔍'
    };
    
    console.log(`${symbols[level] || '📝'} [${timestamp}] ${title}`);
    if (data) {
        if (typeof data === 'object') {
            console.log(JSON.stringify(data, null, 2));
        } else {
            console.log(data);
        }
    }
    console.log('-'.repeat(80));
}

async function initializeAzureClient() {
    try {
        logDetailed('INFO', 'STEP 1: Loading Azure SDK modules');
        
        const { AIProjectClient } = require('@azure/ai-projects');
        const { DefaultAzureCredential } = require('@azure/identity');
        
        logDetailed('SUCCESS', 'Azure SDK modules loaded successfully');
        
        logDetailed('INFO', 'STEP 2: Initializing Azure credentials');
        const credential = new DefaultAzureCredential();
        
        logDetailed('INFO', 'STEP 3: Creating AIProjectClient', {
            endpoint: AZURE_CONFIG.azureProjectEndpoint,
            agentId: AZURE_CONFIG.agentId
        });
        
        projectClient = new AIProjectClient(
            AZURE_CONFIG.azureProjectEndpoint,
            credential
        );
        
        logDetailed('SUCCESS', 'Azure AI Project client created successfully');
        
        // Test the connection immediately
        logDetailed('INFO', 'STEP 4: Testing Azure connection with a sample thread creation');
        try {
            const testThread = await projectClient.agents.threads.create();
            logDetailed('SUCCESS', 'Connection test SUCCESSFUL - Thread created', {
                threadId: testThread.id,
                createdAt: testThread.created_at
            });
        } catch (testError) {
            logDetailed('ERROR', 'Connection test FAILED', {
                error: testError.message,
                stack: testError.stack
            });
            return false;
        }
        
        return true;
        
    } catch (error) {
        logDetailed('ERROR', 'Failed to initialize Azure client', {
            message: error.message,
            stack: error.stack,
            code: error.code
        });
        return false;
    }
}

// Health check with detailed info
app.get('/api/health', (req, res) => {
    logDetailed('INFO', 'Health check requested');
    
    const healthInfo = {
        status: 'ok',
        azure_client: projectClient ? 'initialized' : 'not_initialized',
        timestamp: new Date().toISOString(),
        pattern: 'detailed_diagnostic_pattern',
        config: AZURE_CONFIG,
        client_status: projectClient ? 'ready' : 'not_ready'
    };
    
    logDetailed('SUCCESS', 'Health check response', healthInfo);
    res.json(healthInfo);
});

// Create thread with detailed logging
app.post('/api/threads', async (req, res) => {
    logDetailed('INFO', 'THREAD CREATION REQUEST received');
    
    try {
        if (!projectClient) {
            logDetailed('ERROR', 'Azure client not initialized');
            return res.status(500).json({ error: 'Azure client not initialized' });
        }
        
        logDetailed('INFO', 'Calling projectClient.agents.threads.create()');
        const startTime = Date.now();
        
        const thread = await projectClient.agents.threads.create();
        const endTime = Date.now();
        
        logDetailed('SUCCESS', 'Thread created successfully', {
            threadId: thread.id,
            duration: `${endTime - startTime}ms`,
            threadData: thread
        });
        
        res.json(thread);
        
    } catch (error) {
        logDetailed('ERROR', 'Error creating thread', {
            message: error.message,
            stack: error.stack,
            statusCode: error.statusCode,
            code: error.code
        });
        res.status(500).json({ 
            error: error.message,
            details: error.stack
        });
    }
});

// Create message with detailed logging
app.post('/api/threads/:threadId/messages', async (req, res) => {
    const { threadId } = req.params;
    const { role, content } = req.body;
    
    logDetailed('INFO', 'MESSAGE CREATION REQUEST received', {
        threadId,
        role,
        content,
        contentLength: content ? content.length : 0
    });
    
    try {
        if (!projectClient) {
            logDetailed('ERROR', 'Azure client not initialized');
            return res.status(500).json({ error: 'Azure client not initialized' });
        }
        
        logDetailed('INFO', 'Calling projectClient.agents.messages.create()', {
            parameters: { threadId, role, content }
        });
        
        const startTime = Date.now();
        const result = await projectClient.agents.messages.create(threadId, role, content);
        const endTime = Date.now();
        
        logDetailed('SUCCESS', 'Message created successfully', {
            duration: `${endTime - startTime}ms`,
            result: result
        });
        
        res.json({ success: true, threadId, role, content, result });
        
    } catch (error) {
        logDetailed('ERROR', 'Error creating message', {
            threadId,
            message: error.message,
            stack: error.stack,
            statusCode: error.statusCode,
            code: error.code
        });
        res.status(500).json({ 
            error: error.message,
            details: error.stack
        });
    }
});

// Create run with detailed logging
app.post('/api/threads/:threadId/runs', async (req, res) => {
    const { threadId } = req.params;
    const { assistant_id } = req.body;
    const agentId = assistant_id || AZURE_CONFIG.agentId;
    
    logDetailed('INFO', 'RUN CREATION REQUEST received', {
        threadId,
        agentId,
        requestBody: req.body
    });
    
    try {
        if (!projectClient) {
            logDetailed('ERROR', 'Azure client not initialized');
            return res.status(500).json({ error: 'Azure client not initialized' });
        }
        
        logDetailed('INFO', 'Calling projectClient.agents.runs.create()', {
            parameters: { threadId, agentId }
        });
        
        const startTime = Date.now();
        // Use the simple format that worked before
        const run = await projectClient.agents.runs.create(threadId, agentId);
        const endTime = Date.now();
        
        // Validate run object
        if (!run || !run.id) {
            logDetailed('ERROR', 'Run creation returned invalid object', {
                runObject: run,
                hasId: !!run?.id,
                runType: typeof run
            });
            return res.status(500).json({ 
                error: 'Run creation failed - no valid run ID returned',
                runData: run
            });
        }

        logDetailed('SUCCESS', 'Run created successfully', {
            runId: run.id,
            status: run.status,
            duration: `${endTime - startTime}ms`,
            runData: run
        });
        
        res.json(run);
        
    } catch (error) {
        logDetailed('ERROR', 'Error creating run', {
            threadId,
            agentId,
            message: error.message,
            stack: error.stack,
            statusCode: error.statusCode,
            code: error.code
        });
        res.status(500).json({ 
            error: error.message,
            details: error.stack
        });
    }
});

// Get run status with detailed logging
app.get('/api/threads/:threadId/runs/:runId', async (req, res) => {
    const { threadId, runId } = req.params;
    
    logDetailed('INFO', 'RUN STATUS REQUEST received', {
        threadId,
        runId
    });
    
    try {
        if (!projectClient) {
            logDetailed('ERROR', 'Azure client not initialized');
            return res.status(500).json({ error: 'Azure client not initialized' });
        }
        
        logDetailed('INFO', 'Calling projectClient.agents.runs.get()', {
            parameters: { threadId, runId }
        });
        
        const startTime = Date.now();
        const runStatus = await projectClient.agents.runs.get(threadId, runId);
        const endTime = Date.now();
        
        logDetailed('SUCCESS', 'Run status retrieved successfully', {
            status: runStatus.status,
            duration: `${endTime - startTime}ms`,
            runStatusData: runStatus
        });

        // DETAILED RUN OBJECT INSPECTION
        console.log('\n🔍 ===================== DETAILED RUN OBJECT INSPECTION =====================');
        console.log('📊 Run Status:', runStatus.status);
        console.log('🆔 Run ID:', runStatus.id);
        console.log('🧵 Thread ID:', threadId);
        console.log('📅 Created At:', runStatus.created_at);
        console.log('🏁 Completed At:', runStatus.completed_at);
        console.log('📄 Has Output Property:', !!runStatus.output);
        
        if (runStatus.output) {
            console.log('📋 Output Structure:');
            console.log('   Type:', typeof runStatus.output);
            console.log('   Is Array:', Array.isArray(runStatus.output));
            console.log('   Full Output:', JSON.stringify(runStatus.output, null, 2));
            
            if (runStatus.output.data && Array.isArray(runStatus.output.data)) {
                console.log('   Data Array Length:', runStatus.output.data.length);
                runStatus.output.data.forEach((item, index) => {
                    console.log(`   Data Item ${index}:`, JSON.stringify(item, null, 4));
                });
            }
        } else {
            console.log('❌ No output property found in run object');
        }
        
        console.log('🔧 Available Properties:', Object.keys(runStatus));
        console.log('🔍 =======================================================================\n');

        // If run is completed, try to get agent output
        if (runStatus.status === "completed") {
            try {
                let agentOutput = null;
                let fullAgentResponse = null;
                let outputSource = 'none';

                // OPTION 1: Try to get output directly from run.output
                if (runStatus.output && runStatus.output.data && runStatus.output.data.length > 0) {
                    console.log('\n✅ TRYING OPTION 1: Direct run.output access');
                    try {
                        const outputData = runStatus.output.data[0];
                        if (outputData.content && outputData.content[0] && outputData.content[0].text) {
                            fullAgentResponse = outputData.content[0].text.value;
                            outputSource = 'run.output';
                            console.log('🎯 SUCCESS: Found output in run.output.data');
                            console.log('📄 Full Response from run.output:', fullAgentResponse);
                            
                            // Try to parse JSON
                            try {
                                agentOutput = JSON.parse(fullAgentResponse);
                                console.log('✅ Parsed JSON from run.output:', agentOutput);
                            } catch (parseError) {
                                console.log('⚠️ Could not parse run.output as JSON, keeping raw text');
                            }
                        }
                    } catch (runOutputError) {
                        console.log('❌ Error accessing run.output:', runOutputError.message);
                    }
                }

                // OPTION 2: Fallback to thread messages if run.output didn't work
                if (!fullAgentResponse) {
                    console.log('\n🔄 TRYING OPTION 2: Thread messages fallback');
                    logDetailed('INFO', 'Run completed - fetching agent output from thread messages');
                    
                    const messages = await projectClient.agents.messages.list(threadId);
                    logDetailed('INFO', 'Messages retrieved for completed run', {
                        messageCount: messages.data ? messages.data.length : 0
                    });

                    if (messages.data) {
                    console.log('\n🤖 ================= AGENT OUTPUT EXTRACTION =================');
                    
                    for (let i = 0; i < messages.data.length; i++) {
                        const msg = messages.data[i];
                        console.log(`\n📝 Checking MESSAGE ${i + 1}:`);
                        console.log(`   Role: ${msg.role}`);
                        console.log(`   ID: ${msg.id}`);
                        
                        if (msg.role === 'assistant' && msg.content) {
                            console.log(`   ✅ Found assistant message!`);
                            
                            for (let j = 0; j < msg.content.length; j++) {
                                const content = msg.content[j];
                                console.log(`     Content ${j + 1} Type: ${content.type}`);
                                
                                if (content.type === 'text' && content.text && content.text.value) {
                                    fullAgentResponse = content.text.value;
                                    console.log(`     📄 FULL AGENT RESPONSE:`);
                                    console.log('     =====================================');
                                    console.log(fullAgentResponse);
                                    console.log('     =====================================');
                                    
                                    // Try to parse JSON from the response
                                    try {
                                        // Look for JSON in code blocks first
                                        const jsonMatch = fullAgentResponse.match(/```json\s*({[\s\S]*?})\s*```/);
                                        if (jsonMatch) {
                                            agentOutput = JSON.parse(jsonMatch[1]);
                                            console.log(`     ✅ PARSED JSON FROM CODE BLOCK:`, agentOutput);
                                        } else {
                                            // Try to parse the entire response as JSON
                                            agentOutput = JSON.parse(fullAgentResponse);
                                            console.log(`     ✅ PARSED ENTIRE RESPONSE AS JSON:`, agentOutput);
                                        }
                                    } catch (parseError) {
                                        console.log(`     ⚠️ Could not parse as JSON:`, parseError.message);
                                        console.log(`     📝 Will return raw text response`);
                                    }
                                    
                                    break; // Found the content, exit inner loop
                                }
                            }
                            
                            if (fullAgentResponse) {
                                outputSource = 'thread.messages';
                                break; // Found assistant message with content, exit outer loop
                            }
                        }
                    }
                    
                    console.log('\n🎯 FINAL EXTRACTION RESULTS:');
                    console.log('   Output Source:', outputSource);
                    console.log('   Parsed JSON:', agentOutput);
                    console.log('   Full Response Length:', fullAgentResponse ? fullAgentResponse.length : 0);
                    console.log('🤖 =========================================================\n');
                    }
                }

                // Return enhanced response with both run status and agent output
                const enhancedResponse = {
                    runStatus: runStatus.status,
                    runId: runStatus.id,
                    threadId: threadId,
                    output: agentOutput,
                    fullResponse: fullAgentResponse,
                    hasOutput: !!agentOutput,
                    outputSource: outputSource,
                    responseLength: fullAgentResponse ? fullAgentResponse.length : 0,
                    timestamp: new Date().toISOString()
                };

                logDetailed('SUCCESS', 'Agent output extracted successfully', enhancedResponse);
                res.json(enhancedResponse);

            } catch (messageError) {
                logDetailed('ERROR', 'Error fetching agent output from messages', {
                    error: messageError.message,
                    stack: messageError.stack
                });
                
                // Fallback to just run status if message retrieval fails
                res.json({
                    runStatus: runStatus.status,
                    runId: runStatus.id,
                    threadId: threadId,
                    output: null,
                    fullResponse: null,
                    hasOutput: false,
                    error: 'Could not retrieve agent output',
                    timestamp: new Date().toISOString()
                });
            }
        } else {
            // Run not completed yet, return just the status
            res.json({
                runStatus: runStatus.status,
                runId: runStatus.id,
                threadId: threadId,
                output: null,
                fullResponse: null,
                hasOutput: false,
                timestamp: new Date().toISOString()
            });
        }
        
    } catch (error) {
        logDetailed('ERROR', 'Error getting run status', {
            threadId,
            runId,
            message: error.message,
            stack: error.stack,
            statusCode: error.statusCode,
            code: error.code
        });
        res.status(500).json({ 
            error: error.message,
            details: error.stack
        });
    }
});

// Get messages from thread with detailed logging
app.get('/api/threads/:threadId/messages', async (req, res) => {
    const { threadId } = req.params;
    
    logDetailed('INFO', 'MESSAGES RETRIEVAL REQUEST received', {
        threadId
    });
    
    try {
        if (!projectClient) {
            logDetailed('ERROR', 'Azure client not initialized');
            return res.status(500).json({ error: 'Azure client not initialized' });
        }
        
        logDetailed('INFO', 'Calling projectClient.agents.messages.list()', {
            parameters: { threadId }
        });
        
        const startTime = Date.now();
        const messages = await projectClient.agents.messages.list(threadId);
        const endTime = Date.now();
        
        logDetailed('SUCCESS', 'Messages retrieved successfully', {
            messageCount: messages.data ? messages.data.length : 0,
            duration: `${endTime - startTime}ms`,
            messagesData: messages
        });

        // Log complete agent responses for debugging
        if (messages.data) {
            console.log('\n🤖 ===================== COMPLETE AGENT RESPONSES =====================');
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
            console.log('🤖 ===================================================================\n');
        }
        
        res.json(messages);
        
    } catch (error) {
        logDetailed('ERROR', 'Error retrieving messages', {
            threadId,
            message: error.message,
            stack: error.stack,
            statusCode: error.statusCode,
            code: error.code
        });
        res.status(500).json({ 
            error: error.message,
            details: error.stack
        });
    }
});

// Start server
async function startServer() {
    logDetailed('INFO', 'STARTING SERVER INITIALIZATION');
    
    const azureInitialized = await initializeAzureClient();
    
    if (!azureInitialized) {
        logDetailed('ERROR', 'Failed to initialize Azure client - Server will start but Azure features disabled');
    }
    
    app.listen(PORT, () => {
        logDetailed('SUCCESS', 'Server started successfully', {
            port: PORT,
            url: `http://localhost:${PORT}`,
            azureStatus: azureInitialized ? 'READY' : 'DISABLED',
            agentId: AZURE_CONFIG.agentId,
            endpoint: AZURE_CONFIG.azureProjectEndpoint
        });
        
        console.log('🎯 READY TO TEST! Try these steps:');
        console.log('1. Open http://localhost:3000 in browser');
        console.log('2. Check connection status');
        console.log('3. Send a test message');
        console.log('4. Watch detailed logs here');
        console.log('='.repeat(80));
    });
}

// Graceful shutdown
process.on('SIGINT', () => {
    logDetailed('INFO', 'Shutting down server gracefully');
    process.exit(0);
});

// Start the server
startServer();
