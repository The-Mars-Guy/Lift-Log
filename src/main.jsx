import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'
import './index.css'

// Local font bundles — no Google Fonts network request; works fully offline + in Capacitor WebView
import '@fontsource/oswald/500.css'
import '@fontsource/oswald/600.css'
import '@fontsource/oswald/700.css'
import '@fontsource/barlow/400.css'
import '@fontsource/barlow/500.css'
import '@fontsource/barlow/600.css'
import '@fontsource/barlow/700.css'
import '@fontsource/bebas-neue/400.css'
import '@fontsource/geist-mono/400.css'
import '@fontsource/geist-mono/500.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>,
)

// Hand off from the static boot splash once the app has mounted.
// Keep a ~1s minimum so the brand moment + first-paint of the app settle.
{
  const splash = document.getElementById('boot-splash');
  if (splash) {
    const MIN_MS = 1000; // min on-screen time since navigation start
    const remaining = Math.max(0, MIN_MS - performance.now());
    setTimeout(() => {
      splash.classList.add('hide');
      setTimeout(() => splash.remove(), 450);
    }, remaining);
  }
}

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`).then((registration) => {
      registration.addEventListener('updatefound', () => {
        const worker = registration.installing;
        if (!worker) return;
        worker.addEventListener('statechange', () => {
          if (worker.state === 'installed' && navigator.serviceWorker.controller) {
            window.dispatchEvent(new CustomEvent('lift-log-update', { detail: { registration } }));
          }
        });
      });
    }).catch((err) => { console.warn("Service worker registration failed", err); });

    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (window.__liftLogRefreshing) return;
      window.__liftLogRefreshing = true;
      window.location.reload();
    });
  });
}
