import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'

// Добавляем обработку глобальных ошибок
window.addEventListener('error', (event) => {
  console.error('Global error:', event.error)
  // Скрываем загрузочный экран при ошибке
  const loading = document.getElementById('loading')
  if (loading) {
    loading.style.display = 'none'
  }
})

window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason)
  // Скрываем загрузочный экран при ошибке
  const loading = document.getElementById('loading')
  if (loading) {
    loading.style.display = 'none'
  }
})

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

// Скрываем загрузочный экран после монтирования React
setTimeout(() => {
  const loading = document.getElementById('loading')
  if (loading) {
    loading.style.display = 'none'
  }
}, 100)
