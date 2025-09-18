class AzureFoundryChat {
    constructor() {
        // Azure Foundry configuration from config.js
        this.config = AZURE_CONFIG;

        // UI elements
        this.chatMessages = document.getElementById('chatMessages');
        this.messageInput = document.getElementById('messageInput');
        this.sendButton = document.getElementById('sendButton');
        this.loadingOverlay = document.getElementById('loadingOverlay');
        this.statusIndicator = document.getElementById('statusIndicator');
        this.statusText = document.getElementById('statusText');

        // Azure AI Projects client
        this.projectClient = null;
        this.threadId = null;

        this.init();
    }

    async init() {
        try {
            await this.initializeAzureClient();
            this.setupEventListeners();
            this.updateConnectionStatus(true, 'Connected');
            this.enableInput();
        } catch (error) {
            console.error('Initialization failed:', error);
            this.showError('Failed to initialize Azure Foundry connection: ' + error.message);
            this.updateConnectionStatus(false, 'Connection failed');
        }
    }

    async initializeAzureClient() {
        try {
            console.log('🚀 Initializing Azure AI Projects client...');
            console.log('📊 Configuration Details:');
            console.log('  🔗 Endpoint:', this.config.endpoint);
            console.log('  📁 Project:', this.config.projectName);
            console.log('  🤖 Agent Name:', this.config.agentName);
            console.log('  🆔 Agent ID:', this.config.agentId);
            console.log('  🔑 API Key (first 10 chars):', this.config.apiKey.substring(0, 10) + '...');
            console.log('  📅 API Version:', this.config.apiVersion);

            // For browser environment, create a simple projectClient that mimics the SDK structure
            this.projectClient = {
                agents: {
                    // Create thread
                    createThread: async () => {
                        console.log('🧵 agents.createThread called');
                        const response = await this.makeApiCall('POST', '/threads', {});
                        return response;
                    },
                    
                    // Messages operations
                    messages: {
                        create: async (threadId, role, content) => {
                            console.log(`📝 agents.messages.create called:`);
                            console.log(`  🧵 threadId: ${threadId}`);
                            console.log(`  👤 role: ${role}`);
                            console.log(`  💬 content: ${content}`);
                            
                            const response = await this.makeApiCall('POST', `/threads/${threadId}/messages`, {
                                role: role,
                                content: content
                            });
                            return response;
                        },
                        
                        list: async (threadId) => {
                            console.log(`📋 agents.messages.list called:`);
                            console.log(`  🧵 threadId: ${threadId}`);
                            
                            const response = await this.makeApiCall('GET', `/threads/${threadId}/messages`);
                            return response;
                        }
                    },
                    
                    // Runs operations
                    runs: {
                        create: async (threadId, assistantId) => {
                            console.log(`🏃 agents.runs.create called:`);
                            console.log(`  🧵 threadId: ${threadId}`);
                            console.log(`  🤖 assistantId: ${assistantId}`);
                            
                            const response = await this.makeApiCall('POST', `/threads/${threadId}/runs`, {
                                assistant_id: assistantId
                            });
                            return response;
                        },
                        
                        retrieve: async (threadId, runId) => {
                            console.log(`🔍 agents.runs.retrieve called:`);
                            console.log(`  🧵 threadId: ${threadId}`);
                            console.log(`  🆔 runId: ${runId}`);
                            
                            const response = await this.makeApiCall('GET', `/threads/${threadId}/runs/${runId}`);
                            return response;
                        }
                    }
                }
            };

            // Create a thread for the conversation
            console.log('🧵 Creating conversation thread...');
            const thread = await this.projectClient.agents.createThread();
            this.threadId = thread.id;

            console.log('✅ Azure Foundry client initialized successfully');
            console.log('🧵 Thread ID:', this.threadId);
            console.log('🎯 Ready for agent communication');
        } catch (error) {
            console.error('Failed to initialize Azure client:', error);
            throw error;
        }
    }

    async makeApiCall(method, endpoint, data = null) {
        // Try multiple endpoint formats to find the correct one
        const endpointFormats = [
            {
                name: "Azure AI Services Regional",
                url: `${this.config.endpoint}/assistants/v1${endpoint}?api-version=${this.config.apiVersion}`,
                headers: {
                    'Content-Type': 'application/json',
                    'Ocp-Apim-Subscription-Key': this.config.apiKey
                }
            },
            {
                name: "Azure OpenAI Format",
                url: `https://${this.config.resourceName}.openai.azure.com/openai${endpoint}?api-version=${this.config.apiVersion}`,
                headers: {
                    'Content-Type': 'application/json',
                    'api-key': this.config.apiKey
                }
            },
            {
                name: "Azure AI Studio Format",
                url: `https://${this.config.resourceName}.services.ai.azure.com/api/projects/${this.config.projectName}${endpoint}?api-version=${this.config.apiVersion}`,
                headers: {
                    'Content-Type': 'application/json',
                    'api-key': this.config.apiKey
                }
            },
            {
                name: "Direct Cognitive Services",
                url: `https://${this.config.resourceName}.cognitiveservices.azure.com/openai${endpoint}?api-version=${this.config.apiVersion}`,
                headers: {
                    'Content-Type': 'application/json',
                    'api-key': this.config.apiKey
                }
            }
        ];

        let lastError = null;
        
        for (const format of endpointFormats) {
            const url = format.url;
            
            console.log(`\n📡 === API CALL START (${format.name}) ===`);
            console.log(`🎯 Method: ${method}`);
            console.log(`🔗 URL: ${url}`);
            console.log(`📅 API Version: ${this.config.apiVersion}`);
            console.log(`🔑 Auth Headers:`, format.headers);
            
            const options = {
                method: method,
                headers: format.headers
            };
            
            if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
                options.body = JSON.stringify(data);
                console.log('📤 Request Body:');
                console.log(JSON.stringify(data, null, 2));
            }

            try {
                console.log('⏳ Sending request...');
                const startTime = Date.now();
                const response = await fetch(url, options);
                const endTime = Date.now();
                
                console.log(`⏱️  Response Time: ${endTime - startTime}ms`);
                console.log(`📊 Response Status: ${response.status} ${response.statusText}`);
                
                if (response.ok) {
                    const result = await response.json();
                    console.log('✅ Success Response Body:');
                    console.log(JSON.stringify(result, null, 2));
                    console.log(`📡 === API CALL END (SUCCESS with ${format.name}) ===\n`);
                    return result;
                } else {
                    const errorText = await response.text();
                    console.log('❌ Error Response Body:');
                    console.log(errorText);
                    
                    lastError = new Error(`HTTP ${response.status}: ${errorText}`);
                    console.log(`📡 === Trying next format... ===\n`);
                    // Continue to next format
                }
            } catch (error) {
                console.log('💥 Exception caught:');
                console.error('❌ Network error:', error);
                lastError = error;
                console.log(`📡 === Trying next format... ===\n`);
                // Continue to next format
            }
        }
        
        // If we get here, all formats failed
        console.log('💥 ALL ENDPOINT FORMATS FAILED');
        throw lastError || new Error('All endpoint formats failed');
    }

    setupEventListeners() {
        // Send button click
        this.sendButton.addEventListener('click', () => {
            this.sendMessage();
        });

        // Enter key press
        this.messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });

        // Input field changes
        this.messageInput.addEventListener('input', () => {
            this.sendButton.disabled = !this.messageInput.value.trim();
        });
    }

    async sendMessage() {
        const message = this.messageInput.value.trim();
        if (!message || !this.threadId) return;

        try {
            console.log('\n🗨️  === SENDING MESSAGE ===');
            console.log('📝 User Message:', message);
            console.log('🧵 Thread ID:', this.threadId);
            console.log('🤖 Agent ID:', this.config.agentId);

            // Disable input while processing
            this.disableInput();
            this.showLoading(true);

            // Add user message to UI
            this.addMessage(message, 'user');
            this.messageInput.value = '';

            // Send message to Azure Foundry agent using SDK method
            console.log('📤 Step 1: Creating message using SDK method...');
            const messageResponse = await this.projectClient.agents.messages.create(this.threadId, 'user', message);
            console.log('✅ Message created:', messageResponse);

            // Create a run with the configured agent ID
            console.log('🏃 Step 2: Creating run with agent...');
            const run = await this.projectClient.agents.runs.create(this.threadId, this.config.agentId);
            console.log('✅ Run created:', run);

            // Poll for completion
            console.log('⏳ Step 3: Waiting for run completion...');
            const completedRun = await this.waitForRunCompletion(this.threadId, run.id);
            console.log('✅ Run completed:', completedRun);

            // Get the latest messages
            console.log('📥 Step 4: Retrieving messages...');
            const messages = await this.projectClient.agents.messages.list(this.threadId);
            console.log('📋 Retrieved messages:', messages);

            // Find the latest assistant message
            console.log('🔍 Step 5: Looking for assistant response...');
            const latestMessage = messages.data?.find(msg => 
                msg.role === 'assistant' && msg.created_at > Date.now() - 60000
            );

            if (latestMessage) {
                console.log('✅ Found assistant message:', latestMessage);
                const content = this.extractMessageContent(latestMessage);
                console.log('📄 Extracted content:', content);
                this.addMessage(content, 'agent');
            } else {
                console.log('⚠️  No recent assistant message found');
                console.log('📋 All messages:', messages.data);
                this.addMessage('I received your message, but I\'m having trouble generating a response right now.', 'agent');
            }

            console.log('🗨️  === MESSAGE SENT SUCCESSFULLY ===\n');

        } catch (error) {
            console.log('💥 === MESSAGE SENDING FAILED ===');
            console.error('❌ Error sending message:', error);
            console.log('📊 Error details:');
            console.log('  - Message:', error.message);
            console.log('  - Stack:', error.stack);
            console.log('🗨️  === MESSAGE SEND END (ERROR) ===\n');
            
            this.showError('Failed to send message: ' + error.message);
            this.addMessage('Sorry, I encountered an error while processing your message. Please check the console for details.', 'agent');
        } finally {
            this.showLoading(false);
            this.enableInput();
        }
    }

    async waitForRunCompletion(threadId, runId, maxAttempts = null) {
        maxAttempts = maxAttempts || this.config.maxPollAttempts;
        console.log(`🔄 Polling for run completion (max ${maxAttempts} attempts)`);
        
        for (let i = 0; i < maxAttempts; i++) {
            console.log(`🔍 Poll attempt ${i + 1}/${maxAttempts}`);
            const run = await this.projectClient.agents.runs.retrieve(threadId, runId);
            
            console.log(`📊 Run status: ${run.status}`);
            if (run.last_error) {
                console.log('⚠️  Run has error:', run.last_error);
            }
            
            if (run.status === 'completed') {
                console.log('✅ Run completed successfully');
                return run;
            } else if (run.status === 'failed' || run.status === 'cancelled') {
                console.log(`❌ Run ${run.status}`);
                throw new Error(`Run ${run.status}: ${run.last_error?.message || 'Unknown error'}`);
            }

            console.log(`⏳ Waiting ${this.config.pollInterval}ms before next poll...`);
            // Wait before polling again
            await new Promise(resolve => setTimeout(resolve, this.config.pollInterval));
        }

        console.log('⏰ Run polling timed out');
        throw new Error('Run timeout - the agent is taking too long to respond');
    }

    extractMessageContent(message) {
        if (typeof message.content === 'string') {
            return message.content;
        } else if (Array.isArray(message.content)) {
            // Handle content array format
            const textContent = message.content
                .filter(item => item.type === 'text')
                .map(item => item.text?.value || item.text)
                .join(' ');
            return textContent || 'No content available';
        }
        return 'Unable to parse message content';
    }

    addMessage(content, type) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type}-message`;

        const messageContent = document.createElement('div');
        messageContent.className = 'message-content';
        messageContent.textContent = content;

        const timestamp = document.createElement('div');
        timestamp.className = 'message-timestamp';
        timestamp.textContent = new Date().toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit' 
        });

        messageDiv.appendChild(messageContent);
        messageDiv.appendChild(timestamp);
        this.chatMessages.appendChild(messageDiv);

        // Scroll to bottom
        this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
    }

    showError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.textContent = message;
        
        this.chatMessages.appendChild(errorDiv);
        this.chatMessages.scrollTop = this.chatMessages.scrollHeight;

        // Remove error message after 10 seconds
        setTimeout(() => {
            if (errorDiv.parentNode) {
                errorDiv.parentNode.removeChild(errorDiv);
            }
        }, 10000);
    }

    updateConnectionStatus(connected, text) {
        this.statusIndicator.className = `status-indicator ${connected ? 'connected' : ''}`;
        this.statusText.textContent = text;
    }

    enableInput() {
        this.messageInput.disabled = false;
        this.sendButton.disabled = !this.messageInput.value.trim();
        this.messageInput.focus();
    }

    disableInput() {
        this.messageInput.disabled = true;
        this.sendButton.disabled = true;
    }

    showLoading(show) {
        this.loadingOverlay.className = show ? 'loading-overlay show' : 'loading-overlay';
    }
}

// Initialize the chat application when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new AzureFoundryChat();
});

// Handle potential errors
window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
});

window.addEventListener('error', (event) => {
    console.error('Script error:', event.error);
});
