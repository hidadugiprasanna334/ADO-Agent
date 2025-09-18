// Azure Endpoint Diagnostic Tool
class AzureEndpointTester {
    constructor() {
        this.apiKey = "YOUR_AZURE_API_KEY_HERE"; // Replace with your actual API key
        this.agentId = "asst_Cabj69cF5rOLCHdSovbzP1fb";
        this.projectName = "dev-ai-foundry-res-prj-01";
        this.resourceName = "dev-ai-foundry-res-01";
    }

    async testEndpoint(baseUrl, description) {
        console.log(`\n🧪 Testing: ${description}`);
        console.log(`🔗 Base URL: ${baseUrl}`);
        
        const testEndpoints = [
            {
                url: `${baseUrl}/openai/assistants/${this.agentId}?api-version=2024-02-15-preview`,
                desc: "Get Assistant (OpenAI format)"
            },
            {
                url: `${baseUrl}/openai/threads?api-version=2024-02-15-preview`,
                desc: "Create Thread (OpenAI format)"
            },
            {
                url: `${baseUrl}/api/projects/${this.projectName}/threads?api-version=2024-05-01-preview`,
                desc: "Create Thread (AI Projects format)"
            }
        ];

        for (const test of testEndpoints) {
            try {
                console.log(`  ➡️  Testing: ${test.desc}`);
                const response = await fetch(test.url, {
                    method: 'GET',
                    headers: {
                        'api-key': this.apiKey,
                        'Content-Type': 'application/json'
                    }
                });

                if (response.ok) {
                    console.log(`  ✅ SUCCESS: ${test.desc} - Status: ${response.status}`);
                    const data = await response.json();
                    console.log(`  📄 Response sample:`, JSON.stringify(data, null, 2).substring(0, 200) + '...');
                    return { success: true, url: test.url, data };
                } else {
                    const errorText = await response.text();
                    console.log(`  ❌ Failed: ${test.desc} - Status: ${response.status}`);
                    console.log(`  📄 Error:`, errorText.substring(0, 200) + '...');
                }
            } catch (error) {
                console.log(`  💥 Exception: ${test.desc} - ${error.message}`);
            }
        }
        return { success: false };
    }

    async runDiagnostics() {
        console.log('🔍 Azure AI Foundry Endpoint Diagnostics');
        console.log('==========================================');
        
        const endpointsToTest = [
            {
                url: `https://${this.resourceName}.openai.azure.com`,
                desc: "Standard Azure OpenAI Format"
            },
            {
                url: `https://${this.resourceName}.services.ai.azure.com`,
                desc: "Azure AI Services Format"
            },
            {
                url: `https://${this.resourceName}.cognitiveservices.azure.com`,
                desc: "Cognitive Services Format"
            },
            {
                url: `https://${this.resourceName}.ai.azure.com`,
                desc: "Azure AI Format"
            }
        ];

        let workingEndpoint = null;
        
        for (const endpoint of endpointsToTest) {
            const result = await this.testEndpoint(endpoint.url, endpoint.desc);
            if (result.success) {
                workingEndpoint = result;
                break;
            }
        }

        if (workingEndpoint) {
            console.log('\n🎉 FOUND WORKING ENDPOINT!');
            console.log('============================');
            console.log('✅ Working URL:', workingEndpoint.url);
            console.log('\n📋 Update your config.js with:');
            console.log(`endpoint: "${workingEndpoint.url.split('/openai')[0].split('/api')[0]}"`);
        } else {
            console.log('\n❌ No working endpoints found');
            console.log('💡 Suggestions:');
            console.log('1. Check if your API key is correct');
            console.log('2. Verify your resource name in Azure portal');
            console.log('3. Ensure the assistant/agent exists');
            console.log('4. Check if the resource is in the correct region');
        }
    }
}

// Auto-run diagnostics when page loads
document.addEventListener('DOMContentLoaded', () => {
    const tester = new AzureEndpointTester();
    tester.runDiagnostics();
});
