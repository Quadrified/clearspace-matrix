import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './app/App';
import { ErrorBoundary } from './app/ErrorBoundary';
import { MotionProvider } from './lib/motion';
import './styles/index.css';
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <MotionProvider>
        <App />
      </MotionProvider>
    </ErrorBoundary>
  </StrictMode>,
);
