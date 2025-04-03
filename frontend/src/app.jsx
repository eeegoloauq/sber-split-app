import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Header from './components/header/header.jsx';
import HomePage from './pages/HomePage';
// import Footer from './components/Footer/Footer';
// import './App.css';

function App() {
  return (
    <div className="app-container">
      <Header />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<HomePage />} />
        </Routes>
      </main>
      {/* <Footer /> */}
    </div>
  );
}

export default App;