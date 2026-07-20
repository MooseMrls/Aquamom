import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.js';

// Global styles, loaded in cascade order: design tokens first, then the
// base reset/typography, then the shared surfaces used across many
// pages. Each component/page below owns and imports its own CSS file.
import './styles/variables.css';
import './styles/base.css';
import './styles/shared.css';
import './styles/buttons.css';
import './styles/forms.css';
import './styles/table.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
