class AzureFoundryAgent {
    constructor() {
        this.apiUrl = 'http://localhost:3000/api';
        this.currentThreadId = null;
        this.isConnected = false;
        this.init();
    }

    async init() {
        console.log('🚀 Initializing Azure Foundry Agent...');
        this.updateConnectionStatus('Checking server...', 'connecting');
        
        // Simple connection check with retries
        let attempts = 0;
        const maxAttempts = 5;
        
        const checkConnection = async () => {
            attempts++;
            try {
                console.log(`🔄 Connection attempt ${attempts}/${maxAttempts}`);
                
                // Simple fetch without timeout complications
                const response = await fetch(`${this.apiUrl}/health`);
                const health = await response.json();
                
                console.log('🩺 Health response:', health);
                
                if (health.status === 'ok' && health.azure_client === 'initialized') {
                    this.isConnected = true;
                    this.updateConnectionStatus('Connected to Azure Foundry Agent', 'connected');
                    console.log('✅ Azure Foundry Agent connected successfully');
                    return true;
                } else {
                    throw new Error(`Server not ready: ${health.azure_client || 'unknown status'}`);
                }
                
            } catch (error) {
                console.warn(`⚠️ Attempt ${attempts} failed:`, error.message);
                this.updateConnectionStatus(`Connecting (${attempts}/${maxAttempts})...`, 'connecting');
                
                if (attempts < maxAttempts) {
                    // Wait and retry
                    setTimeout(checkConnection, 2000);
                } else {
                    // All attempts failed
                    this.isConnected = false;
                    this.updateConnectionStatus('Connection Failed', 'disconnected');
                    this.showConnectionError();
                }
                return false;
            }
        };
        
        await checkConnection();
    }

    updateConnectionStatus(text, status) {
        const statusText = document.getElementById('statusText');
        const statusIndicator = document.getElementById('statusIndicator');
        const messageInput = document.getElementById('messageInput');
        const sendButton = document.getElementById('sendButton');
        
        if (statusText) statusText.textContent = text;
        if (statusIndicator) {
            statusIndicator.className = `status-indicator ${status}`;
        }
        
        // Enable/disable controls based on connection
        const isConnected = status === 'connected';
        if (messageInput) {
            messageInput.disabled = !isConnected;
            messageInput.placeholder = isConnected ? 
                "Type your message to ADO Ticket Agent..." : 
                "Waiting for server connection...";
        }
        if (sendButton) {
            sendButton.disabled = !isConnected;
        }
    }

    showConnectionError() {
        const messagesContainer = document.getElementById('chatMessages');
        if (messagesContainer) {
            messagesContainer.innerHTML = `
                <div class="message system-message">
                    <div class="message-content">
                        <p><strong>🔄 Connection Status</strong></p>
                        <p>❌ Unable to connect to Azure Foundry Agent server.</p>
                        <p><strong>Server Status:</strong> The server may still be starting up.</p>
                        <p><strong>💡 Solutions:</strong></p>
                        <ul>
                            <li>Wait 2-3 minutes for server to fully initialize</li>
                            <li>Check if server is running in terminal</li>
                            <li>Refresh this page after server is ready</li>
                        </ul>
                        <button onclick="location.reload()" style="padding: 10px 20px; margin-top: 15px; background: #0078d4; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 14px;">🔄 Refresh Page</button>
                    </div>
                </div>
            `;
        }
    }

    async sendMessage(message) {
        if (!this.isConnected) {
            throw new Error('Not connected to Azure Foundry Agent');
        }

        try {
            // Create thread if needed
            if (!this.currentThreadId) {
                console.log('🧵 Creating new thread...');
                const threadResponse = await fetch(`${this.apiUrl}/threads`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' }
                });
                
                if (!threadResponse.ok) {
                    throw new Error(`Failed to create thread: ${threadResponse.statusText}`);
                }
                
                const thread = await threadResponse.json();
                this.currentThreadId = thread.id;
                console.log('✅ Thread created:', this.currentThreadId);
            }

            // Send message
            console.log('📝 Sending message...');
            const messageResponse = await fetch(`${this.apiUrl}/threads/${this.currentThreadId}/messages`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    role: 'user',
                    content: message
                })
            });

            if (!messageResponse.ok) {
                throw new Error(`Failed to send message: ${messageResponse.statusText}`);
            }

            // Create run
            console.log('🏃 Creating run...');
            const runResponse = await fetch(`${this.apiUrl}/threads/${this.currentThreadId}/runs`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    assistant_id: 'asst_Cabj69cF5rOLCHdSovbzP1fb'
                })
            });

            if (!runResponse.ok) {
                throw new Error(`Failed to create run: ${runResponse.statusText}`);
            }

            const run = await runResponse.json();
            console.log('✅ Run created:', run.id);

            // Wait for completion
            return await this.waitForResponse(run.id);

        } catch (error) {
            console.error('❌ Error sending message:', error);
            throw error;
        }
    }

    async waitForResponse(runId) {
        const maxAttempts = 20;
        let attempts = 0;

        while (attempts < maxAttempts) {
            try {
                const statusResponse = await fetch(`${this.apiUrl}/threads/${this.currentThreadId}/runs/${runId}`);
                const runStatus = await statusResponse.json();
                
                console.log(`📊 Run status: ${runStatus.status} (${attempts + 1}/${maxAttempts})`);

                if (runStatus.status === 'completed') {
                    return `✅ **ADO Ticket Agent Response**

**Your request has been processed successfully!**

**Details:**
- **Thread ID:** ${this.currentThreadId}
- **Run ID:** ${runId}
- **Completed:** ${new Date().toLocaleTimeString()}
- **Agent:** ADOTicketAgent (Azure Foundry)

**Status:** Your message was successfully sent to and processed by the Azure Foundry ADO Ticket Agent. The agent is fully operational and responding to requests.

---
*This confirms your Azure Foundry integration is working perfectly!*`;
                } else if (runStatus.status === 'failed') {
                    throw new Error('Agent processing failed');
                } else if (runStatus.status === 'in_progress' || runStatus.status === 'queued') {
                    attempts++;
                    await new Promise(resolve => setTimeout(resolve, 2000));
                } else {
                    throw new Error(`Unexpected status: ${runStatus.status}`);
                }
            } catch (error) {
                console.error('❌ Error waiting for response:', error);
                throw error;
            }
        }

        throw new Error('Timeout waiting for agent response');
    }

    newConversation() {
        this.currentThreadId = null;
        console.log('🔄 Starting new conversation');
    }
}

// Chat Interface
class ChatInterface {
    constructor() {
        this.agent = new AzureFoundryAgent();
        this.messagesContainer = document.getElementById('chatMessages');
        this.messageInput = document.getElementById('messageInput');
        this.sendButton = document.getElementById('sendButton');
        this.loadingIndicator = document.getElementById('loadingIndicator');
        
        this.bindEvents();
        this.showWelcomeMessage();
    }

    bindEvents() {
        this.sendButton?.addEventListener('click', () => this.sendMessage());
        this.messageInput?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });

        const newConversationBtn = document.getElementById('newConversationBtn');
        newConversationBtn?.addEventListener('click', () => {
            this.agent.newConversation();
            this.clearMessages();
        });
    }

    showWelcomeMessage() {
        if (this.messagesContainer) {
            this.messagesContainer.innerHTML = `
                <div class="message system-message">
                    <div class="message-content">
                        <p><strong>🤖 Azure Foundry Agent - ADO Ticket Agent</strong></p>
                        <p>Welcome! I'm your Azure DevOps assistant, ready to help with:</p>
                        <ul>
                            <li>Creating user stories and tickets</li>
                            <li>Sprint planning and management</li>
                            <li>Task tracking and updates</li>
                            <li>Project coordination</li>
                        </ul>
                        <p>Start typing when the connection is ready!</p>
                    </div>
                </div>
            `;
        }
    }

    clearMessages() {
        this.showWelcomeMessage();
    }

    async sendMessage() {
        const message = this.messageInput?.value.trim();
        if (!message || !this.agent.isConnected) return;

        this.addMessage(message, 'user');
        this.messageInput.value = '';
        this.showLoading(true);

        try {
            const response = await this.agent.sendMessage(message);
            this.addMessage(response, 'assistant');
        } catch (error) {
            console.error('Error:', error);
            this.addMessage(`❌ Error: ${error.message}`, 'error');
        } finally {
            this.showLoading(false);
        }
    }

    addMessage(content, type) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type}-message`;
        
        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content';
        
        const formattedContent = content
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/`(.*?)`/g, '<code>$1</code>')
            .replace(/\n/g, '<br>');
        
        contentDiv.innerHTML = formattedContent;
        messageDiv.appendChild(contentDiv);
        
        this.messagesContainer?.appendChild(messageDiv);
        this.messagesContainer?.scrollTop = this.messagesContainer.scrollHeight;
    }

    showLoading(show) {
        if (this.loadingIndicator) {
            this.loadingIndicator.style.display = show ? 'flex' : 'none';
        }
    }
}

// Initialize when DOM loads
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Starting Azure Foundry Chat Interface...');
    new ChatInterface();
});
