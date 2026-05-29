import React from 'react'

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('Dashboard Error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[400px] flex flex-col items-center justify-center p-12 bg-white rounded-[3rem] border border-red-50 shadow-xl text-center">
          <div className="w-24 h-24 bg-red-50 rounded-full flex items-center justify-center text-5xl mb-6 shadow-inner">⚠️</div>
          <h2 className="font-display text-3xl font-black text-gray-900 mb-4 tracking-tight">Something went wrong</h2>
          <p className="text-gray-500 font-medium italic mb-8 max-w-md">We encountered an error while rendering this part of the dashboard. Our team has been notified.</p>
          <button 
            onClick={() => window.location.reload()}
            className="bg-primary-600 text-white px-10 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-primary-700 transition-all shadow-xl shadow-primary-200"
          >
            Refresh Dashboard
          </button>
          {import.meta.env.DEV && (
            <pre className="mt-8 p-6 bg-gray-900 text-red-400 rounded-2xl text-left text-xs overflow-auto max-w-full">
              {this.state.error?.toString()}
            </pre>
          )}
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
