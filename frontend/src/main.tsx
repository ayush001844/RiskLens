import React from 'react'
import ReactDOM from 'react-dom/client'
import { App } from './App'
import './index.css'

interface ErrorBoundaryProps {
  children: React.ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

class RootErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('RiskLens Root ErrorBoundary caught error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-6">
          <div className="max-w-lg w-full bg-slate-800/90 border border-red-500/40 rounded-2xl p-6 shadow-2xl shadow-red-950/40">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-red-500/20 text-red-400 flex items-center justify-center font-bold text-lg border border-red-500/30">
                !
              </div>
              <div>
                <h1 className="text-base font-bold text-slate-100">Application Initialization Warning</h1>
                <p className="text-xs text-slate-400">RiskLens encountered an unexpected error while mounting.</p>
              </div>
            </div>
            <div className="bg-slate-950/80 p-3 rounded-lg border border-slate-700/60 text-xs font-mono text-red-300 mb-4 overflow-x-auto">
              {this.state.error?.message || 'Unknown render exception'}
            </div>
            <div className="flex items-center justify-between gap-3">
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg shadow transition-colors"
              >
                Reload Application
              </button>
              <button
                onClick={() => {
                  this.setState({ hasError: false, error: null })
                }}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-semibold rounded-lg transition-colors"
              >
                Attempt Recovery
              </button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

const rootElement = document.getElementById('root')
if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <RootErrorBoundary>
        <App />
      </RootErrorBoundary>
    </React.StrictMode>
  )
}
