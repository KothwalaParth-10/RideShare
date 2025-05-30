import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter as Router } from 'react-router-dom';
import App from './App';
import { NotificationProvider } from './contexts/NotificationContext';
import reportWebVitals from './lib/performance';
import './index.css';

// Import Leaflet CSS
import 'leaflet/dist/leaflet.css';
import 'leaflet-routing-machine/dist/leaflet-routing-machine.css';

const root = document.getElementById('root');

if (root) {
  createRoot(root).render(
    <StrictMode>
      <Router>
        <NotificationProvider>
          <App />
        </NotificationProvider>
      </Router>
    </StrictMode>
  );
}

// Report performance metrics
reportWebVitals();