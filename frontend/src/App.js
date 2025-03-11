import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Dashboard from './components/Dashboard';
import ListingBuilder from './components/ListingBuilder';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/listing-builder" element={<ListingBuilder />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;