// src/embed-packs/main.tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { PacksApp } from './PacksApp';
import './packs.css';

// Get config from container data attributes
const container = document.getElementById('rooom-packs-root');

if (container) {
  const config = {
    studioId: container.dataset.studioId || '',
    theme: (container.dataset.theme as 'light' | 'dark') || 'light',
    accentColor: container.dataset.accentColor || '#1E3A5F',
    locale: container.dataset.locale || 'fr',
    showGiftCertificates: container.dataset.showGifts !== 'false',
    showSubscriptions: container.dataset.showSubscriptions !== 'false',
  };

  createRoot(container).render(
    <StrictMode>
      <PacksApp config={config} />
    </StrictMode>
  );
}
