// Azure Foundry Configuration
// This file contains the configuration for connecting to your Azure Foundry agent

const AZURE_CONFIG = {
    // Azure AI Studio/Foundry Settings - using correct regional endpoint
    endpoint: "https://eastus.api.cognitive.microsoft.com",
    resourceName: "dev-ai-foundry-res-01",
    deploymentName: "gpt-4", // Update this with your actual deployment name
    projectName: "dev-ai-foundry-res-prj-01",
    apiKey: "YOUR_AZURE_API_KEY_HERE",
    subscriptionId: "fc9074eb-8517-4113-bb15-54f9af52417e",
    resourceGroup: "prasanna-dev",
    location: "eastus",

    // Agent Configuration
    agentName: "ADOTicketAgent",
    agentId: "asst_Cabj69cF5rOLCHdSovbzP1fb",

    // API Settings
    apiVersion: "2024-05-01-preview",
    timeout: 30000, // 30 seconds
    maxRetries: 3,

    // UI Settings
    maxMessageLength: 4000,
    pollInterval: 1000, // Poll every 1 second for run completion
    maxPollAttempts: 30 // Maximum 30 seconds of polling
};

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AZURE_CONFIG;
}
