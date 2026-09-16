// Browser polyfill for process / process.cwd if referenced by any library
if (typeof window !== 'undefined') {
  const win = window as any;
  win.process = win.process || {};
  if (typeof win.process.cwd !== 'function') {
    win.process.cwd = () => '/';
  }
  win.process.env = win.process.env || {};
}

import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
