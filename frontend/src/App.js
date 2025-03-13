import React from 'react';
import { BrowserRouter, Switch, Route } from 'react-router-dom';
import Dashboard from './components/Dashboard';
import ListingBuilder from './components/ListingBuilder';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <Switch>
        <Route exact path="/" component={Dashboard} />
        <Route path="/listing-builder" component={ListingBuilder} />
      </Switch>
    </BrowserRouter>
  );
}

export default App;