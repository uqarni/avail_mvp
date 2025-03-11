import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import Joyride, { STATUS } from 'react-joyride';

function Chat() {
  const [chatOpen, setChatOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const location = useLocation();
  const [runTour, setRunTour] = useState(false);
  const [steps, setSteps] = useState([]);

  const toggleChat = () => {
    setChatOpen((prev) => !prev);
  };

  const handleSend = () => {
    if (inputText.trim() === '') return;

    setMessages((prev) => [...prev, { text: inputText, sender: 'user' }]);

    if (inputText.toLowerCase().trim() === 'building list') {
      startBuildingListTour();

      setTimeout(() => {
        setMessages((prev) => [
          ...prev,
          { text: "In order to start a building list, you need to click at the highlighted button. I'll show you where.", sender: 'bot' },
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

  const startBuildingListTour = () => {
    // Check which page we're on based on URL path
    const isDashboard = location.pathname === '/';

    if (isDashboard) {
      setSteps([
        {
          target: '.build-listing-btn',
          content: 'Click this button to start building your listing',
          disableBeacon: true,
          placement: 'bottom',
          disableOverlayClose: true,
          spotlightClicks: true
        }
      ]);
    } else {
      setSteps([
        {
          target: '.listing-builder-sidebar',
          content: 'These are the steps to complete your listing',
          disableBeacon: true,
          placement: 'right',
          disableOverlayClose: true,
          spotlightClicks: true
        }
      ]);
    }

    setRunTour(true);
  };

  const handleJoyrideCallback = (data) => {
    const { status } = data;

    if ([STATUS.FINISHED, STATUS.SKIPPED].includes(status)) {
      setRunTour(false);
    }
  };

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
            primaryColor: '#0077cc',
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