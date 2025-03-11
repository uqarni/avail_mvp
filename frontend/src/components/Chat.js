import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

function Chat() {
  const location = useLocation();
  const navigate = useNavigate();
  const [chatOpen, setChatOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [guideStep, setGuideStep] = useState(0); // 0: inactive, 1: dashboard, 2: listing builder
  const [highlightApplied, setHighlightApplied] = useState(false);

  // Define functions with useCallback to prevent unnecessary re-renders
  const clearHighlights = useCallback(() => {
    const highlightedElements = document.querySelectorAll('.highlight-element');
    highlightedElements.forEach(el => el.classList.remove('highlight-element'));
    setHighlightApplied(false);
  }, []);

  const highlightElements = useCallback(() => {
    // Prevent highlighting if we've already applied it or guide step is 0
    if (highlightApplied || guideStep === 0) return;

    // Check which page we're on based on URL path and guide step
    console.log("Applying highlights for step:", guideStep, "on path:", location.pathname);

    if (guideStep === 1 && location.pathname === '/') {
      // Highlight BUILD LISTING button on dashboard
      const buildButton = document.querySelector('.build-listing-btn');
      if (buildButton) {
        console.log("Found button, adding highlight");
        buildButton.classList.add('highlight-element');

        // Add click handler directly to the button
        const handleButtonClick = (event) => {
          // Prevent the default form submission (if any)
          event.preventDefault();
          event.stopPropagation();

          // Clear highlight before navigation
          clearHighlights();

          // Set guide step for next page
          setGuideStep(2);

          // Navigate programmatically
          navigate('/listing-builder');
        };

        // Remove existing click handlers by cloning the button
        const newButton = buildButton.cloneNode(true);
        buildButton.parentNode.replaceChild(newButton, buildButton);

        // Add our click handler
        newButton.addEventListener('click', handleButtonClick);

        setHighlightApplied(true);
      } else {
        console.log("Button not found");
      }
    } else if (guideStep === 2 && location.pathname === '/listing-builder') {
      // Highlight all steps in the left sidebar of ListingBuilder
      const stepItems = document.querySelectorAll('.step-item');
      console.log("Found step items:", stepItems.length);

      if (stepItems.length > 0) {
        stepItems.forEach(item => {
          item.classList.add('highlight-element');
        });
        setHighlightApplied(true);
      }
    }
  }, [guideStep, location.pathname, clearHighlights, navigate, highlightApplied]);

  // Only restore guide state on initial load
  const isInitialMount = React.useRef(true);

  // Load saved state when component mounts (only once)
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;

      const savedMessages = localStorage.getItem('chatMessages');
      if (savedMessages) {
        setMessages(JSON.parse(savedMessages));
      }

      const wasChatOpen = localStorage.getItem('chatOpen') === 'true';
      if (wasChatOpen) {
        setChatOpen(true);
      }

      // Only restore guide step if we're on the right page
      const savedGuideStep = localStorage.getItem('guideStep');
      if (savedGuideStep) {
        const step = parseInt(savedGuideStep);

        if ((step === 1 && location.pathname === '/') ||
            (step === 2 && location.pathname === '/listing-builder')) {
          setGuideStep(step);
        } else {
          // Clear guide step if we're on the wrong page
          localStorage.removeItem('guideStep');
        }
      }
    }
  }, [location.pathname]);

  // Handle actions when reaching the listing builder page
  useEffect(() => {
    if (guideStep === 2 && location.pathname === '/listing-builder') {
      // Make sure chat is open
      setChatOpen(true);

      // Add message explaining the sidebar (if it doesn't exist)
      const sidebarMessageExists = messages.some(
        msg => msg.sender === 'bot' && msg.text.includes("Now you're in the listing builder")
      );

      if (!sidebarMessageExists) {
        setTimeout(() => {
          setMessages(prev => [
            ...prev,
            {
              text: "Great! Now you're in the listing builder. The sidebar on the left shows all the steps you need to complete to create your listing.",
              sender: 'bot'
            }
          ]);
        }, 800);
      }
    }
  }, [guideStep, location.pathname, messages]);

  // Save chat state to localStorage
  useEffect(() => {
    localStorage.setItem('chatMessages', JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    localStorage.setItem('chatOpen', chatOpen.toString());
  }, [chatOpen]);

  useEffect(() => {
    if (guideStep > 0) {
      localStorage.setItem('guideStep', guideStep.toString());
    } else {
      localStorage.removeItem('guideStep');
    }
  }, [guideStep]);

  // Apply highlighting when guide step changes or on pathname change
  useEffect(() => {
    if (guideStep > 0) {
      // Clear any existing highlights first
      clearHighlights();

      // Apply highlights with delay to ensure DOM is ready
      const highlightTimer = setTimeout(() => {
        highlightElements();
      }, 500);

      return () => {
        clearTimeout(highlightTimer);
        clearHighlights();
      };
    } else {
      clearHighlights();
    }
  }, [guideStep, location.pathname, clearHighlights, highlightElements]);

  const toggleChat = () => {
    setChatOpen((prev) => !prev);
  };

  const handleSend = () => {
    if (inputText.trim() === '') return;

    setMessages((prev) => [...prev, { text: inputText, sender: 'user' }]);

    // Check for the trigger phrase "building list"
    if (inputText.toLowerCase().includes('building list')) {
      // Reset guide step and highlight state
      clearHighlights();
      setHighlightApplied(false);

      // Start the guide
      setTimeout(() => {
        setGuideStep(1);

        setMessages((prev) => [
          ...prev,
          {
            text: "Let me guide you through creating a listing. First, click the highlighted 'BUILD LISTING' button.",
            sender: 'bot'
          },
        ]);
      }, 300);
    } else {
      setTimeout(() => {
        setMessages((prev) => [
          ...prev,
          { text: 'Hello, how can I help you today?', sender: 'bot' },
        ]);
      }, 1000);
    }

    setInputText('');
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSend();
    }
  };

  return (
    <>
      <button className="chat-toggle-button" onClick={toggleChat}>
        {chatOpen ? 'X' : 'Chat'}
      </button>

      {chatOpen && (
        <div className="chat-modal">
          <div className="chat-modal-content">
            <button className="close-chat" onClick={toggleChat}>
              &times;
            </button>
            <h2>Avail Intelligence Support</h2>
            <div className="chat-interface">
              <div className="chat-messages">
                {messages.map((msg, index) => (
                  <div key={index} className={`chat-message ${msg.sender}`}>
                    <p>{msg.text}</p>
                  </div>
                ))}
              </div>
              <div className="chat-input-container">
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type a message..."
                />
                <button onClick={handleSend}>Send</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default Chat;