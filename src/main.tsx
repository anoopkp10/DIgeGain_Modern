// Defensive safeguard for browser environments where window.fetch has only a getter
try {
  if (typeof window !== 'undefined') {
    const rawFetch = window.fetch;
    let activeFetch = function(...args: any[]) {
      return (rawFetch || window.fetch).apply(window, args as [any, any]);
    };
    try {
      Object.defineProperty(window, 'fetch', {
        get() { return activeFetch; },
        set(fn) { activeFetch = fn; },
        configurable: true,
        enumerable: true,
      });
    } catch {}
  }
} catch {}

import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
