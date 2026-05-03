import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { loadConfig } from './services/config.ts'

let configError: string | null = null;

try {
  loadConfig();
} catch (err) {
  configError = err instanceof Error ? err.message : String(err);
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {configError !== null
      ? <div>Configuration error: {configError}</div>
      : <App />
    }
  </StrictMode>,
)
