import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

console.log('=== MAIN.TSX EXECUTING ===');

const rootElement = document.getElementById('root');

if (!rootElement) {
  console.error('❌ Root element not found!');
} else {
  try {
    ReactDOM.createRoot(rootElement).render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
    console.log('✅ React app rendered');
  } catch (error) {
    console.error('❌ Error rendering:', error);
    rootElement.innerHTML = `<div style="padding: 50px; color: red;"><h1>ERROR:</h1><pre>${error}</pre></div>`;
  }
}

