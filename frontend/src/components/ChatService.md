# ChatService Component

The ChatService component is a reusable wrapper that encapsulates RocketChat, TourManager, and API services into a single component for easy integration into different applications.

## Features

- RocketChat integration with iframe
- Tour/highlight system for guiding users through UI elements
- Connection to backend API for processing messages
- Customizable appearance and behavior

## Installation

Ensure you have the following dependencies in your project:
- react-router-dom
- react-joyride (used by TourManager)

## Usage

### Basic Usage

```jsx
import ChatService from './components/ChatService';

function App() {
  return (
    <div className="App">
      <h1>Your Application</h1>
      {/* Use the ChatService with default settings */}
      <ChatService />
    </div>
  );
}
```

### Advanced Configuration

```jsx
import ChatService from './components/ChatService';

function App() {
  // Configure with custom settings
  const rocketChatConfig = {
    rocketChatHost: 'http://your-rocketchat-server:3001',
    adminUser: 'your-admin-username',
    adminPass: 'your-admin-password',
    roomId: 'YOUR_ROOM_ID'
  };

  return (
    <div className="App">
      <h1>Your Application</h1>
      <ChatService 
        apiBaseUrl="http://your-api-server:8081"
        rocketChatConfig={rocketChatConfig}
        initialChatOpen={true}
        chatToggleLabel="Support"
        chatToggleCloseLabel="Close"
      />
    </div>
  );
}
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `apiBaseUrl` | string | 'http://0.0.0.0:8081' | Base URL for API calls |
| `rocketChatConfig` | object | *see below* | Configuration for RocketChat |
| `initialChatOpen` | boolean | false | Whether chat should be open on initial render |
| `chatToggleLabel` | string | 'Chat' | Label for the chat toggle button when closed |
| `chatToggleCloseLabel` | string | 'X' | Label for the chat toggle button when open |

### Default RocketChat Config

```js
{
  rocketChatHost: process.env.REACT_APP_ROCKET_CHAT_HOST || 'http://localhost:3001',
  adminUser: process.env.REACT_APP_ROCKET_CHAT_USER || 'admin',
  adminPass: process.env.REACT_APP_ROCKET_CHAT_PASS || 'password',
  roomId: 'GENERAL'
}
```

## Environment Variables

You can customize the component's behavior using these environment variables:

```
REACT_APP_ROCKET_CHAT_HOST=http://your-rocketchat-server:3001
REACT_APP_ROCKET_CHAT_USER=admin
REACT_APP_ROCKET_CHAT_PASS=password
```

## API Integration

The component expects your API to have the following endpoints:

- `GET /api/health` - Health check endpoint
- `POST /api/chat` - Endpoint to process chat messages

The chat endpoint should accept a JSON payload with a `message` field and return a response with:
- `message`: The response text to display
- `functionCall` (optional): CSS selector for an element to highlight

## Highlighting UI Elements

To highlight UI elements, have your API return a response with a `functionCall` property containing a CSS selector:

```json
{
  "message": "Click on the Submit button",
  "functionCall": "#submit-button"
}
```

This will activate the TourManager to highlight the element with id "submit-button". 