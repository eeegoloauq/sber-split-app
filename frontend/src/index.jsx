import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './app.jsx'; // Импортируем App
// 1. Импортируем BrowserRouter
import { BrowserRouter } from 'react-router-dom'; 
import './index.css'; 

const root = ReactDOM.createRoot(document.getElementById('root')); 
root.render(
  <React.StrictMode>
    {/* 2. Оборачиваем App */}
    <BrowserRouter>
      <App /> 
    </BrowserRouter>
  </React.StrictMode>
);