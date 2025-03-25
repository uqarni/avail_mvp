import React, { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import TourManager from './components/TourManager';
import { callGepeto } from './api/ApiService';
import { sendRocketChatMessage } from './api/RocketChatService';
import './styles/RocketChat.css';

const SESSION_ID = Date.now().toString(36) + Math.random().toString(36).substring(2);

const ChatService = ({ 
  apiBaseUrl = 'http://0.0.0.0:8081', 
  rocketChatConfig = {
    rocketChatHost: process.env.REACT_APP_ROCKET_CHAT_HOST || 'http://localhost:3001',
    adminUser: process.env.REACT_APP_ROCKET_CHAT_USER || 'admin',
    adminPass: process.env.REACT_APP_ROCKET_CHAT_PASS || 'password',
    roomId: 'GENERAL'
  },
  initialChatOpen = false,
  chatToggleLabel = 'Chat',
  chatToggleCloseLabel = 'X',
}) => {
  const location = useLocation();
  const prevLocationRef = useRef(location.pathname);
  const iframeRef = useRef(null);
  
  const [highlightedElement, setHighlightedElement] = useState(null);
  const [pendingHighlight, setPendingHighlight] = useState(null);
  const [isFrameReady, setIsFrameReady] = useState(false);
  const [frameUrl, setFrameUrl] = useState(null);
  const [chatOpen, setChatOpen] = useState(initialChatOpen);
  const [processedMessages, setProcessedMessages] = useState(new Set());
  const [lastProcessedId, setLastProcessedId] = useState('');
  
  const [iframeKey, setIframeKey] = useState(0);
  
  const isMounted = useRef(true);
  const hasRunInitialization = useRef(false);
  
  const createFreshSessionUrl = () => {
    const timestamp = Date.now();
    const baseUrl = `${rocketChatConfig.rocketChatHost}/channel/general`;
    
    const url = `${baseUrl}?layout=embedded&cacheBuster=${timestamp}&theme=light&themePreference=light&colorScheme=light&sidebarViewMode=medium&messageViewMode=normal&hideUsernames=0&hideRoles=0&hideFlexTab=0&hideAvatars=0`;
    console.log(`Creating fresh session URL: ${url}`);
    return url;
  };
  
  // Function to wipe all local RocketChat data
  const wipeRocketChatData = () => {
    try {
      console.log('Wiping all RocketChat-related data');
      
      const localKeys = [];
      for (let i = 0; i < localStorage.length; i++) {
        localKeys.push(localStorage.key(i));
      }
      
      const prefixesToClear = [
        'rocket', 'Rocket', 'rc_', 'RC_', 'RocketChat',
        'room_', 'Livechat', 'token', 'auth', 'user',
        'idb', 'member', 'message', 'Messages', 'cachedCollection'
      ];
      
      localKeys.forEach(key => {
        if (key && prefixesToClear.some(prefix => key.includes(prefix))) {
          console.log(`Removing localStorage key: ${key}`);
          localStorage.removeItem(key);
        }
      });
      
      const sessionKeys = [];
      for (let i = 0; i < sessionStorage.length; i++) {
        sessionKeys.push(sessionStorage.key(i));
      }
      
      sessionKeys.forEach(key => {
        if (key && prefixesToClear.some(prefix => key.includes(prefix))) {
          console.log(`Removing sessionStorage key: ${key}`);
          sessionStorage.removeItem(key);
        }
      });
      
      document.cookie.split(';').forEach(cookie => {
        const name = cookie.split('=')[0].trim();
        if (prefixesToClear.some(prefix => name.includes(prefix))) {
          const paths = ['/', '/channel', '/group', '/direct'];
          paths.forEach(path => {
            document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=${path};`;
          });
          console.log(`Removed cookie: ${name}`);
        }
      });
      
      if (window.indexedDB) {
        try {
          window.indexedDB.databases().then(databases => {
            databases.forEach(db => {
              if (prefixesToClear.some(prefix => db.name.includes(prefix))) {
                console.log(`Deleting indexedDB: ${db.name}`);
                window.indexedDB.deleteDatabase(db.name);
              }
            });
          }).catch(e => console.error('Error listing indexedDB databases:', e));
        } catch (e) {
          console.error('Error accessing indexedDB:', e);
        }
      }
    } catch (e) {
      console.error('Error wiping RocketChat data:', e);
    }
  };
  
  useEffect(() => {
    if (hasRunInitialization.current) return;
    hasRunInitialization.current = true;
    
    const initializeChat = () => {
      console.log('Initializing ChatService component');
      
      // Wipe all RocketChat data first
      wipeRocketChatData();
      
      // Reset our local state
      const resetLocalState = () => {
        setProcessedMessages(new Set());
        setLastProcessedId('');
        console.log('Reset local message tracking state');
      };
      
      resetLocalState();
      
      // Create fresh URL
      setFrameUrl(createFreshSessionUrl());
      
      // Store the session ID
      try {
        localStorage.setItem('chat_session_id', SESSION_ID);
      } catch (e) {
        console.error('Error accessing localStorage:', e);
      }
    };
    
    initializeChat();
    
    return () => {
      isMounted.current = false;
    };
  }, []);
  
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

  // Process user messages through Gepeto API
  const processUserMessage = async (messageText) => {
    // Simple duplicate message check
    if (processedMessages.has(messageText)) {
      console.log('Already processed this message, skipping:', messageText);
      return;
    }
    
    setProcessedMessages(prev => new Set([...prev, messageText]));
    
    // Process message through Gepeto
    try {
      console.log('Processing message with Gepeto:', messageText);
      const gepetoResponse = await callGepeto(messageText, apiBaseUrl);
      
      if (!isMounted.current) return;
      
      if (gepetoResponse) {
        console.log('Gepeto response:', gepetoResponse);
        
        try {
          const result = await sendRocketChatMessage(
            gepetoResponse.message || "I couldn't process that message.",
            rocketChatConfig.roomId,
            rocketChatConfig
          );
          
          console.log('Sent message via admin API:', result);
          
          if (gepetoResponse.message) {
            setProcessedMessages(prev => new Set([...prev, gepetoResponse.message]));
          }
        } catch (apiError) {
          console.error('Failed to send via admin API:', apiError);
          
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
      if (iframeRef.current) {
        iframeRef.current.contentWindow.postMessage({
          type: 'bot_response',
          message: "Sorry, there was an error processing your message."
        }, '*');
      }
    }
  };

  // Listen for messages from the iframe
  useEffect(() => {
    let messageCount = 0;
    const maxInitialMessages = 3;
    let hasPerformedHardReset = false;
    
    const handleMessage = async (event) => {
      if (!event.data || typeof event.data !== 'object') return;
      
      console.log('Received message from iframe:', event.data);
      
      if (event.data.eventName === 'new-message') {
        messageCount++;
        
        if (messageCount > maxInitialMessages && !hasPerformedHardReset) {
          console.log(`Detected ${messageCount} messages, which suggests history persisted. Performing hard reset.`);
          hasPerformedHardReset = true;
          hardResetIframe();
          return;
        }
      }
      
      if (event.data.eventName === 'room-opened') {
        console.log('Room opened, checking if there are existing messages that need to be cleared');
        messageCount = 0;
        hasPerformedHardReset = false;
        
        setTimeout(() => {
          setupMessageRemoval();
        }, 1000);
      }
      
      if (event.data.type === 'ready') {
        setIsFrameReady(true);
        if (iframeRef.current) {
          iframeRef.current.contentWindow.postMessage({
            type: 'parent_ready'
          }, '*');
        }
        return;
      }
      
      if (event.data.type === 'new_message' && event.data.message) {
        processUserMessage(event.data.message);
        return;
      }
      
      if (event.data.eventName === 'new-message' && event.data.data) {
        const messageData = event.data.data;
        
        console.log('Message data user:', messageData.u);
        
        if (isSystemMessage(messageData)) {
          console.log('Filtering out system message:', messageData.msg);
          return;
        }
        
        if (messageData._id === lastProcessedId) {
          console.log('Skipping already processed message');
          return;
        }
        
        // Skip system messages or messages without text
        if (!messageData.msg || messageData.t === 'uj' || messageData.t === 'ul') {
          console.log('Skipping system message or empty message');
          return;
        }
        
        // Update last processed ID
        setLastProcessedId(messageData._id);
        
        // Process the actual message text
        if (messageData.msg) {
          const isBotMessage = messageData.u && 
            (messageData.u.username === 'rocket.cat' || 
             messageData.u.username === rocketChatConfig.adminUser);
          
          if (!isBotMessage) {
            console.log('Processing user message from Rocket.Chat event:', messageData.msg);
            processUserMessage(messageData.msg);
          } else {
            console.log('Skipping message from admin/system account:', messageData.msg);
          }
        }
      }
    };
    
    // Helper to determine if a message is a system message
    const isSystemMessage = (message) => {
      if (message.t && ['uj', 'ul', 'ru', 'au', 'mute', 'unmute', 'subscription-role-added', 
                        'subscription-role-removed', 'room_changed_privacy', 'room_changed_topic', 
                        'room_changed_announcement', 'room_changed_description'].includes(message.t)) {
        return true;
      }
      
      if (message.u && message.u.username === 'rocket.cat') {
        return true;
      }
      
      if (message.msg && (
        message.msg.includes('New chat session') ||
        message.msg.includes('joined the channel') ||
        message.msg.includes('has joined the room') ||
        message.msg.includes('welcome to this conversation')
      )) {
        return true;
      }
      
      return false;
    };
    
    // Add message event listener
    window.addEventListener('message', handleMessage);
    
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [lastProcessedId, pendingHighlight, processedMessages, rocketChatConfig, apiBaseUrl]);

  const handleElementClick = async (selector) => {
    console.log(`User clicked highlighted element: ${selector}`);
    try {
      const response = await callGepeto(`I clicked on ${selector}`, apiBaseUrl);
      
      if (!isMounted.current) return;
      
      if (response && response.message) {
        await sendRocketChatMessage(response.message, rocketChatConfig.roomId, rocketChatConfig);
        
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

  const handleChatClose = () => {
    if (chatOpen) {
      setChatOpen(false);
      
      wipeRocketChatData();
      
      setFrameUrl(null);
      setIframeKey(prevKey => prevKey + 1);
      
      setProcessedMessages(new Set());
      setLastProcessedId('');
    }
  };

  const setupMessageRemoval = () => {
    if (!iframeRef.current) return;
    
    try {
      console.log('Setting up message removal');
      
      setTimeout(() => {
        try {
          const iframeDocument = iframeRef.current.contentWindow.document;
          
          const systemMessages = iframeDocument.querySelectorAll('.message-system, .message.system');
          systemMessages.forEach(msg => {
            console.log('Removing system message');
            msg.remove();
          });
        } catch (e) {
          console.log('Could not access iframe content directly due to cross-origin restrictions');
        }
      }, 2000);
    } catch (e) {
      console.error('Error setting up message removal:', e);
    }
  };
  
  const hardResetIframe = () => {
    setChatOpen(false);
    setFrameUrl(null);
    
    wipeRocketChatData();
    
    setTimeout(() => {
      setIframeKey(Date.now());
      setFrameUrl(createFreshSessionUrl());
      setChatOpen(true);
    }, 300);
  };
  
  const handleChatOpen = () => {
    if (!chatOpen) {
      wipeRocketChatData();
      
      const newFrameUrl = createFreshSessionUrl();
      setFrameUrl(newFrameUrl);
      
      setIframeKey(Date.now());
      
      setProcessedMessages(new Set());
      setLastProcessedId('');
      
      setChatOpen(true);
    } else {
      handleChatClose();
    }
  };

  // Add an onLoad handler to the iframe to configure RocketChat
  const handleIframeLoad = () => {
    console.log('RocketChat iframe loaded');
    setIsFrameReady(true);
    
    if (iframeRef.current) {
      // Wait a moment for Rocket.Chat to fully initialize
      setTimeout(() => {
        iframeRef.current.contentWindow.postMessage({
          type: 'parent_ready'
        }, '*');
        
        // Force light mode when iframe loads
        forceLightMode();
      }, 1000);
      
      setupMessageRemoval();
    }
  };
  
  // Force light mode for the iframe
  const forceLightMode = () => {
    try {
      if (!iframeRef.current) return;
      
      console.log('Forcing light mode in Rocket.Chat iframe');
      
      // Send message to iframe to force light mode
      iframeRef.current.contentWindow.postMessage({
        type: 'force_light_mode'
      }, '*');
      
      // Add light mode attribute to iframe
      iframeRef.current.setAttribute('data-theme', 'light');
      
      // Try multiple methods to ensure light mode is applied
      setTimeout(() => {
        if (iframeRef.current) {
          try {
            // Force reload with light theme parameter if needed
            const currentSrc = iframeRef.current.src;
            if (!currentSrc.includes('theme=light')) {
              iframeRef.current.src = createFreshSessionUrl();
            }
          } catch (e) {
            console.error('Error enforcing light theme:', e);
          }
        }
      }, 2000);
    } catch (e) {
      console.error('Error forcing light mode:', e);
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
            // Clear processed messages after tour completes to allow reprocessing the same messages
            setProcessedMessages(new Set());
            setLastProcessedId('');
            console.log('Tour completed, cleared processed messages to allow reprocessing');
          }}
        />
      )}
      
      <button className="chat-toggle-button" onClick={handleChatOpen}>
        {chatOpen ? chatToggleCloseLabel : chatToggleLabel}
      </button>
      
      {chatOpen && frameUrl && (
        <div className={`rocket-chat-container ${!isFrameReady ? 'loading' : ''}`}>
          <iframe
            key={iframeKey}
            ref={iframeRef}
            src={frameUrl}
            title="Rocket.Chat"
            onLoad={handleIframeLoad}
          />
        </div>
      )}
    </>
  );
};

export default ChatService; 