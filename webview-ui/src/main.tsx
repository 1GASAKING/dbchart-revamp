import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@xyflow/react/dist/base.css'
import './index.css'
import App from './App.tsx'
import { ErrorBoundary, installGlobalErrorReporting } from './utils/error-boundary'

// Surface uncaught errors/rejections on screen instead of failing silently
// to a blank webview.
installGlobalErrorReporting()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
