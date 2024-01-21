import React from 'react';
import { BrowserRouter, Routes, Route } from "react-router-dom"; import './App.css';
import Nav from './components/Nav';
import Home from './views/Home';
import Item from './views/Item';

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Nav />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="item" element={<Item />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
