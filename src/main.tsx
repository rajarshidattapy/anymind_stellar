import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Validate required environment variables
if (!import.meta.env.VITE_API_BASE_URL) {
  console.error('❌ VITE_API_BASE_URL is not set!');
  // Show user-friendly error in production
  if (import.meta.env.PROD) {
    document.body.innerHTML = `
      <div style="display: flex; justify-content: center; align-items: center; height: 100vh; font-family: sans-serif; background: #111827; color: #f3f4f6;">
        <div style="text-align: center; padding: 2rem;">
          <h1 style="font-size: 2rem; margin-bottom: 1rem; color: #ef4444;">Configuration Error</h1>
          <p style="font-size: 1.125rem; margin-bottom: 0.5rem;">VITE_API_BASE_URL environment variable is not set.</p>
          <p style="font-size: 1rem; color: #9ca3af;">Please contact the administrator.</p>
        </div>
      </div>
    `;
  } else {
    // In development, throw an error to make it obvious
    throw new Error('VITE_API_BASE_URL environment variable is required. Please set it in your .env file.');
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
