import { Component } from 'react'

export class ErrorBoundary extends Component {
  state = { hasError: false, error: null }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, info) {
    console.error('[Quizzeria] Uncaught error:', error, info)
  }

  render() {
    if (!this.state.hasError) return this.props.children

    return (
      <div style={{
        minHeight: '100vh',
        background: '#0A0A0F',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 24,
        padding: 40,
      }}>
        <div style={{ fontSize: 48 }}>⚠️</div>
        <div style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: 24,
          fontWeight: 700,
          color: '#FFD700',
          textAlign: 'center',
        }}>
          Something went wrong
        </div>
        <div style={{
          fontFamily: 'Inter, sans-serif',
          fontSize: 13,
          color: 'rgba(255,255,255,0.35)',
          textAlign: 'center',
          maxWidth: 420,
          lineHeight: 1.7,
        }}>
          {this.state.error?.message || 'An unexpected error occurred.'}
        </div>
        <button
          style={{
            background: 'linear-gradient(145deg,#1e1e35,#12121F)',
            border: '1.5px solid rgba(255,215,0,0.4)',
            borderRadius: 9999,
            padding: '14px 40px',
            fontFamily: "'Playfair Display', serif",
            fontSize: 15,
            fontWeight: 700,
            color: '#FFD700',
            cursor: 'pointer',
            letterSpacing: 2,
          }}
          onClick={() => this.setState({ hasError: false, error: null })}
        >
          Try Again
        </button>
      </div>
    )
  }
}
