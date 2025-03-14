import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Joyride, { STATUS } from 'react-joyride';

function Chat() {
  const location = useLocation();
  const navigate = useNavigate();
  const firstRenderRef = useRef(true);
  const tourInProgressRef = useRef(false);

  // Chat state
  const [chatOpen, setChatOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');

  // Tour state
  const [runTour, setRunTour] = useState(false);
  const [steps, setSteps] = useState([]);
  const [tourRequested, setTourRequested] = useState(false);

  // Only run on first render
  useEffect(() => {
    if (firstRenderRef.current) {
      const inProgressTour = localStorage.getItem('tourInProgress') === 'true';
      if (inProgressTour) {
        tourInProgressRef.current = true;
        setTourRequested(true);

        if (location.pathname.includes('listing-builder')) {
          setChatOpen(true);
        }
      }

      firstRenderRef.current = false;
    }
  }, [location.pathname]);

  const setupTourBasedOnLocation = useCallback(() => {
    if (!tourRequested) return;

    console.log("SETTING UP TOUR FOR:", location.pathname);

    tourInProgressRef.current = true;
    localStorage.setItem('tourInProgress', 'true');

    if (location.pathname === '/' || location.pathname === '') {
      // Add a slight delay to make sure the DOM is fully loaded
      setTimeout(() => {
        const buildButton = document.querySelector('.build-listing-btn');
        console.log("Build button found:", buildButton);

        if (buildButton) {
          setSteps([{
            target: '.build-listing-btn',
            content: 'Click this button to start building your listing',
            disableBeacon: true,
            placement: 'bottom',
            spotlightClicks: true,
            disableOverlayClose: true,
          }]);
          setRunTour(true);
        } else {
          console.log("BUILD BUTTON NOT FOUND");
        }
      }, 500);
    }
    else if (location.pathname.includes('listing-builder')) {
      setChatOpen(true);

      const checkForSidebar = () => {
        const sidebar = document.querySelector('.listing-builder-sidebar');

        if (sidebar) {
          setSteps([{
            target: '.listing-builder-sidebar',
            content: 'These are the steps to complete your listing',
            disableBeacon: true,
            placement: 'right',
            spotlightClicks: true,
            disableOverlayClose: true,
          }]);
          setRunTour(true);

          setMessages(prev => [
            ...prev,
            {
              text: "Great! Now you're in the listing builder. The sidebar shows all the steps to create your listing.",
              sender: 'bot'
            }
          ]);
        } else {
          console.log("SIDEBAR NOT FOUND, TRYING AGAIN IN 1 SECOND");
          setTimeout(checkForSidebar, 1000);
        }
      };

      checkForSidebar();
    }
  }, [location.pathname, tourRequested, setMessages]);

  // This effect will run when tourRequested changes
  useEffect(() => {
    if (tourRequested) {
      setupTourBasedOnLocation();
    }
  }, [tourRequested, setupTourBasedOnLocation]);

  // This effect handles specific behavior for the listing-builder path
  useEffect(() => {
    if (location.pathname.includes('listing-builder') && tourInProgressRef.current) {
      setChatOpen(true);
      setTourRequested(true);
    }
  }, [location.pathname]);

  // Handle Joyride events
  const handleJoyrideCallback = (data) => {
    const { status, action, type } = data;
    console.log("JOYRIDE CALLBACK:", status, action, type);

    if ([STATUS.FINISHED, STATUS.SKIPPED].includes(status)) {
      setRunTour(false);

      if (
        (location.pathname === '/' || location.pathname === '') &&
        type === 'step:after' &&
        action !== 'skip'
      ) {
        navigate('/listing-builder');
      }
      else if (location.pathname.includes('listing-builder')) {
        setTourRequested(false);
        tourInProgressRef.current = false;
        localStorage.removeItem('tourInProgress');
      }
    }
  };

  const toggleChat = () => {
    setChatOpen(prev => !prev);
  };

  // Start the tour explicitly
  const startTour = () => {
    setTourRequested(true);
    tourInProgressRef.current = true;
    localStorage.setItem('tourInProgress', 'true');
    setupTourBasedOnLocation();
  };

  const handleSend = () => {
    if (inputText.trim() === '') return;

    setMessages(prev => [...prev, { text: inputText, sender: 'user' }]);

    if (inputText.toLowerCase().includes('building list')) {
      setTimeout(() => {
        setMessages(prev => [
          ...prev,
          {
            text: "In order to start a building list, you need to click at the highlighted button. I'll show you where.",
            sender: 'bot'
          }
        ]);

        // Start the tour after adding the message
        startTour();
      }, 500);
    }
    else {
      setTimeout(() => {
        setMessages(prev => [
          ...prev,
          { text: 'Hello, how can I help you today?', sender: 'bot' }
        ]);
      }, 500);
    }

    setInputText('');
  };

  // Handle pressing Enter in the input field
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSend();
    }
  };

  return (
    <>
      <Joyride
        steps={steps}
        run={runTour}
        continuous={false}
        showSkipButton={true}
        callback={handleJoyrideCallback}
        styles={{
          options: {
            primaryColor: '#0a2f5e',
            zIndex: 10000,
          }
        }}
      />

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