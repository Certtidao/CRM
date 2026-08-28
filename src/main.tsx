import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

const params = new URLSearchParams(location.search)
const redirect = params.get('redirect')
if (redirect) {
  window.history.replaceState(null, '', '/CRM' + redirect)
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
