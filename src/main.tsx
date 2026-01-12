import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { ErrorBoundary } from './components/ErrorBoundary'
import { AuthProvider } from './contexts/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import { pdfjs } from 'react-pdf'

// Configure PDF.js worker with local fallback for better reliability
const workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.js?url',
  import.meta.url
).toString();

console.log('PDF.js worker source:', workerSrc);

pdfjs.GlobalWorkerOptions.workerSrc = workerSrc;

// Add PDF.js error handling
if (typeof window !== 'undefined') {
  window.addEventListener('error', (event) => {
    if (event.filename && event.filename.includes('pdf')) {
      console.error('PDF.js worker error:', event.error);
    }
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <App />
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  </StrictMode>,
)
