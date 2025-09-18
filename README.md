# Azure Foundry Agent Chat Interface

A basic web-based chat interface that connects to your Azure Foundry agent using the Azure AI Projects SDK.

## Features

- Clean, modern chat interface
- Real-time connection status
- Message history display
- Loading indicators
- Error handling
- Responsive design

## Setup Instructions

### Prerequisites

- Node.js (version 12 or higher)
- An Azure Foundry agent configured in your Azure subscription

### Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Azure Foundry Agent Configuration:**
   
   Your agent is already configured in `config.js`:
   - **Agent Name**: ADOTicketAgent
   - **Agent ID**: asst_Cabj69cF5rOLCHdSovbzP1fb

   Your Azure Foundry connection details:
   - URL: https://dev-ai-foundry-res-01.services.ai.azure.com/api/projects/dev-ai-foundry-res-prj-01
   - Subscription ID: fc9074eb-8517-4113-bb15-54f9af52417e
   - Resource Group: prasanna-dev
   - Location: eastus

### Running the Application

1. **Start the development server:**
   ```bash
   npm run dev
   ```

2. **Or start without opening browser:**
   ```bash
   npm start
   ```

3. **Open your browser and navigate to:**
   ```
   http://localhost:3000
   ```

## Project Structure

```
├── index.html          # Main HTML file with chat interface
├── style.css           # CSS styling for the chat UI
├── app.js              # JavaScript code for Azure Foundry integration
├── package.json        # Node.js dependencies and scripts
└── README.md           # This file
```

## How It Works

1. **Initialization**: The app initializes the Azure AI Projects client using your API key
2. **Thread Creation**: A conversation thread is created when the app starts
3. **Message Flow**:
   - User types a message and clicks send
   - Message is sent to Azure Foundry agent via `projectClient.agents`
   - The app creates a run and polls for completion
   - Response is displayed in the chat interface

## Key Components

### Azure Integration (`app.js`)

- **AzureFoundryChat class**: Main class handling the chat functionality
- **projectClient.agents**: Used to interact with your Azure Foundry agent
- **API Methods**:
  - `createThread()`: Creates a new conversation thread
  - `createMessage()`: Sends user messages to the agent
  - `createRun()`: Starts agent processing
  - `listMessages()`: Retrieves agent responses

### UI Components

- **Chat Messages Area**: Displays conversation history
- **Input Field**: For typing messages
- **Send Button**: Triggers message sending
- **Connection Status**: Shows real-time connection status
- **Loading Overlay**: Indicates when processing messages

## Customization

### Styling
Modify `style.css` to change the appearance:
- Colors and gradients
- Typography
- Layout and spacing
- Animations

### Functionality
Update `app.js` to add features:
- Message formatting
- File uploads
- Voice input
- Multiple agents

## Troubleshooting

### Common Issues

1. **Connection Failed**
   - Verify your API key is correct
   - Check that your Azure Foundry service is running
   - Ensure the endpoint URL is correct

2. **Agent Communication Issues**
   - Verify that ADOTicketAgent (asst_Cabj69cF5rOLCHdSovbzP1fb) is active
   - Check that the agent exists in your Azure Foundry project

3. **CORS Issues**
   - If running locally, you may need to configure CORS settings
   - Consider using a local server for development

### Debug Mode

Open browser developer tools (F12) to see detailed logs and error messages.

## Security Notes

- API keys are embedded in the client code for simplicity
- For production, consider using Azure AD authentication
- Implement proper error handling for production use
- Use environment variables for sensitive configuration

## License

MIT License - feel free to modify and use as needed.
