// Very simple Azure Foundry client for testing
class SimpleAzureClient {
    constructor() {
        this.connected = false;
        this.init();
    }
    
    async init() {
        console.log('🔄 Simple connection test...');
        document.getElementById('statusText').textContent = 'Testing connection...';
        
        // Test connection every 3 seconds until success
        const testConnection = async () => {
            try {
                console.log('🩺 Checking health...');
                const response = await fetch('http://localhost:3000/api/health');
                const data = await response.json();
                
                console.log('📊 Health data:', data);
                
                if (data.status === 'ok' && data.azure_client === 'initialized') {
                    this.connected = true;
                    document.getElementById('statusText').textContent = 'Connected to Azure Foundry Agent';
                    document.getElementById('statusIndicator').className = 'status-indicator connected';
                    document.getElementById('messageInput').disabled = false;
                    document.getElementById('sendButton').disabled = false;
                    document.getElementById('messageInput').placeholder = 'Type your message to InputUnderstandingAgent...';
                    console.log('✅ Connection successful!');
                    return true;
                } else {
                    throw new Error(`Not ready: ${data.azure_client}`);
                }
                
            } catch (error) {
                console.log('⏳ Still connecting:', error.message);
                document.getElementById('statusText').textContent = 'Connecting to server...';
                
                // Try again in 3 seconds
                setTimeout(testConnection, 3000);
                return false;
            }
        };
        
        await testConnection();
    }
    
    async sendTestMessage() {
        if (!this.connected) {
            alert('Not connected yet!');
            return;
        }
        
        const message = document.getElementById('messageInput').value.trim();
        if (!message) return;
        
        console.log('📝 Sending message:', message);
        
        // Add user message to chat
        this.addMessage(message, 'user');
        document.getElementById('messageInput').value = '';
        
        // Show processing message
        const processingId = 'processing-' + Date.now();
        this.addProcessingMessage(processingId);
        
        try {
            // Create thread
            const threadResponse = await fetch('http://localhost:3000/api/threads', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });
            const thread = await threadResponse.json();
            console.log('🧵 Thread:', thread.id);
            
            // Send message
            await fetch(`http://localhost:3000/api/threads/${thread.id}/messages`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ role: 'user', content: message })
            });
            
            // Create run
            const runResponse = await fetch(`http://localhost:3000/api/threads/${thread.id}/runs`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ assistant_id: 'asst_z6VW8C4AvFgj54g4EPzazeBu' })  // InputUnderstandingAgent
            });
            
            if (!runResponse.ok) {
                throw new Error(`Run creation failed: ${runResponse.status} ${runResponse.statusText}`);
            }
            
            const run = await runResponse.json();
            console.log('🏃 Full Run Response:', run);
            
            // Validate run object
            if (!run || !run.id) {
                console.error('❌ Invalid run object received:', run);
                throw new Error('Run creation failed - no valid run ID received');
            }
            
            console.log('✅ Valid Run ID:', run.id);
            
            // Wait for completion and get the actual response (processing message will be removed in waitForAgentResponse)
            await this.waitForAgentResponse(thread.id, run.id, processingId);
            
        } catch (error) {
            console.error('❌ Error:', error);
            this.removeProcessingMessage(processingId);
            this.addMessage(`❌ Error: ${error.message}`, 'error');
        }
    }
    
    addProcessingMessage(id) {
        const container = document.getElementById('chatMessages');
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message assistant-message processing';
        messageDiv.id = id;
        messageDiv.innerHTML = `
            <div class="message-content">
                <div class="processing-card">
                    <div class="processing-spinner"></div>
                    <div class="processing-text">
                        <h4>🤖 InputUnderstandingAgent is working...</h4>
                        <p>Processing your request</p>
                        <div class="processing-dots">
                            <span>.</span><span>.</span><span>.</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
        container.appendChild(messageDiv);
        container.scrollTop = container.scrollHeight;
    }
    
    removeProcessingMessage(id) {
        const element = document.getElementById(id);
        if (element) {
            element.remove();
        }
    }
    
    async waitForAgentResponse(threadId, runId, processingId) {
        const maxAttempts = 30;
        let attempts = 0;
        
        while (attempts < maxAttempts) {
            try {
                await new Promise(resolve => setTimeout(resolve, 2000));
                
                const statusResponse = await fetch(`http://localhost:3000/api/threads/${threadId}/runs/${runId}`);
                const runData = await statusResponse.json();
                
                console.log(`📊 Enhanced run status: ${runData.runStatus} (${attempts + 1}/${maxAttempts})`);
                console.log('📋 Full run data:', runData);
                
                if (runData.runStatus === 'completed') {
                    // Remove processing message now that we have a response
                    this.removeProcessingMessage(processingId);
                    
                    // Use the enhanced response that already contains the agent output
                    if (runData.hasOutput && runData.fullResponse) {
                        console.log('✅ Using enhanced server response with agent output');
                        this.parseAndDisplayAgentResponse(runData.fullResponse, threadId, runId, runData.output);
                    } else if (runData.fullResponse) {
                        console.log('📝 Using full response without parsed output');
                        this.parseAndDisplayAgentResponse(runData.fullResponse, threadId, runId);
                    } else {
                        console.log('⚠️ No agent output found, showing completion card');
                        this.addCompletionCard(threadId, runId);
                    }
                    return;
                    
                } else if (runData.runStatus === 'failed') {
                    // Remove processing message on failure
                    this.removeProcessingMessage(processingId);
                    this.addMessage(`❌ Azure Foundry Agent processing failed`, 'error');
                    return;
                } else if (runStatus.status === 'in_progress' || runStatus.status === 'queued') {
                    attempts++;
                } else {
                    // Remove processing message on unexpected status
                    this.removeProcessingMessage(processingId);
                    this.addMessage(`⚠️ Unexpected status: ${runStatus.status}`, 'error');
                    return;
                }
                
            } catch (error) {
                console.error('Error waiting for response:', error);
                attempts++;
            }
        }
        
        // Remove processing message on timeout
        this.removeProcessingMessage(processingId);
        this.addMessage('⏰ Timeout waiting for Azure Foundry agent response', 'error');
    }
    
    parseAndDisplayAgentResponse(response, threadId, runId, preParseOutput = null) {
        console.log('🔍 FULL AGENT RESPONSE:');
        console.log('=====================================');
        console.log(response);
        console.log('=====================================');
        console.log('📊 Response Length:', response.length);
        console.log('🧵 Thread ID:', threadId);
        console.log('🏃 Run ID:', runId);
        console.log('🎯 Pre-parsed Output:', preParseOutput);
        console.log('=====================================');
        
        let adoData = preParseOutput; // Use server-side parsed data if available
        
        // If no pre-parsed data, try to parse it client-side
        if (!adoData) {
            // Look for JSON response pattern
            const jsonMatch = response.match(/```json\s*({[\s\S]*?})\s*```/);
            
            if (jsonMatch) {
                try {
                    adoData = JSON.parse(jsonMatch[1]);
                    console.log('📋 Client-side parsed ADO data:', adoData);
                } catch (parseError) {
                    console.log('❌ Client-side JSON parsing error:', parseError);
                    console.log('🔄 Showing full response instead');
                }
            }
            
            // If still no data, look for work item ID and URL patterns
            if (!adoData) {
                const workItemMatch = response.match(/workItemId["\s:]*["']?(\d+)["']?/i);
                const urlMatch = response.match(/(https:\/\/dev\.azure\.com\/[^\s"']+)/);
                
                if (workItemMatch || urlMatch) {
                    adoData = {
                        status: 'success',
                        workItemId: workItemMatch ? workItemMatch[1] : 'Unknown',
                        url: urlMatch ? urlMatch[1] : null
                    };
                    console.log('🔍 Client-side extracted ADO data from text:', adoData);
                }
            }
        } else {
            console.log('✅ Using server-side parsed ADO data:', adoData);
        }
        
        // Check if response contains error information
        const isError = response.toLowerCase().includes('error') || 
                       response.toLowerCase().includes('failed') || 
                       response.toLowerCase().includes('exception') ||
                       (adoData && adoData.status && adoData.status !== 'success');
        
        if (isError) {
            console.log('⚠️ Error detected in response');
            this.addFullResponseCard(adoData, response, threadId, runId, true);
        } else {
            console.log('✅ Success response detected');
            this.addFullResponseCard(adoData, response, threadId, runId, false);
        }
    }
    
    addFullResponseCard(adoData, fullResponse, threadId, runId, isError = false) {
        const container = document.getElementById('chatMessages');
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message assistant-message';
        
        const statusIcon = isError ? '❌' : (adoData?.status === 'success' ? '✅' : '📝');
        const statusText = isError ? 'Error' : (adoData?.status || 'Response');
        const statusClass = isError ? 'error' : (adoData?.status === 'success' ? 'success' : 'info');
        
        // Format the full response for display
        const formattedResponse = fullResponse
            .replace(/\n/g, '<br>')
            .replace(/```json/g, '<strong>```json</strong>')
            .replace(/```/g, '<strong>```</strong>')
            .replace(/(\{[^}]*\})/g, '<code>$1</code>');
        
        messageDiv.innerHTML = `
            <div class="message-content">
                <div class="ado-ticket-card ${statusClass}">
                    <div class="card-header">
                        <div class="status-badge ${statusClass}">
                            <span class="status-icon">${statusIcon}</span>
                            <span class="status-text">Status: ${statusText}</span>
                        </div>
                        <div class="card-title">
                            <h3>🤖 Azure Foundry Agent Response</h3>
                        </div>
                    </div>
                    
                    <div class="card-content">
                        ${adoData ? `
                        <div class="work-item-info">
                            <h4>📋 Extracted Information:</h4>
                            <div class="info-row">
                                <span class="info-label">WorkItemId:</span>
                                <span class="info-value work-item-id">${adoData.workItemId || 'N/A'}</span>
                            </div>
                            
                            ${adoData.url ? `
                            <div class="info-row">
                                <span class="info-label">URL:</span>
                                <a href="${adoData.url}" target="_blank" class="ado-link">
                                    <span class="link-text">${adoData.url}</span>
                                    <span class="external-icon">🔗</span>
                                </a>
                            </div>` : `
                            <div class="info-row">
                                <span class="info-label">URL:</span>
                                <span class="info-value">N/A</span>
                            </div>`}
                        </div>
                        <hr style="margin: 15px 0; border: 1px solid #eee;">
                        ` : ''}
                        
                        <div class="full-response-section">
                            <h4>📄 Complete Agent Response:</h4>
                            <div class="response-content" style="background: #f8f9fa; padding: 15px; border-radius: 8px; border-left: 4px solid ${statusClass === 'success' ? '#28a745' : statusClass === 'error' ? '#dc3545' : '#007bff'}; font-family: monospace; white-space: pre-wrap; max-height: 400px; overflow-y: auto;">
${fullResponse}
                            </div>
                        </div>
                        
                        <div class="response-meta" style="margin-top: 15px; padding: 10px; background: #f1f3f4; border-radius: 6px; font-size: 0.9em;">
                            <div><strong>Thread ID:</strong> ${threadId}</div>
                            <div><strong>Run ID:</strong> ${runId}</div>
                            <div><strong>Response Length:</strong> ${fullResponse.length} characters</div>
                            <div><strong>Timestamp:</strong> ${new Date().toLocaleString()}</div>
                        </div>
                        
                        ${adoData?.url ? `
                        <div class="card-actions" style="margin-top: 15px;">
                            <button onclick="window.open('${adoData.url}', '_blank')" class="primary-button">
                                <span>📋 Open Work Item in New Tab</span>
                            </button>
                        </div>` : ''}
                    </div>
                    
                    <div class="card-footer">
                        <span class="agent-info">🤖 Full Response from InputUnderstandingAgent</span>
                    </div>
                </div>
            </div>
        `;
        
        container.appendChild(messageDiv);
        container.scrollTop = container.scrollHeight;
    }

    // Keep the old method for backwards compatibility
    addAdoTicketCard(adoData, fullResponse, threadId, runId) {
        this.addFullResponseCard(adoData, fullResponse, threadId, runId);
    }
    
    addAgentResponseCard(response, threadId, runId) {
        const container = document.getElementById('chatMessages');
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message assistant-message';
        
        messageDiv.innerHTML = `
            <div class="message-content">
                <div class="agent-response-card">
                    <div class="card-header">
                        <h3>🤖 InputUnderstandingAgent Response</h3>
                    </div>
                    <div class="card-content">
                        <div class="response-text">${response.replace(/\n/g, '<br>')}</div>
                        <div class="response-meta">
                            <div class="meta-item">Thread: ${threadId}</div>
                            <div class="meta-item">Run: ${runId}</div>
                            <div class="meta-item">Time: ${new Date().toLocaleString()}</div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        container.appendChild(messageDiv);
        container.scrollTop = container.scrollHeight;
    }
    
    addCompletionCard(threadId, runId) {
        this.addMessage(`
            <div class="completion-card">
                <h4>✅ Request Completed Successfully</h4>
                <p><strong>Status:</strong> The InputUnderstandingAgent has processed your request.</p>
            </div>
        `, 'assistant');
    }
    
    addMessage(content, type) {
        const container = document.getElementById('chatMessages');
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type}-message`;
        messageDiv.innerHTML = `<div class="message-content">${content.replace(/\n/g, '<br>')}</div>`;
        container.appendChild(messageDiv);
        container.scrollTop = container.scrollHeight;
    }
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Initializing simple Azure client...');
    const client = new SimpleAzureClient();
    
    // Bind send button
    document.getElementById('sendButton').addEventListener('click', () => {
        client.sendTestMessage();
    });
    
    document.getElementById('messageInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            client.sendTestMessage();
        }
    });
});
