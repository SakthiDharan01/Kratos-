'use client'

import React, { Component, ErrorInfo, ReactNode } from 'react'
import { motion } from 'framer-motion'
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
}

interface State {
  hasError: boolean
  error: Error | null
  errorId: string
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { 
      hasError: false, 
      error: null,
      errorId: this.generateErrorId()
    }
  }

  private generateErrorId(): string {
    return Math.random().toString(36).substr(2, 9)
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorId: Math.random().toString(36).substr(2, 9)
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
    
    // Log error details for debugging
    console.group(`🐛 Error Boundary - ID: ${this.state.errorId}`)
    console.error('Error:', error)
    console.error('Component Stack:', errorInfo.componentStack)
    console.error('Props:', this.props)
    console.groupEnd()

    // Call optional error handler
    this.props.onError?.(error, errorInfo)
  }

  private handleRetry = () => {
    this.setState({ 
      hasError: false, 
      error: null,
      errorId: this.generateErrorId()
    })
  }

  private handleReload = () => {
    if (typeof window !== 'undefined') {
      window.location.reload()
    }
  }

  private handleGoHome = () => {
    if (typeof window !== 'undefined') {
      window.location.href = '/'
    }
  }

  private copyErrorDetails = () => {
    if (this.state.error && typeof navigator !== 'undefined' && navigator.clipboard) {
      const errorDetails = `
Error ID: ${this.state.errorId}
Error: ${this.state.error.name}: ${this.state.error.message}
Stack: ${this.state.error.stack}
URL: ${window.location.href}
User Agent: ${navigator.userAgent}
Time: ${new Date().toISOString()}
      `.trim()
      
      navigator.clipboard.writeText(errorDetails)
        .then(() => {
          // Simple feedback without external dependencies
          const button = document.getElementById('copy-error-btn')
          if (button) {
            const originalText = button.textContent
            button.textContent = 'Copied!'
            setTimeout(() => {
              button.textContent = originalText
            }, 2000)
          }
        })
        .catch(err => console.error('Failed to copy error details:', err))
    }
  }

  render() {
    if (this.state.hasError) {
      // Custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback
      }

      // Default error UI
      return (
        <div className="min-h-screen bg-black text-white flex items-center justify-center p-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-lg w-full bg-gray-900/50 border border-red-500/20 rounded-xl p-8 backdrop-blur-sm text-center"
          >
            <div className="mb-6">
              <AlertTriangle className="w-16 h-16 text-red-400 mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-red-400 mb-2">
                Something went wrong
              </h1>
              <p className="text-gray-400">
                We encountered an unexpected error. Don't worry, we're working to fix it.
              </p>
            </div>

            {/* Error details (collapsed by default) */}
            <details className="text-left mb-6 bg-gray-800/50 rounded-lg p-4">
              <summary className="cursor-pointer text-gray-300 hover:text-white transition-colors">
                Technical Details
              </summary>
              <div className="mt-4 text-sm text-gray-400 font-mono">
                <p><strong>Error ID:</strong> {this.state.errorId}</p>
                <p><strong>Error:</strong> {this.state.error?.name}</p>
                <p><strong>Message:</strong> {this.state.error?.message}</p>
                <p><strong>Time:</strong> {new Date().toLocaleString()}</p>
              </div>
            </details>

            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={this.handleRetry}
                className="bg-yellow-600 hover:bg-yellow-700 text-black px-6 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Try Again
              </button>
              
              <button
                onClick={this.handleReload}
                className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Reload Page
              </button>
              
              <button
                onClick={this.handleGoHome}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
              >
                <Home className="w-4 h-4" />
                Go Home
              </button>
            </div>

            {/* Copy error details button */}
            <div className="mt-6 pt-6 border-t border-gray-700/50">
              <button
                id="copy-error-btn"
                onClick={this.copyErrorDetails}
                className="text-sm text-gray-400 hover:text-gray-300 transition-colors flex items-center justify-center gap-2 mx-auto"
              >
                <Bug className="w-4 h-4" />
                Copy Error Details
              </button>
              <p className="text-xs text-gray-500 mt-2">
                Share these details with support to help us fix the issue
              </p>
            </div>
          </motion.div>
        </div>
      )
    }

    return this.props.children
  }
}

// Higher-order component wrapper
export const withErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<Props, 'children'>
) => {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  )
  
  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`
  return WrappedComponent
}

export default ErrorBoundary