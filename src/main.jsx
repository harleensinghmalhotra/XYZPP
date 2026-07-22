import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import './i18n'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {/* Opt into the React Router v7 behaviours now — clears the two future-flag console
        warnings and keeps this app aligned with the eventual v7 upgrade. The app uses
        absolute route paths, so v7_relativeSplatPath is a no-op in practice. */}
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
)
