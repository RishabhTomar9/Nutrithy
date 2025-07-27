import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './polyfills';
import App from './App';

import { Buffer } from 'buffer';
import process from 'process';

window.Buffer = Buffer;
window.process = process;


createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
