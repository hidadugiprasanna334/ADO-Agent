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
            console.log('Initializing connection to Azure Foundry...');
            console.log('Endpoint:', this.config.endpoint);
            console.log('Agent Name:', this.config.agentName);
            console.log('Agent ID:', this.config.agentId);

            // Create a thread for the conversation
            const thread = await this.createThread();
            this.threadId = thread.id;

            console.log('Azure Foundry client initialized successfully');
            console.log('Thread ID:', this.threadId);
        } catch (error) {
            console.error('Failed to initialize Azure client:', error);
            
            // If we can't create a thread, create a mock one for demonstration
            console.log('Creating mock thread for demonstration...');
            this.threadId = 'thread_mock_' + Date.now();
            console.log('Mock Thread ID:', this.threadId);
        }
    }

    async createThread() {
        try {
            const response = await this.makeApiCall('POST', '/threads', {});
            return response;
        } catch (error) {
            console.error('Failed to create thread:', error);
            throw error;
        }
    }

    async makeApiCall(method, endpoint, data = null) {
        const url = `${this.config.endpoint}/openai${endpoint}?api-version=${this.config.apiVersion}`;
        
        console.log(`Making ${method} request to: ${url}`);
        
        const options = {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'api-key': this.config.apiKey
            }
        };
        
        if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
            options.body = JSON.stringify(data);
            console.log('Request body:', JSON.stringify(data, null, 2));
        }

        try {
            const response = await fetch(url, options);
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error(`HTTP ${response.status}:`, errorText);
                throw new Error(`HTTP ${response.status}: ${errorText}`);
            }

            const result = await response.json();
            console.log('API Response:', result);
            return result;
        } catch (error) {
            console.error('API call failed:', error);
            
            // For CORS errors, provide helpful message
            if (error.message.includes('CORS') || error.message.includes('fetch')) {
                throw new Error('CORS error - the Azure API cannot be accessed directly from the browser. You may need to use a proxy server or configure CORS settings.');
            }
            
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
            // Disable input while processing
            this.disableInput();
            this.showLoading(true);

            // Add user message to UI
            this.addMessage(message, 'user');
            this.messageInput.value = '';

            // For demonstration purposes, if we have a mock thread, show a mock response
            if (this.threadId.startsWith('thread_mock_')) {
                setTimeout(() => {
                    this.addMessage('Hello! I am the ADOTicketAgent. I can help you with Azure DevOps tickets. However, there seems to be a connection issue with the Azure Foundry API. Please check the browser console for more details.', 'agent');
                    this.showLoading(false);
                    this.enableInput();
                }, 1500);
                return;
            }

            // Send message to Azure Foundry agent
            await this.createMessage(this.threadId, message);

            // Create a run with the configured agent ID
            const run = await this.createRun(this.threadId, this.config.agentId);

            // Poll for completion
            await this.waitForRunCompletion(this.threadId, run.id);

            // Get the latest messages
            const messages = await this.listMessages(this.threadId);
            
            // Find the latest assistant message
            const latestMessage = messages.data.find(msg => 
                msg.role === 'assistant' && msg.created_at > Date.now() - 60000
            );

            if (latestMessage) {
                const content = this.extractMessageContent(latestMessage);
                this.addMessage(content, 'agent');
            } else {
                this.addMessage('I received your message, but I\'m having trouble generating a response right now.', 'agent');
            }

        } catch (error) {
            console.error('Error sending message:', error);
            this.showError('Failed to send message: ' + error.message);
            
            // Show a helpful error message based on the error type
            if (error.message.includes('CORS')) {
                this.addMessage('Sorry, there\'s a CORS issue preventing direct API access. This chat interface needs to be served through a proxy server to work with Azure Foundry.', 'agent');
            } else {
                this.addMessage('Sorry, I encountered an error while processing your message. Please check the console for more details.', 'agent');
            }
        } finally {
            this.showLoading(false);
            this.enableInput();
        }
    }

    async createMessage(threadId, content) {
        const response = await this.makeApiCall('POST', `/threads/${threadId}/messages`, {
            role: 'user',
            content: content
        });
        return response;
    }

    async createRun(threadId, assistantId) {
        const response = await this.makeApiCall('POST', `/threads/${threadId}/runs`, {
            assistant_id: assistantId
        });
        return response;
    }

    async getRun(threadId, runId) {
        const response = await this.makeApiCall('GET', `/threads/${threadId}/runs/${runId}`);
        return response;
    }

    async listMessages(threadId) {
        const response = await this.makeApiCall('GET', `/threads/${threadId}/messages`);
        return { data: response.data || [] };
    }

    async waitForRunCompletion(threadId, runId, maxAttempts = null) {
        maxAttempts = maxAttempts || this.config.maxPollAttempts;
        for (let i = 0; i < maxAttempts; i++) {
            const run = await this.getRun(threadId, runId);
            
            if (run.status === 'completed') {
                return run;
            } else if (run.status === 'failed' || run.status === 'cancelled') {
                throw new Error(`Run ${run.status}: ${run.last_error?.message || 'Unknown error'}`);
            }

            // Wait before polling again
            await new Promise(resolve => setTimeout(resolve, this.config.pollInterval));
        }

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
    
    // Show initial help message
    setTimeout(() => {
        const chatInstance = new AzureFoundryChat();
        console.log('Azure Foundry Chat Interface Loaded');
        console.log('Agent: ADOTicketAgent (asst_Cabj69cF5rOLCHdSovbzP1fb)');
        console.log('If you see connection errors, this is likely due to CORS restrictions.');
        console.log('The Azure Foundry API requires server-side proxy for browser access.');
    }, 1000);
});

// Handle potential errors
window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
});

window.addEventListener('error', (event) => {
    console.error('Script error:', event.error);
});
