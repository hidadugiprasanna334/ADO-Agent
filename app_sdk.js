class AzureFoundryChat {
    constructor() {
        // UI elements
        this.chatMessages = document.getElementById('chatMessages');
        this.messageInput = document.getElementById('messageInput');
        this.sendButton = document.getElementById('sendButton');
        this.loadingOverlay = document.getElementById('loadingOverlay');
        this.statusIndicator = document.getElementById('statusIndicator');
        this.statusText = document.getElementById('statusText');

        // Azure configuration
        this.config = {
            agentId: 'asst_Cabj69cF5rOLCHdSovbzP1fb',
            agentName: 'ADOTicketAgent',
            pollInterval: 1000,
            maxPollAttempts: 30
        };

        // Chat state
        this.threadId = null;

        this.init();
    }

    async init() {
        try {
            console.log('🚀 Initializing Azure Foundry Chat...');
            console.log('🤖 Agent:', this.config.agentName);
            console.log('🆔 Agent ID:', this.config.agentId);

            // Test server connection
            await this.testConnection();

            // Create a thread for the conversation
            await this.createThread();

            this.setupEventListeners();
            this.updateConnectionStatus(true, 'Connected');
            this.enableInput();

            console.log('✅ Azure Foundry Chat initialized successfully');
        } catch (error) {
            console.error('❌ Initialization failed:', error);
            this.showError('Failed to initialize Azure Foundry connection: ' + error.message);
            this.updateConnectionStatus(false, 'Connection failed');
        }
    }

    async testConnection() {
        try {
            console.log('🔍 Testing server connection...');
            const response = await fetch('/api/health');
            
            if (!response.ok) {
                throw new Error(`Server health check failed: ${response.status}`);
            }
            
            const health = await response.json();
            console.log('✅ Server connection test successful:', health);
            
            if (health.azure_client !== 'initialized') {
                throw new Error('Azure client not initialized on server');
            }
            
        } catch (error) {
            console.error('❌ Connection test failed:', error);
            throw error;
        }
    }

    async createThread() {
        try {
            console.log('🧵 Creating conversation thread...');
            
            const response = await fetch('/api/threads', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(`Failed to create thread: ${error.error}`);
            }

            const thread = await response.json();
            this.threadId = thread.id;
            
            console.log('✅ Thread created:', this.threadId);
        } catch (error) {
            console.error('❌ Failed to create thread:', error);
            throw error;
        }
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

            // Step 1: Create message using server API (which uses Azure SDK)
            console.log('📤 Step 1: Creating message...');
            await this.createMessage(this.threadId, 'user', message);

            // Step 2: Create run with agent
            console.log('🏃 Step 2: Creating run with agent...');
            const run = await this.createRun(this.threadId, this.config.agentId);

            // Step 3: Poll for completion
            console.log('⏳ Step 3: Waiting for run completion...');
            await this.waitForRunCompletion(this.threadId, run.id);

            // Step 4: Get messages
            console.log('📥 Step 4: Retrieving messages...');
            const messages = await this.listMessages(this.threadId);

            // Step 5: Find and display assistant response
            console.log('🔍 Step 5: Looking for assistant response...');
            const latestMessage = messages.data?.find(msg => 
                msg.role === 'assistant' && 
                new Date(msg.created_at) > new Date(Date.now() - 60000) // Within last minute
            );

            if (latestMessage) {
                console.log('✅ Found assistant message:', latestMessage);
                const content = this.extractMessageContent(latestMessage);
                console.log('📄 Extracted content:', content);
                this.addMessage(content, 'agent');
            } else {
                console.log('⚠️  No recent assistant message found');
                this.addMessage('I received your message, but I\'m having trouble generating a response right now.', 'agent');
            }

            console.log('🗨️  === MESSAGE SENT SUCCESSFULLY ===\n');

        } catch (error) {
            console.log('💥 === MESSAGE SENDING FAILED ===');
            console.error('❌ Error sending message:', error);
            this.showError('Failed to send message: ' + error.message);
            this.addMessage('Sorry, I encountered an error while processing your message.', 'agent');
        } finally {
            this.showLoading(false);
            this.enableInput();
        }
    }

    async createMessage(threadId, role, content) {
        const response = await fetch(`/api/threads/${threadId}/messages`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ role, content })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(`Failed to create message: ${error.error}`);
        }

        return await response.json();
    }

    async createRun(threadId, assistantId) {
        const response = await fetch(`/api/threads/${threadId}/runs`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ assistant_id: assistantId })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(`Failed to create run: ${error.error}`);
        }

        return await response.json();
    }

    async getRun(threadId, runId) {
        const response = await fetch(`/api/threads/${threadId}/runs/${runId}`);

        if (!response.ok) {
            const error = await response.json();
            throw new Error(`Failed to get run: ${error.error}`);
        }

        return await response.json();
    }

    async listMessages(threadId) {
        const response = await fetch(`/api/threads/${threadId}/messages`);

        if (!response.ok) {
            const error = await response.json();
            throw new Error(`Failed to list messages: ${error.error}`);
        }

        return await response.json();
    }

    async waitForRunCompletion(threadId, runId) {
        console.log(`🔄 Polling for run completion (max ${this.config.maxPollAttempts} attempts)`);
        
        for (let i = 0; i < this.config.maxPollAttempts; i++) {
            console.log(`🔍 Poll attempt ${i + 1}/${this.config.maxPollAttempts}`);
            
            const run = await this.getRun(threadId, runId);
            console.log(`📊 Run status: ${run.status}`);
            
            if (run.status === 'completed') {
                console.log('✅ Run completed successfully');
                return run;
            } else if (run.status === 'failed' || run.status === 'cancelled') {
                console.log(`❌ Run ${run.status}`);
                throw new Error(`Run ${run.status}: ${run.last_error?.message || 'Unknown error'}`);
            }

            console.log(`⏳ Waiting ${this.config.pollInterval}ms before next poll...`);
            await new Promise(resolve => setTimeout(resolve, this.config.pollInterval));
        }

        throw new Error('Run timeout - the agent is taking too long to respond');
    }

    extractMessageContent(message) {
        if (typeof message.content === 'string') {
            return message.content;
        } else if (Array.isArray(message.content)) {
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
