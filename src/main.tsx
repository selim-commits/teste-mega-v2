import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Apply persisted theme before first paint to prevent flash
;(() => {
  try {
    const stored = localStorage.getItem('ui-storage');
    if (stored) {
      const parsed = JSON.parse(stored) as { state?: { theme?: string } };
      const theme = parsed?.state?.theme;
      if (theme === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
      } else if (theme === 'light') {
        document.documentElement.setAttribute('data-theme', 'light');
      }
      // 'system' or missing: no attribute, CSS @media handles it
    }
  } catch {
    // Ignore errors during theme initialization
  }
})();

// Enregistrement du Service Worker PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((registration) => {
        console.log('[SW] Enregistre avec succes, scope:', registration.scope);

        // Gestion des mises a jour
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (!newWorker) return;

          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              console.log('[SW] Nouvelle version disponible');
            }
          });
        });
      })
      .catch((error) => {
        console.error('[SW] Echec de l\'enregistrement:', error);
      });
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
