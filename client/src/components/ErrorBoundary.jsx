import { Component } from 'react'

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-4">
          <div className="max-w-2xl">
            <h1 className="text-3xl font-bold text-red-400 mb-4">⚠️ Error</h1>
            <p className="text-slate-300 mb-4">An error occurred while loading the app.</p>
            
            <div className="bg-slate-900 border border-slate-700 rounded-lg p-4 mb-6">
              <p className="text-xs text-slate-400 uppercase mb-2">Error Details:</p>
              <p className="text-sm font-mono text-red-300 break-words whitespace-pre-wrap">
                {this.state.error?.message}
              </p>
              {this.state.error?.stack && (
                <details className="mt-4">
                  <summary className="text-xs text-slate-400 cursor-pointer hover:text-slate-300">
                    Stack Trace
                  </summary>
                  <pre className="text-xs text-slate-400 mt-2 overflow-auto max-h-48">
                    {this.state.error.stack}
                  </pre>
                </details>
              )}
            </div>

            <div className="bg-slate-900 border border-slate-700 rounded-lg p-4 mb-6">
              <p className="text-xs text-slate-400 uppercase mb-2">Debug Info:</p>
              <pre className="text-xs text-slate-300 overflow-auto">
                {JSON.stringify(
                  {
                    apiBase: import.meta.env.VITE_API_BASE_URL,
                    mode: import.meta.env.MODE,
                    localStorage: typeof localStorage !== 'undefined',
                    timestamp: new Date().toISOString(),
                  },
                  null,
                  2
                )}
              </pre>
            </div>

            <button
              onClick={() => window.location.reload()}
              className="px-6 py-2 bg-sky-600 hover:bg-sky-700 rounded transition font-semibold"
            >
              Reload page
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
