import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { DashboardApp } from './DashboardApp.js';
import './styles.css';

const rootEl = document.getElementById('root');
if (!rootEl) throw new Error('root element missing');
createRoot(rootEl).render(
  <StrictMode>
    <DashboardApp />
  </StrictMode>,
);
