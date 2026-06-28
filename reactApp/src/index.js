import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import './tailwind.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

// Global Fetch Interceptor to handle session expiry (401/403)
const originalFetch = window.fetch;
window.fetch = async function (...args) {
  try {
    const res = await originalFetch(...args);
    const urlStr = typeof args[0] === 'string' ? args[0] : (args[0] && args[0].url) || '';
    const isAuthRoute = urlStr.includes('/login') || urlStr.includes('/forgot-password') || urlStr.includes('/register');

    if ((res.status === 401 || res.status === 403) && !isAuthRoute) {
      console.warn('Session expired or unauthorized. Redirecting to login...');
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('userId');
      localStorage.removeItem('userName');
      localStorage.removeItem('userType');
      window.location.hash = '#/';
      window.location.reload();
    }
    return res;
  } catch (err) {
    throw err;
  }
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

reportWebVitals();
