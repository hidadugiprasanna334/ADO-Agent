console.log('✅ Node.js is working!');
console.log('⏰ Current time:', new Date().toLocaleString());

const express = require('express');
console.log('✅ Express loaded successfully');

const app = express();
console.log('✅ Express app created');

app.get('/', (req, res) => {
    res.send('Hello World!');
});

const PORT = 3001;
console.log('🔧 About to start server on port', PORT);

const server = app.listen(PORT, () => {
    console.log('🎉 SUCCESS! Server is running on http://localhost:' + PORT);
});

server.on('error', (error) => {
    console.error('❌ Server error:', error.message);
});

console.log('📋 Script completed');
