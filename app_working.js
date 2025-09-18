class AzureFoundryChat {
    constructor() {
        // UI elements
        this.chatMessages = document.getElementById('chatMessages');
        this.messageInput = document.getElementById('messageInput');
        this.sendButton = document.getElementById('sendButton');
        this.loadingOverlay = document.getElementById('loadingOverlay');
        this.statusIndicator = document.getElementById('statusIndicator');
        this.statusText = document.getElementById('statusText');

        // Chat state
        this.conversationId = 'conv_' + Date.now(); // Simple conversation ID

        this.init();
    }

    async init() {
        try {
            console.log('🚀 Initializing Azure Foundry Chat...');
            console.log('🎯 Using exact working pattern from cardiac agent');

            // Test server connection
            await this.testConnection();

            this.setupEventListeners();
            this.updateConnectionStatus(true, 'Connected');
            this.enableInput();

            console.log('✅ Azure Foundry Chat initialized successfully');
            this.addMessage('Hello! I\'m your ADO Ticket Agent. How can I help you today?', 'agent');
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
        if (!message) return;

        try {
            console.log('\n🗨️  === SENDING MESSAGE ===');
            console.log('📝 User Message:', message);
            console.log('🆔 Conversation ID:', this.conversationId);

            // Disable input while processing
            this.disableInput();
            this.showLoading(true);

            // Add user message to UI
            this.addMessage(message, 'user');
            this.messageInput.value = '';

            // Use the complete chat endpoint that follows the working cardiac agent pattern
            console.log('📤 Calling /api/chat endpoint with working pattern...');
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    message: message,
                    conversationId: this.conversationId
                })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(`API call failed: ${error.error || response.statusText}`);
            }

            const result = await response.json();
            console.log('📥 API Response:', result);

            if (result.success) {
                console.log('✅ Received agent response');
                this.addMessage(result.message, 'agent');
            } else {
                console.log('❌ Agent returned error:', result.error);
                this.addMessage(result.message || 'Sorry, I encountered an error processing your request.', 'agent');
            }

            console.log('🗨️  === MESSAGE SENT SUCCESSFULLY ===\n');

        } catch (error) {
            console.log('💥 === MESSAGE SENDING FAILED ===');
            console.error('❌ Error sending message:', error);
            this.showError('Failed to send message: ' + error.message);
            this.addMessage('Sorry, I encountered an error while processing your message. Please try again.', 'agent');
        } finally {
            this.showLoading(false);
            this.enableInput();
        }
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
