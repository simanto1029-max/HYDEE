import React from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean; message: string }> {
  state = { hasError: false, message: '' };

  static getDerivedStateFromError(error: any) {
    return { hasError: true, message: String(error?.message || error) };
  }

  componentDidCatch(error: any, info: any) {
    console.error('HYDEE render crash:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '80px 24px', textAlign: 'center', fontFamily: 'sans-serif' }}>
          <h2 style={{ fontSize: 24, marginBottom: 12 }}>Something went wrong</h2>
          <p style={{ color: '#666', fontSize: 14, marginBottom: 20 }}>Please try again or go back to the home page.</p>
          <a href="/" style={{ background: '#800000', color: '#fff', padding: '12px 28px', borderRadius: 999, textDecoration: 'none', fontSize: 13 }}>
            Go to Home
          </a>
          <pre style={{ marginTop: 24, fontSize: 11, color: '#999', whiteSpace: 'pre-wrap' }}>{this.state.message}</pre>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById('root')!).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);
