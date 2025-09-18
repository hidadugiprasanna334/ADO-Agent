// Simple test to check server health endpoint
async function testHealthEndpoint() {
    console.log('🩺 Testing health endpoint...');
    
    try {
        const response = await fetch('http://localhost:3000/api/health');
        const data = await response.json();
        
        console.log('✅ Health endpoint response:');
        console.log(JSON.stringify(data, null, 2));
        
        if (data.azure_client === 'initialized') {
            console.log('🎉 Server is ready for connections!');
        } else {
            console.log('⏳ Server is still initializing...');
        }
        
    } catch (error) {
        console.error('❌ Failed to connect to health endpoint:', error.message);
    }
}

// Test immediately and then every 3 seconds
testHealthEndpoint();
setInterval(testHealthEndpoint, 3000);
