import React from 'react'
import '../styles/error-boundary.css'

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
    this.setState({ error, errorInfo })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <h2>Что-то пошло не так</h2>
          <p>Произошла ошибка при загрузке приложения.</p>
          
          {process.env.NODE_ENV === 'development' && (
            <details style={{ whiteSpace: 'pre-wrap', marginTop: '20px', textAlign: 'left' }}>
              <summary>Детали ошибки (только в разработке)</summary>
              <p><strong>Error:</strong> {this.state.error?.toString()}</p>
              <p><strong>Stack:</strong> {this.state.error?.stack}</p>
              <p><strong>Component Stack:</strong> {this.state.errorInfo?.componentStack}</p>
            </details>
          )}
          
          <button onClick={() => window.location.reload()}>
            Обновить страницу
          </button>
        </div>
      )
    }

    return this.props.children
  }
}
