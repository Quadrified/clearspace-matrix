import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { MATRIX_KEY, readStorage } from '../state/storage';
import { datedFilename, downloadJson } from '../lib/download';

// Last line of defense: a render error must never leave a blank page with no way to save tasks.
export class ErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(error, info.componentStack);
  }
  render() {
    if (!this.state.failed) return this.props.children;
    const data = readStorage(MATRIX_KEY);
    return (
      <div className="wrap" role="alert">
        <h1>Something went wrong.</h1>
        <p>Your tasks are still saved in this browser. Download a copy, then reload.</p>
        <div className="dialog-actions">
          {data && (
            <button
              type="button"
              className="btn"
              onClick={() => downloadJson(datedFilename('clearspace-recovery'), data)}
            >
              Download saved data
            </button>
          )}
          <button type="button" className="btn primary" onClick={() => location.reload()}>
            Reload
          </button>
        </div>
      </div>
    );
  }
}
