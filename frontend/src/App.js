import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Dashboard from './components/Dashboard';
import ListingBuilder from './components/ListingBuilder';
import ChatService from './components/ChatService';
import './App.css';

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <ChatService 
          apiBaseUrl={process.env.REACT_APP_API_BASE_URL || 'http://0.0.0.0:8081'}
          rocketChatConfig={{
            rocketChatHost: process.env.REACT_APP_ROCKET_CHAT_HOST,
            adminUser: process.env.REACT_APP_ROCKET_CHAT_USER,
            adminPass: process.env.REACT_APP_ROCKET_CHAT_PASS,
            roomId: process.env.REACT_APP_ROCKET_CHAT_ROOM || 'GENERAL'
          }}
          chatToggleLabel="Chat"
          chatToggleCloseLabel="X"
          shouldResetChatOnMount={false}
          clearHistoryOnNewSession={true}
        />
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/listing" element={<ListingBuilder />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
