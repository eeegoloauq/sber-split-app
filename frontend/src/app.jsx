    // frontend/src/app.jsx
    import React from 'react';
    import { Routes, Route } from 'react-router-dom';
    import Header from './components/header/header.jsx';
    import HomePage from './pages/HomePage';
    import ReceiptPage from './pages/ReceiptPage';

    function App() {
      return (
        <div className="app-container">
          <Header />
          <main className="main-content">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/receipt/:receiptId" element={<ReceiptPage />} />
            </Routes>
          </main>
          {/* <Footer /> */}
        </div>
      );
    }

    export default App;