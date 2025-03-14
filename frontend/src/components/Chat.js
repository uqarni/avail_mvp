import React, {useCallback, useEffect, useState} from 'react';
import TourManager from './TourManager';
import {processChatMessage} from '../services/TourService';

function Chat() {
  const [chatOpen, setChatOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');

  const [tourType, setTourType] = useState(null);
  const [tourStep, setTourStep] = useState(0);

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

    const savedTourType = localStorage.getItem('tourType');
    const savedTourStep = localStorage.getItem('tourStep');

    if (savedTourType && savedTourStep) {
      try {
        const step = parseInt(savedTourStep);
        if (step > 0) {
          setTourType(savedTourType);
          setTourStep(step);
          setChatOpen(true);
        }
      } catch (e) {
        console.error("Error loading tour state:", e);
        localStorage.removeItem('tourType');
        localStorage.removeItem('tourStep');
      }
    }
  }, []);

  useEffect(() => {
    if (messages.length > 0) {
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
    if (tourType && tourStep > 0) {
      localStorage.setItem('tourType', tourType);
      localStorage.setItem('tourStep', tourStep.toString());
    } else {
      localStorage.removeItem('tourType');
      localStorage.removeItem('tourStep');
    }
  }, [tourType, tourStep]);

  const toggleChat = () => {
    if (chatOpen) {
      setMessages([]);
      localStorage.removeItem('chatMessages');
    }
    setChatOpen((prev) => !prev);
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

    setMessages((prev) => [...prev, { text: inputText, sender: 'user' }]);
    const userMessage = inputText;
    setInputText('');

    try {
      const response = await processChatMessage(userMessage);

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
    } catch (error) {
      console.error('Error processing message:', error);
      setTimeout(() => {
        setMessages((prev) => [
          ...prev,
          { text: "Sorry, I'm having trouble responding right now.", sender: 'bot' }
        ]);
      }, 500);
    }
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

      <TourManager
        tourType={tourType}
        step={tourStep}
        onStepChange={handleTourStepChange}
        onTourComplete={handleTourComplete}
        onAddMessage={handleAddTourMessage}
      />
    </>
  );
}

export default Chat;