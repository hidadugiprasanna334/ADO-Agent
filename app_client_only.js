class AzureFoundryChat {
    constructor() {
        // UI elements
        this.chatMessages = document.getElementById('chatMessages');
        this.messageInput = document.getElementById('messageInput');
        this.sendButton = document.getElementById('sendButton');
        this.loadingOverlay = document.getElementById('loadingOverlay');
        this.statusIndicator = document.getElementById('statusIndicator');
        this.statusText = document.getElementById('statusText');

        this.init();
    }

    async init() {
        try {
            console.log('🚀 Initializing Client-Side ADO Ticket Agent...');

            this.setupEventListeners();
            this.updateConnectionStatus(true, 'Ready (Client-Side Mode)');
            this.enableInput();

            console.log('✅ ADO Ticket Agent initialized successfully');
            this.addMessage('Hello! I\'m your ADO Ticket Agent. I can help you with Azure DevOps work items, tickets, bugs, user stories, and project management. How can I assist you today?', 'agent');
        } catch (error) {
            console.error('❌ Initialization failed:', error);
            this.updateConnectionStatus(false, 'Initialization failed');
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
            console.log('🗨️  Processing message:', message);

            // Disable input while processing
            this.disableInput();
            this.showLoading(true);

            // Add user message to UI
            this.addMessage(message, 'user');
            this.messageInput.value = '';

            // Simulate processing time
            await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));

            // Generate contextual ADO response
            const response = this.generateADOResponse(message);
            this.addMessage(response, 'agent');

            console.log('✅ Message processed successfully');

        } catch (error) {
            console.error('❌ Error processing message:', error);
            this.addMessage('I apologize, but I encountered an error processing your message. Please try again.', 'agent');
        } finally {
            this.showLoading(false);
            this.enableInput();
        }
    }

    generateADOResponse(message) {
        const lowerMessage = message.toLowerCase();
        
        // Create contextual responses based on message content
        if (lowerMessage.includes('create') || lowerMessage.includes('new')) {
            return `I can help you create new work items in Azure DevOps. Based on your request "${message}", I would typically:

• Create a work item with the appropriate type (User Story, Bug, Task, Feature, etc.)
• Set the title, description, and acceptance criteria
• Assign it to the appropriate team member
• Set the area path and iteration
• Add relevant tags and labels

Would you like me to help you specify the details for this new work item?`;
        }
        
        if (lowerMessage.includes('update') || lowerMessage.includes('modify') || lowerMessage.includes('change')) {
            return `I can assist with updating existing work items. For "${message}", I can help you:

• Modify work item fields (title, description, state, assigned to)
• Update story points or effort estimates
• Change iteration or area path
• Add comments or attachments
• Update custom fields

Please provide the work item ID or title you'd like to update, and specify what changes you need.`;
        }
        
        if (lowerMessage.includes('bug') || lowerMessage.includes('issue') || lowerMessage.includes('defect')) {
            return `I can help you manage bugs and issues in Azure DevOps. Regarding "${message}", I would:

• Create a bug work item with detailed information
• Set appropriate severity and priority levels
• Add reproduction steps and environment details
• Assign to the responsible developer or team
• Link to related user stories or features
• Track resolution progress

What specific bug or issue would you like me to help you document?`;
        }
        
        if (lowerMessage.includes('sprint') || lowerMessage.includes('iteration') || lowerMessage.includes('backlog')) {
            return `I can assist with sprint and backlog management. For "${message}", I can help you:

• Plan sprint capacity and assign work items
• Monitor sprint progress and burndown
• Move items between sprints
• Generate sprint reports and metrics
• Manage backlog prioritization
• Track team velocity

Which specific sprint management task do you need help with?`;
        }
        
        if (lowerMessage.includes('query') || lowerMessage.includes('search') || lowerMessage.includes('find') || lowerMessage.includes('list')) {
            return `I can help you query and search work items in Azure DevOps. Based on "${message}", I can construct WIQL queries to find:

• Work items by state, assigned user, or area path
• Items created or modified within date ranges
• Work items with specific tags or custom field values
• Related items (parent/child relationships)
• Items in specific iterations or releases

What specific work items are you looking for? Please provide your search criteria.`;
        }
        
        if (lowerMessage.includes('report') || lowerMessage.includes('dashboard') || lowerMessage.includes('metrics')) {
            return `I can help with Azure DevOps reporting and analytics. For "${message}", I can assist with:

• Creating custom dashboards and widgets
• Generating burndown and velocity charts
• Work item state transition reports
• Team productivity metrics
• Sprint completion analysis
• Custom KPI tracking

What type of report or metrics would you like me to help you create?`;
        }
        
        if (lowerMessage.includes('user story') || lowerMessage.includes('story') || lowerMessage.includes('feature')) {
            return `I can help you manage user stories and features. Regarding "${message}", I would:

• Help define user story acceptance criteria
• Break down epics into manageable stories
• Estimate story points and effort
• Link stories to features and themes
• Track story progress through development
• Manage story dependencies

What user story or feature would you like me to help you with?`;
        }
        
        // Default response for general queries
        return `Thank you for your message: "${message}". 

I'm your ADO Ticket Agent, specialized in Azure DevOps operations. I can help you with:

🎯 **Work Item Management**
• Creating and updating tickets, bugs, user stories
• Managing work item states and assignments
• Setting up custom fields and workflows

📊 **Project Planning**
• Sprint planning and backlog management
• Capacity planning and resource allocation
• Progress tracking and reporting

🔍 **Queries & Reporting**
• Creating WIQL queries for work item searches
• Building custom dashboards and widgets
• Generating project metrics and analytics

💼 **Process Management**
• Configuring team processes and templates
• Setting up area paths and iterations
• Managing team permissions and access

How specifically can I assist you with your Azure DevOps needs today?`;
    }

    addMessage(content, type) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type}-message`;

        const messageContent = document.createElement('div');
        messageContent.className = 'message-content';
        
        // Handle multiline content
        messageContent.innerHTML = content.replace(/\n/g, '<br>');

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
