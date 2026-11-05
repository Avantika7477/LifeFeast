import { Component } from 'react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
    this.handleReload = this.handleReload.bind(this);
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  handleReload() {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then((regs) => {
        regs.forEach((reg) => reg.update());
      });
    }
    window.location.reload();
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div
        style={{
          minHeight: '100dvh',
          display: 'grid',
          placeItems: 'center',
          padding: '1.5rem',
          fontFamily: 'system-ui, sans-serif',
          textAlign: 'center',
          background: '#4a3842',
          color: '#fff7f0',
        }}
      >
        <div style={{ maxWidth: 360 }}>
          <h1 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>LifeQuest hit a snag</h1>
          <p style={{ opacity: 0.8, marginBottom: '1.25rem' }}>
            The page failed to load. This sometimes happens after an update on phones. Tap reload.
          </p>
          <button
            type="button"
            onClick={this.handleReload}
            style={{
              border: 0,
              borderRadius: 999,
              padding: '0.75rem 1.25rem',
              fontWeight: 700,
              background: '#ffb070',
              color: '#3b2414',
            }}
          >
            Reload
          </button>
        </div>
      </div>
    );
  }
}
