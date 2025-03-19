import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import TourManager from './TourManager';
import { callGepeto } from '../api/ApiService';

function Chat() {
  const location = useLocation();
  const prevLocationRef = useRef(location.pathname);

  const [highlightedElement, setHighlightedElement] = useState(null);
  const [pendingHighlight, setPendingHighlight] = useState(null);

  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [chatOpen, setChatOpen] = useState(false);

  const isMounted = useRef(true);
  useEffect(() => () => { isMounted.current = false; }, []);

  useEffect(() => {
    if (location.pathname !== prevLocationRef.current) {
      console.log(`Page changed from ${prevLocationRef.current} to ${location.pathname}`);
      prevLocationRef.current = location.pathname;

      setHighlightedElement(null);

      if (pendingHighlight) {
        console.log(`Will attempt to highlight ${pendingHighlight} after page transition`);
        setTimeout(() => {
          const el = document.querySelector(pendingHighlight);
          if (el) {
            console.log(`Element ${pendingHighlight} found after page transition, highlighting it`);
            setHighlightedElement(pendingHighlight);
          } else {
            console.warn(`Element ${pendingHighlight} not found after page transition`);
          }
        }, 500);
      }
    }
  }, [location.pathname, pendingHighlight]);

  const toggleChat = () => {
    setChatOpen((prev) => !prev);
    if (!chatOpen) {
      setMessages([]);
    }
  };

  // 1) Send a user message to the AI
  const handleSend = async () => {
    if (!inputText.trim()) return;

    setMessages((prev) => [...prev, { text: inputText, sender: 'user' }]);
    const userMessage = inputText;
    setInputText('');

    try {
      const gepetoResponse = await callGepeto(userMessage);
      console.log("Gepeto Response:", gepetoResponse);

      if (!isMounted.current) return;

      if (gepetoResponse) {
        setMessages((prev) => [
          ...prev,
          { text: gepetoResponse.message, sender: 'bot' }
        ]);

        if (gepetoResponse.functionCall) {
          console.log(`Pending highlight: ${gepetoResponse.functionCall}`);
          setPendingHighlight(gepetoResponse.functionCall);

          const el = document.querySelector(gepetoResponse.functionCall);
          if (el) {
            console.log(`Element ${gepetoResponse.functionCall} found, highlighting immediately`);
            setHighlightedElement(gepetoResponse.functionCall);
          } else {
            console.log(`Element ${gepetoResponse.functionCall} not found yet, will poll for it`);
          }
        } else {
          setPendingHighlight(null);
          setHighlightedElement(null);
        }
      } else {
        setMessages((prev) => [
          ...prev,
          { text: "Sorry, I'm having trouble understanding you right now.", sender: 'bot' }
        ]);
      }
    } catch (error) {
      console.error('Error processing message:', error);
      if (!isMounted.current) return;
      setMessages((prev) => [
        ...prev,
        { text: "Sorry, I'm having trouble responding right now.", sender: 'bot' }
      ]);
    }
  };

  // 2) Whenever the user clicks a highlighted element, call the AI again
  const handleElementClick = async (selector) => {
    console.log(`User clicked: ${selector} on ${location.pathname}`);

    try {
      const response = await callGepeto(`the user clicked on ${selector} on ${location.pathname}`);
      console.log("AI responded after click:", response);

      if (!isMounted.current) return;

      // Show AI's message
      if (response?.message) {
        setMessages((prev) => [
          ...prev,
          { text: response.message, sender: 'bot' }
        ]);
      }

      // If the AI wants to highlight something else
      if (response?.functionCall) {
        setPendingHighlight(response.functionCall);

        const el = document.querySelector(response.functionCall);
        if (el) {
          console.log(`Element ${response.functionCall} found, highlighting immediately`);
          setHighlightedElement(response.functionCall);
        }
      } else {
        setPendingHighlight(null);
        setHighlightedElement(null);
      }
    } catch (err) {
      console.error("Error after click:", err);
      if (!isMounted.current) return;
      setPendingHighlight(null);
      setHighlightedElement(null);
    }
  };

  useEffect(() => {
    if (!pendingHighlight) return;

    let attempts = 0;
    const maxAttempts = 20;
    const interval = setInterval(() => {
      attempts++;
      const el = document.querySelector(pendingHighlight);
      if (el) {
        console.log(`Found element ${pendingHighlight}, highlighting it now`);
        setHighlightedElement(pendingHighlight);
        setPendingHighlight(null);
        clearInterval(interval);
      } else if (attempts >= maxAttempts) {
        console.log(`Element ${pendingHighlight} not found after ${maxAttempts} attempts, giving up`);
        setPendingHighlight(null);
        clearInterval(interval);
      }
    }, 500);

    return () => clearInterval(interval);
  }, [pendingHighlight]);

  return (
    <>
      {highlightedElement && (
        <TourManager
          highlightClass={highlightedElement}
          onElementClick={handleElementClick}
          onTourComplete={() => setHighlightedElement(null)}
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
                  onKeyPress={(e) => { if (e.key === 'Enter') handleSend(); }}
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