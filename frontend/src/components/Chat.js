import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';

function Chat() {
  const [chatOpen, setChatOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const location = useLocation();

  const toggleChat = () => {
    setChatOpen((prev) => !prev);
  };

  const handleSend = () => {
    if (inputText.trim() === '') return;

    setMessages((prev) => [...prev, { text: inputText, sender: 'user' }]);

    // Check for the trigger phrase "building list"
    if (inputText.toLowerCase().includes('building list')) {
      highlightElements();

      setTimeout(() => {
        setMessages((prev) => [
          ...prev,
          { text: "In order to start a building list you need to click at the button highlighted.", sender: 'bot' },
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

  const highlightElements = () => {
    clearHighlights();

    // Check which page we're on based on URL path
    const isDashboard = location.pathname === '/';

    if (isDashboard) {
      // Highlight BUILD LISTING button on dashboard
      const buildButton = document.querySelector('.build-listing-btn');
      if (buildButton) {
        buildButton.classList.add('highlight-element');
      }
    } else {
      // Highlight all steps in the left sidebar of ListingBuilder
      const stepItems = document.querySelectorAll('.step-item');
      if (stepItems.length > 0) {
        stepItems.forEach(item => {
          item.classList.add('highlight-element');
        });
      }
    }
  };

  const clearHighlights = () => {
    const highlightedElements = document.querySelectorAll('.highlight-element');
    highlightedElements.forEach(el => el.classList.remove('highlight-element'));
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