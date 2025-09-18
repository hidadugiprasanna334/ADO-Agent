const express = require('express');
const cors = require('cors');
const path = require('path');

// Add fetch polyfill for Node.js versions that don't have it built-in
if (!global.fetch) {
    global.fetch = require('node-fetch');
}

const app = express();
const PORT = 3000;

// Enable CORS for all routes
app.use(cors());
app.use(express.json());

// Serve static files
app.use(express.static(path.join(__dirname)));

// Azure Foundry configuration
const AZURE_CONFIG = {
    endpoint: "https://dev-ai-foundry-res-01.services.ai.azure.com",
    apiKey: "YOUR_AZURE_API_KEY_HERE", // Replace with your actual API key
    apiVersion: "2024-05-01-preview"
};

// Proxy endpoint for Azure API calls
app.all('/api/azure/*', async (req, res) => {
    try {
        const azurePath = req.params[0];
        const url = `${AZURE_CONFIG.endpoint}/openai/${azurePath}?api-version=${AZURE_CONFIG.apiVersion}`;
        
        console.log(`Proxying ${req.method} request to: ${url}`);
        
        const options = {
            method: req.method,
            headers: {
                'Content-Type': 'application/json',
                'api-key': AZURE_CONFIG.apiKey
            }
        };
        
        if (req.body && Object.keys(req.body).length > 0) {
            options.body = JSON.stringify(req.body);
            console.log('Request body:', JSON.stringify(req.body, null, 2));
        }
        
        const response = await fetch(url, options);
        const data = await response.json();
        
        if (!response.ok) {
            console.error('Azure API error:', data);
            return res.status(response.status).json(data);
        }
        
        console.log('Azure API response:', data);
        res.json(data);
        
    } catch (error) {
        console.error('Proxy error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`Azure Foundry Chat Server running at http://localhost:${PORT}`);
    console.log('Agent: ADOTicketAgent');
    console.log('Agent ID: asst_Cabj69cF5rOLCHdSovbzP1fb');
});
