import React, { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import TourManager from './components/TourManager';
import { callGepeto } from './api/ApiService';
import { 
  initRocketChat, 
  getOrCreateChannel, 
  sendMessage, 
  subscribeToMessages, 
  clearChannelHistory,
  disconnectRocketChat
} from './api/RocketChatDirectAPI';
import './styles/DirectChat.css';


const DirectChatService = ({
  apiBaseUrl = 'http://0.0.0.0:8081',
  rocketChatConfig = {
    rocketChatHost: process.env.REACT_APP_ROCKET_CHAT_HOST || 'http://localhost:3001',
    adminUser: process.env.REACT_APP_ROCKET_CHAT_USER || 'admin',
    adminPass: process.env.REACT_APP_ROCKET_CHAT_PASS || 'password',
    roomId: 'GENERAL'
  },
  initialChatOpen = true,
  chatToggleLabel = 'Chat',
  chatToggleCloseLabel = 'X',
}) => {
  const location = useLocation();
  const prevLocationRef = useRef(location.pathname);
  
  const [highlightedElement, setHighlightedElement] = useState(null);
  const [pendingHighlight, setPendingHighlight] = useState(null);
  const [isChatInitialized, setIsChatInitialized] = useState(false);
  const [chatOpen, setChatOpen] = useState(initialChatOpen);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [channelId, setChannelId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  
  const messagesEndRef = useRef(null);
  const isMounted = useRef(true);
  const hasRunInitialization = useRef(false);
  const unsubscribeRef = useRef(null);
  
  const processedMessages = useRef(new Set());
  
  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  // Initialize chat service
  useEffect(() => {
    if (hasRunInitialization.current) return;
    hasRunInitialization.current = true;
    
    if (chatOpen) {
      initializeChat();
    }
    
    return () => {
      isMounted.current = false;
      // Clean up subscription
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
      // Disconnect from Rocket.Chat
      disconnectRocketChat(rocketChatConfig);
    };
  }, []);
  
  // Effect for scrolling to latest messages
  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  
  // Effect for navigation changes
  useEffect(() => {
    if (location.pathname !== prevLocationRef.current) {
      prevLocationRef.current = location.pathname;

      setHighlightedElement(null);

      if (pendingHighlight) {
        setTimeout(() => {
          const el = document.querySelector(pendingHighlight);
          if (el) {
            setHighlightedElement(pendingHighlight);
          }
        }, 500);
      }
    }
  }, [location.pathname, pendingHighlight]);
  
  // Handle chat open/close changes
  useEffect(() => {
    if (chatOpen && !isChatInitialized) {
      initializeChat();
    } else if (!chatOpen && unsubscribeRef.current) {
      unsubscribeRef.current();
      unsubscribeRef.current = null;
    }
  }, [chatOpen]);
  
  // Initialize the chat service
  const initializeChat = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const initSuccess = await initRocketChat(rocketChatConfig).catch(() => false);
      
      if (!initSuccess) {
        setError('Unable to connect to chat service. Please try again later.');
        
        setMessages([
          {
            id: 'error-welcome',
            text: 'Chat service is currently unavailable. Our team has been notified.',
            sender: 'assistant',
            timestamp: new Date()
          }
        ]);
        
        setIsChatInitialized(true);
        setIsLoading(false);
        return;
      }
      
      let roomId;
      try {
        roomId = await getOrCreateChannel(rocketChatConfig.roomId.toLowerCase(), rocketChatConfig);
        setChannelId(roomId);
      } catch (channelError) {
        setError('Unable to connect to chat service. Please try again later.');
        
        setMessages([
          {
            id: 'error-welcome',
            text: 'Chat service is currently unavailable. Our team has been notified.',
            sender: 'assistant',
            timestamp: new Date()
          }
        ]);
        
        setIsChatInitialized(true);
        setIsLoading(false);
        return;
      }
      
      try {
        await clearChannelHistory(roomId, rocketChatConfig);
      } catch (clearError) {
      }
      
      try {
        const unsub = subscribeToMessages(roomId, handleIncomingMessage, rocketChatConfig);
        unsubscribeRef.current = unsub;
      } catch (subscribeError) {
      }
      
      try {
        await sendMessage('Chat session started', roomId, rocketChatConfig);
      } catch (welcomeError) {
      }
      
      setMessages([
        {
          id: 'welcome',
          text: 'How can I help you today?',
          sender: 'assistant',
          timestamp: new Date()
        }
      ]);
      
      setIsChatInitialized(true);
    } catch (err) {
      setError('Unable to connect to chat service. Please try again later.');
      
      setMessages([
        {
          id: 'error-welcome',
          text: 'Chat service is currently unavailable. Our team has been notified.',
          sender: 'assistant',
          timestamp: new Date()
        }
      ]);
      
      setIsChatInitialized(true);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleIncomingMessage = (message) => {
    if (message.u && message.u.username === rocketChatConfig.adminUser) {
      return;
    }
    
    if (processedMessages.current.has(message._id)) {
      return;
    }
    processedMessages.current.add(message._id);
    
    // Add message to UI
    setMessages(prev => [
      ...prev,
      {
        id: message._id,
        text: message.msg,
        sender: 'user',
        timestamp: new Date(message.ts)
      }
    ]);
    
    // Process message with Gepeto
    processUserMessage(message.msg);
  };
  
  const processUserMessage = async (messageText) => {
    try {
      setIsTyping(true);
      
      const gepetoResponse = await callGepeto(messageText, apiBaseUrl);
      
      if (!isMounted.current) return;
      
      setIsTyping(false);
      
      if (gepetoResponse) {
        if (gepetoResponse.message) {
          try {
            await sendMessage(gepetoResponse.message, channelId, rocketChatConfig);
          } catch (sendError) {
          }
          
          setMessages(prev => [
            ...prev,
            {
              id: `assistant-${Date.now()}`,
              text: gepetoResponse.message,
              sender: 'assistant',
              timestamp: new Date()
            }
          ]);
        }
        
        if (gepetoResponse.functionCall) {
          setPendingHighlight(gepetoResponse.functionCall);
          
          const el = document.querySelector(gepetoResponse.functionCall);
          if (el) {
            setHighlightedElement(gepetoResponse.functionCall);
          }
        } else {
          setPendingHighlight(null);
          setHighlightedElement(null);
        }
      }
    } catch (error) {
      setIsTyping(false);
      
      setMessages(prev => [
        ...prev,
        {
          id: `error-${Date.now()}`,
          text: "Sorry, there was an error processing your message.",
          sender: 'assistant',
          timestamp: new Date()
        }
      ]);
    }
  };
  
  // Handle sending a message
  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;
    
    if (!channelId && isChatInitialized) {
      setMessages(prev => [
        ...prev,
        {
          id: `user-${Date.now()}`,
          text: newMessage,
          sender: 'user',
          timestamp: new Date()
        },
        {
          id: `error-${Date.now()}`,
          text: "Sorry, the chat service is currently unavailable. Please try again later.",
          sender: 'assistant',
          timestamp: new Date()
        }
      ]);
      setNewMessage('');
      return;
    }
    
    setMessages(prev => [
      ...prev,
      {
        id: `user-${Date.now()}`,
        text: newMessage,
        sender: 'user',
        timestamp: new Date()
      }
    ]);
    
    const messageToSend = newMessage;
    setNewMessage('');
    
    try {
      await sendMessage(messageToSend, channelId, rocketChatConfig);
      processUserMessage(messageToSend);
    } catch (err) {
      setMessages(prev => [
        ...prev,
        {
          id: `error-${Date.now()}`,
          text: "Sorry, the message couldn't be sent. Please try again.",
          sender: 'assistant',
          timestamp: new Date()
        }
      ]);
    }
  };
  
  // Handle element click
  const handleElementClick = async (selector) => {
    try {
      setIsTyping(true);
      const response = await callGepeto(`I clicked on ${selector}`, apiBaseUrl);
      
      if (!isMounted.current) return;
      
      setIsTyping(false);
      
      if (response && response.message) {
        try {
          await sendMessage(response.message, channelId, rocketChatConfig);
        } catch (sendError) {
        }
        
        // Add to UI
        setMessages(prev => [
          ...prev,
          {
            id: `assistant-${Date.now()}`,
            text: response.message,
            sender: 'assistant',
            timestamp: new Date()
          }
        ]);
        
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
      setIsTyping(false);
      
      // Show error message in chat
      setMessages(prev => [
        ...prev,
        {
          id: `error-${Date.now()}`,
          text: "Sorry, there was an error processing your click.",
          sender: 'assistant',
          timestamp: new Date()
        }
      ]);
    }
  };
  
  // Toggle chat open/close
  const handleChatToggle = () => {
    setChatOpen(prev => !prev);
  };
  
  // Handle input key press (send on Enter)
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };
  
  return (
    <>
      {highlightedElement && (
        <TourManager
          highlightClass={highlightedElement}
          onElementClick={handleElementClick}
          onTourComplete={() => {
            setHighlightedElement(null);
            // Clear processed messages set after tour completes
            processedMessages.current = new Set();
          }}
        />
      )}
      
      <button 
        className="chat-toggle-button" 
        onClick={handleChatToggle}
        aria-label={chatOpen ? "Close chat" : "Open chat"}
      >
        {chatOpen ? (
          <span className="close-icon">×</span>
        ) : (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M20 2H4C2.9 2 2 2.9 2 4V22L6 18H20C21.1 18 22 17.1 22 16V4C22 2.9 21.1 2 20 2ZM20 16H5.17L4 17.17V4H20V16Z" fill="white"/>
          </svg>
        )}
      </button>
      
      {chatOpen && (
        <div className="direct-chat-container">
          <div className="chat-header">
            <div className="header-content">
              <div className="chat-logo">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM8 17.5L9.5 16L11 17.5L12.5 16L14 17.5L15.5 16L17 17.5V7C17 6.45 16.55 6 16 6H8C7.45 6 7 6.45 7 7V17.5L8 17.5Z" fill="white"/>
                </svg>
              </div>
              <h3>Avail Assistant</h3>
            </div>
            <button className="close-button" onClick={handleChatToggle}>×</button>
          </div>
          
          <div className="messages-container">
            {isLoading && <div className="loading-indicator">Initializing chat...</div>}
            {error && <div className="error-message">{error}</div>}
            
            {messages.map((msg) => (
              <div 
                key={msg.id} 
                className={`message ${msg.sender === 'assistant' ? 'assistant' : 'user'}`}
              >
                <div className="message-content">{msg.text}</div>
                <div className="message-timestamp">
                  {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            ))}
            
            {isTyping && (
              <div className="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
          
          <div className="chat-input-container">
            <textarea
              className="chat-input"
              placeholder="Type your message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={!isChatInitialized || isLoading}
            />
            <button 
              className="send-button"
              onClick={handleSendMessage}
              disabled={!isChatInitialized || isLoading || !newMessage.trim()}
              aria-label="Send message"
            />
          </div>
        </div>
      )}
    </>
  );
};

export default DirectChatService; 