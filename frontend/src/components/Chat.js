import React, { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';

function Chat() {
  const location = useLocation();
  const [chatOpen, setChatOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [guideStep, setGuideStep] = useState(0); // 0: inactive, 1: dashboard, 2: listing builder
  const [highlightApplied, setHighlightApplied] = useState(false);

  const highlightListingBuilderSidebar = useCallback(() => {
    clearHighlights();

    setGuideStep(2);

    setMessages((prev) => [
      ...prev,
      {
        text: "Great! Now you're in the listing builder. The sidebar on the left shows all the steps you need to complete to create your listing.",
        sender: 'bot'
      },
    ]);
  }, []);

  const clearHighlights = useCallback(() => {
    const highlightedElements = document.querySelectorAll('.highlight-element');
    highlightedElements.forEach(el => {
      el.classList.remove('highlight-element');
    });
    setHighlightApplied(false);
  }, []);

  useEffect(() => {
    const wasChatOpen = localStorage.getItem('chatOpen') === 'true';
    if (wasChatOpen) {
      setChatOpen(true);

      const savedMessages = localStorage.getItem('chatMessages');
      if (savedMessages) {
        try {
          const parsedMessages = JSON.parse(savedMessages);
          const limitedMessages = parsedMessages.slice(-3);
          setMessages(limitedMessages);
        } catch (e) {
          console.error("Error loading saved messages:", e);
          localStorage.removeItem('chatMessages');
        }
      }
    }

    const savedGuideStep = localStorage.getItem('guideStep');
    if (savedGuideStep) {
      try {
        const step = parseInt(savedGuideStep);

        // Only restore guide step if we're on the right page
        if ((step === 1 && location.pathname === '/') ||
            (step === 2 && location.pathname === '/listing-builder')) {
          setGuideStep(step);

          // If on step 2, ensure chat is open and show sidebar highlight
          if (step === 2 && location.pathname === '/listing-builder') {
            setChatOpen(true);
            setTimeout(() => {
              highlightListingBuilderSidebar();
            }, 800);
          }
        } else {
          localStorage.removeItem('guideStep');
        }
      } catch (e) {
        console.error("Error parsing guide step:", e);
        localStorage.removeItem('guideStep');
      }
    }
  }, [location.pathname, highlightListingBuilderSidebar]);

  useEffect(() => {
    if (messages.length > 0) {
      // Only keep the last 3 messages
      const limitedMessages = messages.slice(-3);
      localStorage.setItem('chatMessages', JSON.stringify(limitedMessages));
    } else {
      localStorage.removeItem('chatMessages');
    }
  }, [messages]);

  useEffect(() => {
    localStorage.setItem('chatOpen', chatOpen.toString());

    if (!chatOpen) {
      setMessages([]);
      localStorage.removeItem('chatMessages');
    }
  }, [chatOpen]);

  useEffect(() => {
    if (guideStep > 0) {
      localStorage.setItem('guideStep', guideStep.toString());
    } else {
      localStorage.removeItem('guideStep');
    }
  }, [guideStep]);

  // Handle element highlighting based on guide step
  useEffect(() => {
    if (guideStep === 0 || highlightApplied) {
      return;
    }

    const highlightTimer = setTimeout(() => {
      if (guideStep === 1 && location.pathname === '/') {
        // Highlight BUILD LISTING button
        const buildButton = document.querySelector('.build-listing-btn');
        if (buildButton) {
          console.log("Highlighting BUILD LISTING button");
          buildButton.classList.add('highlight-element');

          const handleButtonClick = () => {
            buildButton.classList.remove('highlight-element');
            setGuideStep(2);
          };

          buildButton.addEventListener('click', handleButtonClick, { once: true });
          setHighlightApplied(true);
        }
      } else if (guideStep === 2 && location.pathname === '/listing-builder') {
        // Highlight sidebar items
        const sidebarItems = document.querySelectorAll('.step-item');
        if (sidebarItems.length > 0) {
          console.log(`Found ${sidebarItems.length} step items to highlight`);
          sidebarItems.forEach(item => {
            item.classList.add('highlight-element');
          });
          setHighlightApplied(true);
        }
      }
    }, 500);

    return () => {
      clearTimeout(highlightTimer);
    };
  }, [guideStep, location.pathname, highlightApplied, highlightListingBuilderSidebar]);

  const toggleChat = () => {
    if (chatOpen) {
      setMessages([]);
      localStorage.removeItem('chatMessages');
    }
    setChatOpen((prev) => !prev);
  };

  const handleSend = () => {
    if (inputText.trim() === '') return;

    setMessages((prev) => [...prev, { text: inputText, sender: 'user' }]);

    if (inputText.toLowerCase().trim() === 'building list') {
      startBuildingListGuide();

      setTimeout(() => {
        setMessages((prev) => [
          ...prev,
          {
            text: "Let me guide you through creating a listing. First, click the highlighted 'BUILD LISTING' button.",
            sender: 'bot'
          },
        ]);
      }, 1000);
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

  const startBuildingListGuide = () => {
    clearHighlights();
    setGuideStep(1);
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