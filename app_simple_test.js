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
        
        console.log('� Sending message to conversation:', message);
        
        // Add user message to chat
        this.addMessage(message, 'user');
        document.getElementById('messageInput').value = '';
        
        // Show processing message
        const processingId = 'processing-' + Date.now();
        this.addProcessingMessage(processingId);
        
        try {
            // Send message to persistent conversation
            const response = await fetch('http://localhost:3000/api/conversation/message', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: message })
            });
            
            if (!response.ok) {
                throw new Error(`Conversation failed: ${response.status} ${response.statusText}`);
            }
            
            const result = await response.json();
            console.log('🤖 Conversation result:', result);
            
            // Remove processing message
            this.removeProcessingMessage(processingId);
            
            if (result.success && result.agentResponse) {
                // Add agent response to chat
                this.addAgentResponse(result.agentResponse, result.fullResponse);
                
                // Show conversation stats
                console.log(`💭 Conversation now has ${result.conversationHistory.length} messages`);
                this.updateConversationStats(result.conversationHistory.length, result.threadId);
            } else {
                throw new Error('No agent response received');
            }
            
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
    
    updateConversationStats(messageCount, threadId) {
        // Update or create conversation stats display
        let statsDiv = document.getElementById('conversationStats');
        if (!statsDiv) {
            statsDiv = document.createElement('div');
            statsDiv.id = 'conversationStats';
            statsDiv.className = 'conversation-stats';
            
            const chatContainer = document.getElementById('chatMessages').parentElement;
            chatContainer.insertBefore(statsDiv, document.getElementById('chatMessages'));
        }
        
        statsDiv.innerHTML = `
            <div class="stats-content">
                <span class="stats-label">🧵 Conversation Thread:</span>
                <span class="stats-value">${threadId}</span>
                <span class="stats-label">💬 Messages:</span>
                <span class="stats-value">${messageCount}</span>
                <button id="resetConversation" class="reset-button">🔄 New Conversation</button>
            </div>
        `;
        
        // Bind reset button
        document.getElementById('resetConversation').addEventListener('click', () => {
            this.resetConversation();
        });
    }
    
    async resetConversation() {
        try {
            const response = await fetch('http://localhost:3000/api/conversation/reset', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });
            
            if (response.ok) {
                // Clear chat messages
                document.getElementById('chatMessages').innerHTML = '';
                
                // Clear stats
                const statsDiv = document.getElementById('conversationStats');
                if (statsDiv) {
                    statsDiv.remove();
                }
                
                this.addMessage('🔄 Started new conversation. The agent will no longer remember previous messages.', 'system');
                console.log('✅ Conversation reset successfully');
            }
        } catch (error) {
            console.error('❌ Error resetting conversation:', error);
            this.addMessage('❌ Error resetting conversation', 'error');
        }
    }
    
    addAgentResponse(agentResponse, fullResponse) {
        const container = document.getElementById('chatMessages');
        const responseDiv = document.createElement('div');
        responseDiv.className = 'message agent-message';
        
        let displayContent = '';
        let parsedResponse = agentResponse;
        
        // Try to extract JSON from markdown code blocks if needed
        if (typeof agentResponse === 'string' || (fullResponse && typeof fullResponse === 'string')) {
            const responseText = fullResponse || agentResponse;
            console.log('🔍 Parsing response text:', responseText);
            
            // Extract JSON from markdown code blocks: ```json { ... } ```
            const jsonMatch = responseText.match(/```json\s*(\{[\s\S]*?\})\s*```/);
            if (jsonMatch) {
                try {
                    parsedResponse = JSON.parse(jsonMatch[1]);
                    console.log('✅ Extracted JSON from markdown:', parsedResponse);
                } catch (parseError) {
                    console.log('❌ Failed to parse extracted JSON:', parseError);
                    parsedResponse = agentResponse;
                }
            }
        }
        
        // If we have structured response, display it nicely
        if (parsedResponse && typeof parsedResponse === 'object') {
            if (parsedResponse.workItemId || parsedResponse.url) {
                // Final ADO Work Item Success Response
                displayContent = `
                    <div class="final-success-card">
                        <div class="final-success-header">
                            <div class="celebration-icons">
                                <span class="celebration-icon">🎉</span>
                                <span class="celebration-icon">🎫</span>
                                <span class="celebration-icon">✨</span>
                            </div>
                            <div class="final-success-title">Work Item Created Successfully!</div>
                            <div class="final-success-subtitle">Your ticket is now live in Azure DevOps</div>
                        </div>
                        <div class="work-item-details">
                            <div class="work-item-id-section">
                                <div class="work-item-label">Work Item ID</div>
                                <div class="work-item-id">#${parsedResponse.workItemId}</div>
                            </div>
                            <div class="work-item-url-section">
                                <div class="work-item-label">Azure DevOps Link</div>
                                <a href="${parsedResponse.url}" target="_blank" class="work-item-url">
                                    <span class="url-icon">🔗</span>
                                    View in Azure DevOps
                                    <span class="external-icon">↗</span>
                                </a>
                            </div>
                            ${parsedResponse.title ? `<div class="additional-field"><span class="field-label">Title:</span><span class="field-value">${parsedResponse.title}</span></div>` : ''}
                            ${parsedResponse.description ? `<div class="additional-field"><span class="field-label">Description:</span><span class="field-value">${parsedResponse.description}</span></div>` : ''}
                            ${parsedResponse.assignedTo ? `<div class="additional-field"><span class="field-label">Assigned To:</span><span class="field-value">${parsedResponse.assignedTo}</span></div>` : ''}
                            ${parsedResponse.priority ? `<div class="additional-field"><span class="field-label">Priority:</span><span class="field-value">${parsedResponse.priority}</span></div>` : ''}
                            ${parsedResponse.storyPoints ? `<div class="additional-field"><span class="field-label">Story Points:</span><span class="field-value">${parsedResponse.storyPoints}</span></div>` : ''}
                            ${parsedResponse.project ? `<div class="additional-field"><span class="field-label">Project:</span><span class="field-value">${parsedResponse.project}</span></div>` : ''}
                            ${parsedResponse.state ? `<div class="additional-field"><span class="field-label">State:</span><span class="field-value">${parsedResponse.state}</span></div>` : ''}
                            ${parsedResponse.areaPath ? `<div class="additional-field"><span class="field-label">Area Path:</span><span class="field-value">${parsedResponse.areaPath}</span></div>` : ''}
                            ${parsedResponse.iterationPath ? `<div class="additional-field"><span class="field-label">Iteration Path:</span><span class="field-value">${parsedResponse.iterationPath}</span></div>` : ''}
                            ${parsedResponse.acceptanceCriteria ? `<div class="additional-field"><span class="field-label">Acceptance Criteria:</span><span class="field-value">${parsedResponse.acceptanceCriteria}</span></div>` : ''}
                            ${parsedResponse.ticketType ? `<div class="additional-field"><span class="field-label">Ticket Type:</span><span class="field-value">${parsedResponse.ticketType}</span></div>` : ''}
                            ${parsedResponse.message ? `<div class="additional-field"><span class="field-label">Message:</span><span class="field-value">${parsedResponse.message}</span></div>` : ''}
                        </div>
                        <div class="final-success-footer">
                            <div class="success-message">
                                🚀 Your ticket has been successfully created and is ready for the team!
                            </div>
                        </div>
                    </div>
                `;
            } else if (parsedResponse.message) {
                // Check if we have data field (like ticket confirmation)
                if (parsedResponse.data && typeof parsedResponse.data === 'object') {
                    // Show both data and message for confirmation
                    const data = parsedResponse.data;
                    displayContent = `
                        <div class="confirmation-card">
                            <div class="confirmation-header">
                                <div class="confirmation-icon">🎫</div>
                                <div class="confirmation-title">Ticket Draft Ready</div>
                            </div>
                            <div class="ticket-details">
                                ${data.title ? `<div class="detail-row"><span class="detail-label">Title:</span><span class="detail-value">${data.title}</span></div>` : ''}
                                ${data.description ? `<div class="detail-row"><span class="detail-label">Description:</span><span class="detail-value">${data.description}</span></div>` : ''}
                                ${data.assignedTo ? `<div class="detail-row"><span class="detail-label">Assigned To:</span><span class="detail-value">${data.assignedTo}</span></div>` : ''}
                                ${data.priority ? `<div class="detail-row"><span class="detail-label">Priority:</span><span class="detail-value">${data.priority}</span></div>` : ''}
                                ${data.storyPoints ? `<div class="detail-row"><span class="detail-label">Story Points:</span><span class="detail-value">${data.storyPoints}</span></div>` : ''}
                                ${data.areaPath ? `<div class="detail-row"><span class="detail-label">Area Path:</span><span class="detail-value">${data.areaPath}</span></div>` : ''}
                                ${data.iterationPath ? `<div class="detail-row"><span class="detail-label">Iteration Path:</span><span class="detail-value">${data.iterationPath}</span></div>` : ''}
                                ${data.project ? `<div class="detail-row"><span class="detail-label">Project:</span><span class="detail-value">${data.project}</span></div>` : ''}
                                ${data.state ? `<div class="detail-row"><span class="detail-label">State:</span><span class="detail-value">${data.state}</span></div>` : ''}
                                ${data.acceptanceCriteria ? `<div class="detail-row"><span class="detail-label">Acceptance Criteria:</span><span class="detail-value">${data.acceptanceCriteria}</span></div>` : ''}
                            </div>
                            <div class="confirmation-message">
                                <div class="message-icon">🤖</div>
                                <div class="message-text">${parsedResponse.message}</div>
                            </div>
                        </div>
                    `;
                } else if (parsedResponse.status === 'success' && (parsedResponse.title || parsedResponse.intent)) {
                    // Success response with ticket fields directly in the response
                    displayContent = `
                        <div class="success-card">
                            <div class="success-header">
                                <div class="success-icon">✅</div>
                                <div class="success-title">Ticket Created Successfully!</div>
                                ${parsedResponse.ticketType ? `<div class="ticket-type">${parsedResponse.ticketType}</div>` : ''}
                            </div>
                            <div class="ticket-details">
                                ${parsedResponse.title ? `<div class="detail-row"><span class="detail-label">Title:</span><span class="detail-value">${parsedResponse.title}</span></div>` : ''}
                                ${parsedResponse.description ? `<div class="detail-row"><span class="detail-label">Description:</span><span class="detail-value">${parsedResponse.description}</span></div>` : ''}
                                ${parsedResponse.assignedTo ? `<div class="detail-row"><span class="detail-label">Assigned To:</span><span class="detail-value">${parsedResponse.assignedTo}</span></div>` : ''}
                                ${parsedResponse.priority ? `<div class="detail-row"><span class="detail-label">Priority:</span><span class="detail-value">${parsedResponse.priority}</span></div>` : ''}
                                ${parsedResponse.storyPoints ? `<div class="detail-row"><span class="detail-label">Story Points:</span><span class="detail-value">${parsedResponse.storyPoints}</span></div>` : ''}
                                ${parsedResponse.areaPath ? `<div class="detail-row"><span class="detail-label">Area Path:</span><span class="detail-value">${parsedResponse.areaPath}</span></div>` : ''}
                                ${parsedResponse.iterationPath ? `<div class="detail-row"><span class="detail-label">Iteration Path:</span><span class="detail-value">${parsedResponse.iterationPath}</span></div>` : ''}
                                ${parsedResponse.project ? `<div class="detail-row"><span class="detail-label">Project:</span><span class="detail-value">${parsedResponse.project}</span></div>` : ''}
                                ${parsedResponse.state ? `<div class="detail-row"><span class="detail-label">State:</span><span class="detail-value">${parsedResponse.state}</span></div>` : ''}
                                ${parsedResponse.acceptanceCriteria ? `<div class="detail-row"><span class="detail-label">Acceptance Criteria:</span><span class="detail-value">${parsedResponse.acceptanceCriteria}</span></div>` : ''}
                                ${parsedResponse.intent ? `<div class="detail-row"><span class="detail-label">Intent:</span><span class="detail-value">${parsedResponse.intent}</span></div>` : ''}
                            </div>
                        </div>
                    `;
                } else {
                    // Simple message only
                    displayContent = `
                        <div class="message-card">
                            <div class="message-icon">🤖</div>
                            <div class="message-content">
                                ${parsedResponse.message}
                            </div>
                        </div>
                    `;
                }
            } else {
                // Generic object response
                displayContent = `<div class="agent-content"><pre>${JSON.stringify(parsedResponse, null, 2)}</pre></div>`;
            }
        } else {
            // Plain text response
            displayContent = `<div class="agent-content">${fullResponse || 'No response content'}</div>`;
        }
        
        // Always show full response in expandable section
        displayContent += `
            <div class="full-response-section">
                <button class="toggle-full-response" onclick="this.nextElementSibling.style.display = this.nextElementSibling.style.display === 'none' ? 'block' : 'none'">
                    📋 Show Full Response
                </button>
                <div class="full-response-content" style="display: none;">
                    <pre>${fullResponse || 'No full response available'}</pre>
                </div>
            </div>
        `;
        
        responseDiv.innerHTML = displayContent;
        container.appendChild(responseDiv);
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
