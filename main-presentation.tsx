import React from 'react';
import './lib/font-loader';
import ReactDOM from 'react-dom/client';
import PresentationPage from './pages/presentation';
import './styles/globals.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <PresentationPage />
  </React.StrictMode>
);
