# ChatService Component

The ChatService component is a reusable wrapper that encapsulates RocketChat, TourManager, and API services into a single component for easy integration into different applications.

## Directory Structure

```
ChatService/
├── api/                      # API services
│   ├── ApiService.js         # Backend API integration
│   └── RocketChatService.js  # RocketChat API integration
├── components/               # Child components
│   └── TourManager.js        # UI element highlighting functionality
├── styles/                   # Component styles
│   ├── RocketChat.css        # Chat service styles
│   └── TourManager.css       # Tour functionality styles
├── ChatService.js            # Main component implementation
├── index.js                  # Main exports
└── README.md                 # Documentation
```

## Features

- RocketChat integration with iframe
- Tour/highlight system for guiding users through UI elements
- Connection to backend API for processing messages
- Customizable appearance and behavior
- Modular code structure for maintainability
- Non-persistent chat for privacy - history doesn't persist between sessions
- System messages are hidden for cleaner UI

## Installation

1. Copy the `ChatService` directory to your project's components folder
2. Ensure you have the following dependencies in your project:
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
        clearHistoryOnNewSession={true}
      />
    </div>
  );
}
```

### Using Individual Components

You can also use the individual components and services directly:

```jsx
import { TourManager } from './components/ChatService';
import { callGepeto, sendRocketChatMessage } from './components/ChatService';

// Use TourManager independently
function MyComponent() {
  return (
    <TourManager 
      highlightClass="#element-to-highlight"
      onElementClick={handleClick}
      onTourComplete={handleComplete}
    />
  );
}

// Use API services independently
async function sendMessage(message) {
  const response = await callGepeto(message, 'http://api-url');
  // ...
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
| `shouldResetChatOnMount` | boolean | false | Whether to reset chat when component mounts |
| `clearHistoryOnNewSession` | boolean | true | Chat history won't persist between sessions |

### Default RocketChat Config

```js
{
  rocketChatHost: process.env.REACT_APP_ROCKET_CHAT_HOST || 'http://localhost:3001',
  adminUser: process.env.REACT_APP_ROCKET_CHAT_USER || 'admin',
  adminPass: process.env.REACT_APP_ROCKET_CHAT_PASS || 'password',
  roomId: 'GENERAL'
}
```

## Chat History and Privacy

By default, the ChatService component is configured to not persist chat history between sessions. Each time a user opens the chat or refreshes the page, a completely fresh session is created with:

1. A unique URL parameter with timestamp to prevent caching
2. Clearing of RocketChat-related storage items
3. Complete iframe remount

System messages like "New chat session started" are also automatically hidden for a cleaner UI experience.

## TourManager Integration

The ChatService component can highlight UI elements based on responses from the backend. This is useful for creating guided tours of your application.

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

## Session Handling

The component now uses a completely stateless approach to chat sessions, ensuring no chat history persists between sessions:

- A fresh chat session is created:
  - On initial load (when the application starts)
  - Every time the chat is opened (by clicking the chat button)
  - When the page is refreshed

This is implemented by adding a unique timestamp to the iframe URL, which forces RocketChat to create a completely fresh session each time. This approach ensures that:

1. No chat history persists between sessions
2. Messages are not stored or retrieved from previous sessions
3. Each user interaction starts with a clean slate

If you want to persist chat history, you can set `clearHistoryOnNewSession` to `false`, but this is not recommended as it may lead to inconsistent behavior between sessions. 