import React, { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import TourManager from './TourManager';
import { processChatMessage } from '../services/TourService';
import { performHealthCheck } from '../api/ApiService';

function Chat() {
  const location = useLocation();
  const [chatOpen, setChatOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [tourType, setTourType] = useState(null);
  const [tourStep, setTourStep] = useState(0);
  const [routeChanged, setRouteChanged] = useState(false);

  useEffect(() => {
    setRouteChanged(true);
  }, [location.pathname]);

  useEffect(() => {
    const wasChatOpen = localStorage.getItem('chatOpen') === 'true';
    if (wasChatOpen) {
      setChatOpen(true);
    }

    const savedTourType = localStorage.getItem('tourType');
    const savedTourStep = localStorage.getItem('tourStep');

    if (savedTourType && savedTourStep) {
      const step = parseInt(savedTourStep);
      if (step > 0) {
        setTourType(savedTourType);
        setTourStep(step);
      }
    }
  }, []);

  useEffect(() => {
    if (tourType && tourStep > 0) {
      localStorage.setItem('tourType', tourType);
      localStorage.setItem('tourStep', tourStep.toString());
    } else {
      localStorage.removeItem('tourType');
      localStorage.removeItem('tourStep');
    }
  }, [tourType, tourStep]);

  useEffect(() => {
    localStorage.setItem('chatOpen', chatOpen.toString());
  }, [chatOpen]);

  const toggleChat = () => {
    setChatOpen((prev) => !prev);
    if (!chatOpen) {
      setMessages([]);
    }
  };

  const handleTourStepChange = useCallback((newStep) => {
    setTourStep(newStep);
  }, []);

  const handleTourComplete = useCallback(() => {
    setTourType(null);
    setTourStep(0);
  }, []);

  const handleAddTourMessage = useCallback((message) => {
    if (!message) return;

    setMessages((prev) => [
      ...prev,
      { text: message, sender: 'bot' }
    ]);
  }, []);

  const handleSend = async () => {
    if (inputText.trim() === '') return;

    try {
      await performHealthCheck();
    } catch(e) {
      console.error("Health check failed ", e);
    }

    const userMessage = inputText;
    setMessages((prev) => [...prev, { text: userMessage, sender: 'user' }]);
    setInputText('');

    const response = processChatMessage(userMessage);

    if (response.tourType) {
      setTourType(response.tourType);
      setTourStep(response.step);

      setTimeout(() => {
        setMessages((prev) => [
          ...prev,
          { text: response.message, sender: 'bot' }
        ]);
      }, 500);
    } else {
      setTimeout(() => {
        setMessages((prev) => [
          ...prev,
          { text: response.message, sender: 'bot' }
        ]);
      }, 500);
    }
  };

  // Handle "Enter" key press in the input field
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSend();
    }
  };

  return (
    <>
      {tourType && tourStep > 0 && (
        <TourManager
          tourType={tourType}
          step={tourStep}
          onStepChange={handleTourStepChange}
          onTourComplete={handleTourComplete}
          onAddMessage={handleAddTourMessage}
          key={`${tourType}-${tourStep}-${location.pathname}`}
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