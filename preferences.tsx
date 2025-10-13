import React from 'react';
import ReactDOM from 'react-dom/client';
import './styles/globals.css';
import { SettingsProvider } from './contexts/SettingsContext';
import PreferencesWindow from './components/PreferencesWindow';

ReactDOM.createRoot(document.getElementById('preferences-root') as HTMLElement).render(
  <React.StrictMode>
    <SettingsProvider>
      <PreferencesWindow />
    </SettingsProvider>
  </React.StrictMode>
);
