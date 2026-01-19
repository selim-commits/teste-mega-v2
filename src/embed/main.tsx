import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { EmbedApp } from './EmbedApp'
import './embed.css'

// Get config from container data attributes
const container = document.getElementById('rooom-embed-root')

if (container) {
  const config = {
    studioId: container.dataset.studioId || '',
    theme: (container.dataset.theme as 'light' | 'dark') || 'light',
    accentColor: container.dataset.accentColor || '#1E3A5F',
    services: container.dataset.services?.split(',') || [],
    locale: container.dataset.locale || 'fr',
  }

  createRoot(container).render(
    <StrictMode>
      <EmbedApp config={config} />
    </StrictMode>
  )
}
