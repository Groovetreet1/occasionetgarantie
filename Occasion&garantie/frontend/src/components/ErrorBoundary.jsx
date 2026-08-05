import { Component } from 'react';
import { useLanguage } from '../context/LanguageContext';

function ErrorFallback({ onRetry }) {
  const { t } = useLanguage();
  return (
    <div style={{ padding: '40px', textAlign: 'center', fontFamily: 'sans-serif' }}>
      <h1 style={{ fontSize: '24px', color: '#ef4444', marginBottom: '12px' }}>{t('common.errorTitle')}</h1>
      <p style={{ color: '#64748b', marginBottom: '24px' }}>{t('common.errorRefreshHint')}</p>
      <button
        onClick={onRetry}
        style={{ padding: '10px 24px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px' }}
      >
        {t('common.backHome')}
      </button>
    </div>
  );
}

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <ErrorFallback onRetry={() => { this.setState({ hasError: false }); window.location.href = '/'; }} />;
    }
    return this.props.children;
  }
}
