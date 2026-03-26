import React from 'react';
import ReactDOM from 'react-dom/client';
import IdeaBook from './App';

// Register service worker for offline/PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  });
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <IdeaBook />
  </React.StrictMode>
);
