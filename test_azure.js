const { AIProjectClient } = require('@azure/ai-projects');
const { AzureKeyCredential } = require('@azure/core-auth');

console.log('Testing Azure AI Projects SDK...');

const endpoint = "https://dev-ai-foundry-res-01.services.ai.azure.com";
const apiKey = "YOUR_AZURE_API_KEY_HERE";

async function testConnection() {
    try {
        console.log('Creating credential...');
        const credential = new AzureKeyCredential(apiKey);
        
        console.log('Creating project client...');
        const project = new AIProjectClient(endpoint, credential);
        
        console.log('Getting Azure OpenAI client...');
        const projectClient = await project.getAzureOpenAIClient({
            apiVersion: "2024-12-01-preview"
        });
        
        console.log('✅ Success! Client initialized.');
        
        // Test a simple operation
        console.log('Testing thread creation...');
        const thread = await projectClient.beta.threads.create();
        console.log('✅ Thread created:', thread.id);
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error('Stack:', error.stack);
    }
}

testConnection();
