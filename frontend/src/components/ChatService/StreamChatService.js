import React, { useEffect, useState, useRef } from 'react';
import { StreamChat } from 'stream-chat';
import { useLocation } from 'react-router-dom';
import TourManager from './components/TourManager';
import { callGepeto } from './api/ApiService';

import './styles/StreamChat.css';

// Get API key from environment variables or use a default
const API_KEY = 'hac3qkhvfctc';

// These tokens were generated using the correct API secret:
// dyu77rcnefbyg4ep3r772s3rk9jhj7bbuycvngnaj9yzf222bqtqzvgex8fp5zda
const USER_TOKENS = {
  'john': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiam9obiJ9.bu_WbI939gERr6v1sSCoQOIadeBEbblNXiBdRKLcRRo',
  'gepeto': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiZ2VwZXRvIn0.Xz0SL0AIrSJQQwqszYYOQcOpomtosL__VBrbvqpMDTA'
};

// In production, this code would run on your server:
// 
// const serverClient = StreamChat.getInstance('hac3qkhvfctc', 'dyu77rcnefbyg4ep3r772s3rk9jhj7bbuycvngnaj9yzf222bqtqzvgex8fp5zda');
// const token = serverClient.createToken('john');
// console.log(token);

const StreamChatService = ({ 
  apiBaseUrl = 'http://0.0.0.0:8081',
  initialChatOpen = true,
  chatToggleLabel = 'Chat',
  chatToggleCloseLabel = 'X',
}) => {
  const location = useLocation();
  const prevLocationRef = useRef(location.pathname);
  
  const [highlightedElement, setHighlightedElement] = useState(null);
  const [pendingHighlight, setPendingHighlight] = useState(null);
  const [chatOpen, setChatOpen] = useState(initialChatOpen);
  const [processedMessages, setProcessedMessages] = useState(new Set());
  const [clientReady, setClientReady] = useState(false);
  const [channel, setChannel] = useState(null);
  const [messages, setMessages] = useState([]);
  const [error, setError] = useState(null);
  
  // User state
  const [chatClient, setChatClient] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [inputValue, setInputValue] = useState('');

  // Effect to clear message history when component mounts (page loads)
  useEffect(() => {
    // This will clear any previous message state when the component mounts
    console.log('Component mounted - clearing message history');
    setMessages([]);
    setProcessedMessages(new Set());
    
    // Also disconnect any existing client to ensure a fresh connection
    if (chatClient) {
      chatClient.disconnectUser().then(() => {
        console.log('Disconnected existing chat client');
        setChatClient(null);
        setChannel(null);
      });
    }
    
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array means this runs once on mount

  useEffect(() => {
    if (location.pathname !== prevLocationRef.current) {
      console.log(`Page changed from ${prevLocationRef.current} to ${location.pathname}`);
      prevLocationRef.current = location.pathname;

      setHighlightedElement(null);

      if (pendingHighlight) {
        setTimeout(() => {
          const el = document.querySelector(pendingHighlight);
          if (el) {
            console.log(`Element ${pendingHighlight} found after page transition, highlighting it`);
            setHighlightedElement(pendingHighlight);
          }
        }, 500);
      }
    }
  }, [location.pathname, pendingHighlight]);

  // Initialize Stream Chat client
  useEffect(() => {
    const initChat = async () => {
      try {
        setError(null);
        // Use a fixed user ID for this demo
        const userId = 'john';
        const userName = 'John Doe';
        
        // Initialize Stream Chat client - Only use the API key on the client side
        const client = StreamChat.getInstance(API_KEY);
        
        try {
          // Connect with the pre-generated token
          const userToken = USER_TOKENS[userId];
          
          if (!userToken) {
            setError(`No token available for user ${userId}`);
            return;
          }
          
          console.log('Using token:', userToken);
          
          await client.connectUser(
            {
              id: userId,
              name: userName,
              image: `https://getstream.io/random_svg/?id=${userId}&name=${userName}`
            },
            userToken
          );
          
          console.log('Connected to Stream Chat as', userId);
          
          setChatClient(client);
          setCurrentUser({
            id: userId,
            name: userName
          });
          
          // Add welcome message to ensure it shows immediately
          const welcomeMessage = {
            id: `gepeto-welcome-${Date.now()}`,
            text: "Hey John, how can i help you with Avail today?",
            html: "<p>Hey John, how can i help you with Avail today?</p>",
            type: 'regular',
            user: {
              id: 'gepeto',
              name: 'Gepeto AI',
              image: `https://getstream.io/random_svg/?id=gepeto&name=Gepeto AI`
            },
            created_at: new Date(),
          };
          
          setMessages([welcomeMessage]);
          console.log('Added Gepeto welcome message at initialization');
          
          // Create or join the general channel and set up listeners
          await setupChannel(client, userId);
          
          setClientReady(true);
        } catch (authError) {
          console.error('Authentication failed:', authError);
          setError('Could not authenticate with Stream Chat: ' + authError.message);
        }
      } catch (error) {
        console.error('Error initializing Stream Chat:', error);
        setError('Could not initialize chat: ' + error.message);
      }
    };
    
    if (chatOpen && !chatClient) {
      initChat();
    }
    
    return () => {
      if (chatClient) {
        // Clean up the connection when the component unmounts
        chatClient.disconnectUser().then(() => {
          console.log('Disconnected from Stream Chat');
        });
      }
    };
  }, [chatOpen]);

  // Helper function to set up channel and its listeners
  const setupChannel = async (client, userId) => {
    try {
      // First try to get an existing channel
      const channelId = 'general';
      
      // Configure channel with message limit options to minimize history
      const generalChannel = client.channel('messaging', channelId, {
        name: 'General Chat',
        members: [userId],
        // Add options to minimize message history
        message_retention: '1',  // Minimal message retention
      });
      
      // Watch the channel with minimal message history
      const state = await generalChannel.watch({
        limit: 0,  // Don't load any previous messages
        messages_limit: 0
      });
      
      setChannel(generalChannel);
      
      // Skip loading previous messages - only keep the welcome message
      // We're intentionally not using the state.messages here to clear history
      
      // Set up message listener
      generalChannel.on('message.new', event => {
        console.log('New message received:', event.message);
        setMessages(prevMessages => [...prevMessages, event.message]);
        
        if (event.user.id === userId) {
          processMessage(event.message.text);
        }
      });
      
      return generalChannel;
    } catch (channelError) {
      console.error('Error initializing channel:', channelError);
      setError('Could not connect to chat channel: ' + channelError.message);
      return null;
    }
  };

  // Process messages through Gepeto
  const processMessage = async (messageText) => {
    if (processedMessages.has(messageText)) {
      return;
    }
    
    setProcessedMessages(prev => new Set([...prev, messageText]));
    
    try {
      console.log('Processing message with Gepeto:', messageText);
      const gepetoResponse = await callGepeto(messageText, apiBaseUrl);
      
      if (gepetoResponse) {
        console.log('Gepeto response:', gepetoResponse);
        
        if (gepetoResponse.message) {
          // Create a synthetic Gepeto message and add it directly to our message list
          const gepetoMessage = {
            id: `gepeto-${Date.now()}`,
            text: gepetoResponse.message,
            html: `<p>${gepetoResponse.message}</p>`,
            type: 'regular',
            user: {
              id: 'gepeto',
              name: 'Gepeto AI',
              image: `https://getstream.io/random_svg/?id=gepeto&name=Gepeto AI`
            },
            created_at: new Date(),
          };
          
          // Add the message to our local state
          setMessages(prevMessages => [...prevMessages, gepetoMessage]);
          console.log('Added Gepeto message to UI:', gepetoMessage);
        }
        
        if (gepetoResponse.functionCall) {
          console.log(`Pending highlight: ${gepetoResponse.functionCall}`);
          setPendingHighlight(gepetoResponse.functionCall);
          
          const el = document.querySelector(gepetoResponse.functionCall);
          if (el) {
            console.log(`Element ${gepetoResponse.functionCall} found, highlighting immediately`);
            setHighlightedElement(gepetoResponse.functionCall);
          }
        } else {
          setPendingHighlight(null);
          setHighlightedElement(null);
        }
      }
    } catch (error) {
      console.error('Error processing message with Gepeto:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!inputValue.trim() || !channel || !chatClient) return;
    
    try {
      await channel.sendMessage({
        text: inputValue
      });
      
      setInputValue('');
    } catch (error) {
      console.error('Error sending message:', error);
      setError('Could not send message. Please try again.');
    }
  };

  const handleElementClick = async (selector) => {
    console.log(`User clicked highlighted element: ${selector}`);
    try {
      const response = await callGepeto(`I clicked on ${selector}`, apiBaseUrl);
      
      if (response && response.message) {
        // Create a synthetic Gepeto message and add it directly to our message list
        const gepetoMessage = {
          id: `gepeto-click-${Date.now()}`,
          text: response.message,
          html: `<p>${response.message}</p>`,
          type: 'regular',
          user: {
            id: 'gepeto',
            name: 'Gepeto AI',
            image: `https://getstream.io/random_svg/?id=gepeto&name=Gepeto AI`
          },
          created_at: new Date(),
        };
        
        // Add the message to our local state
        setMessages(prevMessages => [...prevMessages, gepetoMessage]);
        console.log('Added Gepeto click response to UI:', gepetoMessage);
        
        if (response.functionCall) {
          setPendingHighlight(response.functionCall);
          
          const el = document.querySelector(response.functionCall);
          if (el) {
            setHighlightedElement(response.functionCall);
          }
        } else {
          setHighlightedElement(null);
        }
      }
    } catch (error) {
      console.error('Error handling element click:', error);
    }
  };

  const handleChatToggle = () => {
    setChatOpen(!chatOpen);
    
    if (!chatOpen && !chatClient) {
      // Initialize chat when opening
      setClientReady(false);
      setError(null);
    }
  };

  const handleLogout = () => {
    if (chatClient) {
      chatClient.disconnectUser().then(() => {
        console.log('Logged out from Stream Chat');
        
        // Reset state
        setChatClient(null);
        setCurrentUser(null);
        setChannel(null);
        setClientReady(false);
        setChatOpen(false);
        setMessages([]);
        setError(null);
      });
    }
  };

  // Render our own custom chat UI instead of using Stream Chat React components
  const renderChatContent = () => {
    if (error) {
      return (
        <div className="chat-error">
          <p>{error}</p>
          <button onClick={() => handleLogout()}>Try Again</button>
        </div>
      );
    }
    
    if (!clientReady || !chatClient || !channel) {
      return (
        <div className="chat-loading">
          <p>Loading chat...</p>
        </div>
      );
    }

    return (
      <div className="custom-chat">
        <div className="custom-chat-header">
          <h3>General Chat</h3>
        </div>
        <div className="custom-message-list">
          {messages.map(msg => (
            <div 
              key={msg.id || Math.random().toString()} 
              className={`message ${msg.user?.id === currentUser?.id ? 'message-mine' : ''} ${msg.user?.id === 'gepeto' ? 'message-ai' : ''}`}
            >
              <div className="message-avatar">
                {msg.user?.image ? (
                  <img src={msg.user.image} alt={msg.user?.name || 'User'} />
                ) : (
                  <div className="avatar-placeholder">{msg.user?.name?.[0] || '?'}</div>
                )}
              </div>
              <div className="message-content">
                <div className="message-author">{msg.user?.name || 'Unknown user'}</div>
                <div className="message-text">{msg.text}</div>
              </div>
            </div>
          ))}
        </div>
        <form className="custom-message-input" onSubmit={handleSubmit}>
          <input
            type="text"
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
            placeholder="Type a message"
          />
          <button type="submit">Send</button>
        </form>
      </div>
    );
  };

  return (
    <>
      {highlightedElement && (
        <TourManager
          highlightClass={highlightedElement}
          onElementClick={handleElementClick}
          onTourComplete={() => {
            setHighlightedElement(null);
            setProcessedMessages(new Set());
          }}
        />
      )}
      
      <div className="chat-controls">
        <button className="chat-toggle-button" onClick={handleChatToggle}>
          {chatOpen ? chatToggleCloseLabel : chatToggleLabel}
        </button>
        
        {chatOpen && currentUser && (
          <button className="chat-logout-button" onClick={handleLogout} title="Log out of chat">
            🚪 Logout
          </button>
        )}
      </div>
      
      {chatOpen && (
        <div className={`stream-chat-container ${!clientReady ? 'loading' : ''}`}>
          {renderChatContent()}
        </div>
      )}
    </>
  );
};

export default StreamChatService; 