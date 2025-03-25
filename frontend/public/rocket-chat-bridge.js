/**
 * Rocket.Chat Bridge Script
 * 
 * This script facilitates communication between the Rocket.Chat iframe
 * and the parent application, allowing messages to flow through Gepeto API.
 */

(function() {
  // Keep track of observers and listeners
  let messageObserver = null;
  let connected = false;
  let messageFormListener = null;
  let isInitialized = false;
  let currentUser = null;
  
  // Auto-login credentials - replace with user's credentials
  const username = 'wenzorithelly';
  const password = 'gepeto123!!';
  
  // Function to initialize the bridge
  function initBridge() {
    console.log('[Rocket.Chat Bridge] Initializing bridge');
    
    // Only initialize once
    if (isInitialized) return;
    isInitialized = true;
    
    // Listen for messages from the parent
    window.addEventListener('message', handleParentMessage);
    
    // Forward Rocket.Chat events to parent
    setupEventForwarding();
    
    // Check if we need to login
    setTimeout(checkLoginStatus, 1000);
    
    // Notify parent that the iframe is ready
    window.parent.postMessage({ type: 'ready' }, '*');
    
    // Listen for the Custom_Script_Logged_In event
    window.addEventListener('Custom_Script_Logged_In', (event) => {
      console.log('[Rocket.Chat Bridge] User logged in, setting up observers');
      
      // Try to get current user
      if (window.Meteor && window.Meteor.user) {
        try {
          currentUser = window.Meteor.user();
          console.log('[Rocket.Chat Bridge] Current user:', currentUser);
        } catch (e) {
          console.error('[Rocket.Chat Bridge] Error getting current user:', e);
        }
      }
      
      // Give some time for the UI to fully load
      setTimeout(() => {
        setupMessageObserver();
        setupMessageSendListener();
        navigateToGeneralChannel();
      }, 1000);
    });
    
    // Listen for the Custom_Script_Logged_Out event
    window.addEventListener('Custom_Script_Logged_Out', () => {
      console.log('[Rocket.Chat Bridge] User logged out, attempting auto-login');
      attemptAutoLogin();
    });
  }
  
  // Forward Rocket.Chat events to parent
  function setupEventForwarding() {
    const events = [
      'unread-changed',
      'room-opened',
      'new-message',
      'Custom_Script_Logged_In',
      'Custom_Script_Logged_Out',
      'status-changed'
    ];
    
    events.forEach(eventName => {
      window.addEventListener(eventName, (event) => {
        console.log(`[Rocket.Chat Bridge] Forwarding event ${eventName} to parent:`, event.detail);
        
        // For new messages, also dump them to console for debugging
        if (eventName === 'new-message' && event.detail) {
          console.log('[Rocket.Chat Bridge] New message details:', event.detail);
        }
        
        window.parent.postMessage({
          eventName: eventName,
          data: event.detail
        }, '*');
      });
    });
  }
  
  // Check if user is logged in
  function checkLoginStatus() {
    if (document.querySelector('.main-content') && !document.querySelector('.rc-old')) {
      console.log('[Rocket.Chat Bridge] User is logged in');
      
      // Try to get current user
      if (window.Meteor && window.Meteor.user) {
        try {
          currentUser = window.Meteor.user();
          console.log('[Rocket.Chat Bridge] Current user:', currentUser);
        } catch (e) {
          console.error('[Rocket.Chat Bridge] Error getting current user:', e);
        }
      }
      
      setupMessageObserver();
      setupMessageSendListener();
      
      // Make sure we're in a channel, preferably general
      navigateToGeneralChannel();
    } else if (document.querySelector('.rc-old')) {
      console.log('[Rocket.Chat Bridge] Login screen detected, attempting auto-login');
      attemptAutoLogin();
    } else {
      // Retry after a delay
      setTimeout(checkLoginStatus, 1000);
    }
  }
  
  // Navigate to the general channel
  function navigateToGeneralChannel() {
    console.log('[Rocket.Chat Bridge] Navigating to general channel');
    
    // Check if we need to navigate
    const currentURL = window.location.href;
    if (currentURL.includes('/channel/general')) {
      console.log('[Rocket.Chat Bridge] Already in general channel');
      return;
    }
    
    // Try to find and click on the general channel in the sidebar
    const generalChannel = document.querySelector('.sidebar-item__link[aria-label="Channel: general"]') || 
                          document.querySelector('.sidebar-item__link[title="general"]') ||
                          document.querySelector('.sidebar-item[data-id="general"]');
                          
    if (generalChannel) {
      generalChannel.click();
      console.log('[Rocket.Chat Bridge] Clicked on general channel');
    } else {
      // If general channel isn't found, try to navigate directly using the URL
      const baseUrl = window.location.origin;
      window.location.href = `${baseUrl}/channel/general`;
    }
  }
  
  // Attempt to auto-login
  function attemptAutoLogin() {
    // Find login form elements
    const usernameInput = document.querySelector('input[name="username"]') || 
                          document.querySelector('input[placeholder="example@example.com"]') ||
                          document.querySelector('.rc-old input[type="text"]');
                          
    const passwordInput = document.querySelector('input[name="password"]') || 
                          document.querySelector('input[type="password"]');
                          
    const loginButton = document.querySelector('.rc-button.login') || 
                       document.querySelector('button[type="submit"]') ||
                       document.querySelector('.rc-old button.login');
    
    if (usernameInput && passwordInput && loginButton) {
      console.log('[Rocket.Chat Bridge] Found login form, attempting auto-login');
      
      // Fill in credentials
      usernameInput.value = username;
      usernameInput.dispatchEvent(new Event('input', { bubbles: true }));
      
      passwordInput.value = password;
      passwordInput.dispatchEvent(new Event('input', { bubbles: true }));
      
      // Submit the form
      setTimeout(() => {
        loginButton.click();
        console.log('[Rocket.Chat Bridge] Login form submitted');
      }, 500);
    } else {
      console.warn('[Rocket.Chat Bridge] Login form not found, retrying in 1 second');
      setTimeout(attemptAutoLogin, 1000);
    }
  }
  
  // Handle messages from the parent application
  function handleParentMessage(event) {
    // Make sure message is from our parent
    if (event.source !== window.parent) return;
    
    const { type, message, rid, selector } = event.data;
    console.log('[Rocket.Chat Bridge] Received message from parent:', event.data);
    
    if (type === 'parent_ready') {
      connected = true;
      console.log('[Rocket.Chat Bridge] Parent application is ready to receive messages');
      
      // Force light theme when parent is ready
      forceLightTheme();
    }
    
    if (type === 'force_light_mode') {
      console.log('[Rocket.Chat Bridge] Received force_light_mode request from parent');
      forceLightTheme();
    }

    if (type === 'element_click' && selector) {
      console.log(`[Rocket.Chat Bridge] User clicked element: ${selector} on ${event.data.path || 'unknown page'}`);
    }
  }
  
  // Setup observer to watch for new messages in the chat
  function setupMessageObserver() {
    // Remove any existing observer
    if (messageObserver) {
      messageObserver.disconnect();
      messageObserver = null;
    }
    
    // Find the messages container
    const messagesContainer = document.querySelector('.messages-container .messages') || 
                              document.querySelector('.room-container .messages');
    
    if (!messagesContainer) {
      console.warn('[Rocket.Chat Bridge] Messages container not found, retrying in 1 second');
      setTimeout(setupMessageObserver, 1000);
      return;
    }
    
    console.log('[Rocket.Chat Bridge] Setting up message observer on', messagesContainer);
    
    messageObserver = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
          mutation.addedNodes.forEach((node) => {
            if (node.classList && node.classList.contains('message') && 
                !node.classList.contains('system')) {
              
              const isOwnMessage = node.classList.contains('own') || 
                                 node.querySelector('.message-user-card__username')?.innerText === username;
              
              if (!isOwnMessage) {
                return;
              }
              
              // Get the message text
              const messageEl = node.querySelector('.message-body') || node.querySelector('.body .message-text');
              const messageText = messageEl ? messageEl.innerText || messageEl.textContent : '';
              
              if (messageText && connected) {
                console.log('[Rocket.Chat Bridge] Detected new user message:', messageText);
                
                // Send to parent for processing through Gepeto
                window.parent.postMessage({
                  type: 'new_message',
                  message: messageText
                }, '*');
              }
            }
          });
        }
      });
    });
    
    messageObserver.observe(messagesContainer, { 
      childList: true,
      subtree: true
    });
    
    console.log('[Rocket.Chat Bridge] Message observer setup complete');
  }
  
  // Setup listener for when the user sends a message
  function setupMessageSendListener() {
    // Remove any existing listener
    if (messageFormListener) {
      document.removeEventListener('submit', messageFormListener);
    }
    
    messageFormListener = function(event) {
      const messageInput = document.querySelector('.rc-message-box__textarea');
      
      if (messageInput && messageInput.value.trim() && connected) {
        console.log('[Rocket.Chat Bridge] User sending message:', messageInput.value.trim());
        
        window.parent.postMessage({
          type: 'new_message',
          message: messageInput.value.trim()
        }, '*');
      }
    };
    
    document.addEventListener('submit', messageFormListener);
    
    document.querySelectorAll('.rc-message-box__send').forEach(button => {
      button.addEventListener('click', function() {
        const messageInput = document.querySelector('.rc-message-box__textarea');
        if (messageInput && messageInput.value.trim() && connected) {
          console.log('[Rocket.Chat Bridge] User clicked send button with message:', messageInput.value.trim());
          
          window.parent.postMessage({
            type: 'new_message',
            message: messageInput.value.trim()
          }, '*');
        }
      });
    });
    
    const messageInput = document.querySelector('.rc-message-box__textarea');
    if (messageInput) {
      messageInput.addEventListener('keydown', function(event) {
        if (event.key === 'Enter' && !event.shiftKey) {
          const messageText = messageInput.value.trim();
          if (messageText && connected) {
            console.log('[Rocket.Chat Bridge] User sent message with Enter key:', messageText);
            
            window.parent.postMessage({
              type: 'new_message',
              message: messageText
            }, '*');
          }
        }
      });
    }
  }
  
  if (document.readyState === 'complete') {
    initBridge();
  } else {
    window.addEventListener('load', initBridge);
  }
})();


(function() {
  function forceLightTheme() {
    try {
      console.log('[Rocket.Chat Bridge] Forcing light theme');
      
      localStorage.removeItem('rc_theme');
      localStorage.removeItem('rocket.theme');
      
      const themeSettings = {
        id: 'light',
        theme: 'light',
        useSystemPreference: false,
        darkMode: false,
        forced: true
      };
      
      localStorage.setItem('rc_theme', JSON.stringify(themeSettings));
      localStorage.setItem('rocket.theme', JSON.stringify(themeSettings));
      
      if (window.Meteor && window.Meteor.user && window.Meteor.user()) {
        console.log('[Rocket.Chat Bridge] Setting theme preference for Meteor user');
        try {
          window.Meteor.call('saveUserPreferences', { theme: 'light' });
        } catch (e) {
          console.error('[Rocket.Chat Bridge] Error saving user preferences:', e);
        }
      }
      
      if (document.body) {
        document.body.classList.remove('dark-mode');
        document.body.classList.add('light-mode');
        document.body.style.colorScheme = 'light';
        document.body.style.backgroundColor = '#ffffff';
        document.body.style.color = '#444444';
      }
      
      document.documentElement.setAttribute('data-theme', 'light');
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
      document.documentElement.style.colorScheme = 'light';
      
      if (!document.getElementById('light-theme-force')) {
        const style = document.createElement('style');
        style.id = 'light-theme-force';
        style.innerHTML = `
          /* Force light theme using high specificity selectors */
          html, html[data-theme], html[data-theme="dark"], :root {
            color-scheme: light !important;
            --color-dark: #f3f4f5 !important;
            --color-dark-medium: #ffffff !important;
            --color-dark-light: #ffffff !important;
            --color-dark-10: #f3f4f5 !important;
            --color-dark-05: #f8f9fa !important;
            --primary-font-color: #444444 !important;
            --primary-background-color: #ffffff !important;
            --info-font-color: #444444 !important;
            --content-background-color: #ffffff !important;
            
            /* Light sidebar */
            --sidebar-background: #f3f4f5 !important;
            --sidebar-background-hover: #e7eaed !important;
            --sidebar-item-text-color: #2f343d !important;
            --sidebar-item-background-hover: #e9ebed !important;
            --sidebar-item-text-color-hover: #2f343d !important;
          }
          
          /* General light mode overrides with more specific selectors */
          body, html, .main-content, .rc-old, body.dark-mode, html.dark-mode, body.dark, html.dark {
            background-color: #ffffff !important;
            color: #444444 !important;
            color-scheme: light !important;
          }
          
          .main-content {
            background-color: #ffffff !important;
          }
          
          .rc-old .sidebar {
            background-color: #f3f4f5 !important;
          }
          
          /* Force light theme on messages */
          .message, .message.own, .message.system {
            background-color: transparent !important;
            color: #444444 !important;
          }
          
          /* Explicitly target and override all dark mode settings */
          .dark-mode *, [data-theme="dark"] * {
            background-color: initial;
            color: initial;
          }
          
          /* Stop media queries from applying dark mode */
          @media (prefers-color-scheme: dark) {
            html, body, .main-content, * {
              background-color: #ffffff !important;
              color: #444444 !important;
              color-scheme: light !important;
            }
            
            /* Specific overrides for dark mode elements */
            .sidebar, .message-box, .rooms-list, .room-title, .message {
              background-color: #ffffff !important;
              color: #444444 !important;
            }
          }
        `;
        
        if (document.head.firstChild) {
          document.head.insertBefore(style, document.head.firstChild);
        } else {
          document.head.appendChild(style);
        }
        console.log('[Rocket.Chat Bridge] Added forced light theme styles');
      }
      
      try {
        const iframes = document.querySelectorAll('iframe');
        iframes.forEach(iframe => {
          try {
            const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
            if (iframeDoc) {
              iframeDoc.documentElement.setAttribute('data-theme', 'light');
              if (iframeDoc.body) {
                iframeDoc.body.classList.remove('dark-mode');
                iframeDoc.body.classList.add('light-mode');
                iframeDoc.body.style.colorScheme = 'light';
                iframeDoc.body.style.backgroundColor = '#ffffff';
                iframeDoc.body.style.color = '#444444';
              }
              
              if (iframeDoc.head && !iframeDoc.getElementById('light-theme-force')) {
                const iframeStyle = iframeDoc.createElement('style');
                iframeStyle.id = 'light-theme-force';
                iframeStyle.innerHTML = document.getElementById('light-theme-force').innerHTML;
                iframeDoc.head.appendChild(iframeStyle);
              }
            }
          } catch (e) {
            console.log('[Rocket.Chat Bridge] Could not access iframe content:', e);
          }
        });
      } catch (e) {
        console.error('[Rocket.Chat Bridge] Error applying theme to iframes:', e);
      }
      
      console.log('[Rocket.Chat Bridge] Light theme forced successfully');
    } catch (e) {
      console.error('[Rocket.Chat Bridge] Error forcing light theme:', e);
    }
  }
  
  forceLightTheme();
  
  setTimeout(forceLightTheme, 500);
  setTimeout(forceLightTheme, 1000);
  setTimeout(forceLightTheme, 3000);
  setTimeout(forceLightTheme, 5000);
  
  try {
    const themeObserver = new MutationObserver((mutations) => {
      let needsThemeReapply = false;
      
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes') {
          if (mutation.attributeName === 'data-theme') {
            const currentTheme = mutation.target.getAttribute('data-theme');
            if (currentTheme !== 'light') {
              needsThemeReapply = true;
            }
          } else if (mutation.attributeName === 'class') {
            if (mutation.target.classList.contains('dark-mode') || 
                mutation.target.classList.contains('dark')) {
              needsThemeReapply = true;
            }
          }
        }
      });
      
      if (needsThemeReapply) {
        console.log('[Rocket.Chat Bridge] Theme change detected, reapplying light theme');
        forceLightTheme();
      }
    });
    
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme', 'class']
    });
    
    if (document.body) {
      themeObserver.observe(document.body, {
        attributes: true,
        attributeFilter: ['class']
      });
    }
    
    const contentObserver = new MutationObserver((mutations) => {
      let hasNewContent = false;
      
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === 1) { // Element node
              hasNewContent = true;
            }
          });
        }
      });
      
      if (hasNewContent) {
        setTimeout(forceLightTheme, 100);
      }
    });
    
    contentObserver.observe(document, {
      childList: true,
      subtree: true
    });
    
    console.log('[Rocket.Chat Bridge] Set up observers to maintain light theme');
  } catch (e) {
    console.error('[Rocket.Chat Bridge] Error setting up theme observers:', e);
  }
  
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      console.log('[Rocket.Chat Bridge] Page became visible, reapplying light theme');
      forceLightTheme();
    }
  });
})(); 