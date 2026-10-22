import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { ErrorBoundary } from './components/ErrorBoundary';
import { MotionProvider } from './lib/motion';
import './styles.css';
import './sketchbook.css';
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <MotionProvider>
        <App />
      </MotionProvider>
    </ErrorBoundary>
  </StrictMode>,
);
