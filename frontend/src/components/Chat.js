import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import Tippy from '@tippyjs/react';
import 'tippy.js/dist/tippy.css';
import 'tippy.js/themes/light.css';

function Chat() {
  const location = useLocation();
  const [chatOpen, setChatOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipTarget, setTooltipTarget] = useState(null);
  const [tooltipContent, setTooltipContent] = useState('');
  const [guideStep, setGuideStep] = useState(0); // 0: inactive, 1: dashboard, 2: listing builder
  const tippyRef = useRef(null);

  useEffect(() => {
    const savedMessages = localStorage.getItem('chatMessages');
    if (savedMessages) {
      setMessages(JSON.parse(savedMessages));
    }

    const wasChatOpen = localStorage.getItem('chatOpen') === 'true';
    if (wasChatOpen) {
      setChatOpen(true);
    }

    const savedGuideStep = localStorage.getItem('guideStep');
    if (savedGuideStep) {
      const step = parseInt(savedGuideStep);
      setGuideStep(step);

      if (step === 2 && location.pathname === '/listing-builder') {
        setChatOpen(true);

        setTimeout(() => {
          highlightListingBuilderSidebar();
        }, 800);
      }
    }
  }, [location.pathname]);

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

  useEffect(() => {
    if (showTooltip) {
      let selector;

      if (guideStep === 1) {
        selector = '.build-listing-btn';
      } else if (guideStep === 2) {
        selector = '.listing-builder-sidebar';
      } else {
        return;
      }

      const findElement = () => {
        const targetElement = document.querySelector(selector);

        if (targetElement) {
          // Highlight the element
          targetElement.style.boxShadow = '0 0 0 4px rgba(0, 119, 204, 0.7)';
          targetElement.style.position = 'relative';
          targetElement.style.zIndex = '100';

          // Set it as our tooltip target
          setTooltipTarget(targetElement);

          // Add click listener to handle progression
          const handleClick = () => {
            if (guideStep === 1) {
              // User clicked the BUILD LISTING button
              setShowTooltip(false);
              setGuideStep(2); // Set step for when we reach the listing page
            } else if (guideStep === 2) {
              // User clicked on the sidebar
              setShowTooltip(false);
              setGuideStep(0)
            }
          };

          targetElement.addEventListener('click', handleClick);

          return () => {
            targetElement.style.boxShadow = '';
            targetElement.style.position = '';
            targetElement.style.zIndex = '';
            targetElement.removeEventListener('click', handleClick);
          };
        } else {
          const retryTimer = setTimeout(findElement, 200);
          return () => clearTimeout(retryTimer);
        }
      };

      return findElement();
    }
  }, [showTooltip, guideStep]);

  const toggleChat = () => {
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
    setGuideStep(1);
    setTooltipContent('Click this button to start building your listing');
    setShowTooltip(true);
  };

  const highlightListingBuilderSidebar = () => {
    setTooltipContent('These are the steps to complete your listing. Click on each step to fill out the information.');
    setShowTooltip(true);

    setMessages((prev) => [
      ...prev,
      {
        text: "Great! Now you're in the listing builder. The sidebar on the left shows all the steps you need to complete to create your listing.",
        sender: 'bot'
      },
    ]);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSend();
    }
  };

  return (
    <>
      {showTooltip && tooltipTarget && (
        <Tippy
          ref={tippyRef}
          content={
            <div style={{ padding: '5px', minWidth: '200px' }}>
              <p>{tooltipContent}</p>
              <button
                onClick={() => {
                  setShowTooltip(false);
                  if (guideStep === 2) {
                    setGuideStep(0); // End the guide
                  }
                }}
                style={{
                  padding: '5px 10px',
                  background: '#0077cc',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  float: 'right',
                  marginTop: '5px',
                  cursor: 'pointer'
                }}
              >
                Got it
              </button>
            </div>
          }
          visible={showTooltip}
          placement={guideStep === 1 ? 'bottom' : 'right'}
          theme="light"
          interactive={true}
          appendTo={document.body}
          onClickOutside={() => {
            setShowTooltip(false);
            if (guideStep === 2) {
              setGuideStep(0);
            }
          }}
          reference={tooltipTarget}
        />
      )}

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