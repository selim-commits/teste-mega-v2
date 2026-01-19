// src/embed-chat/main.tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ChatApp } from './ChatApp';
import type { ChatConfig } from './types';
import './chat.css';

// Get config from container data attributes
const container = document.getElementById('rooom-chat-root');

if (container) {
  const config: ChatConfig = {
    studioId: container.dataset.studioId || 'demo-studio',
    studioName: container.dataset.studioName || 'Mon Studio',
    theme: (container.dataset.theme as 'light' | 'dark') || 'light',
    accentColor: container.dataset.accentColor || '#6366f1',
    locale: container.dataset.locale || 'fr',
    position: (container.dataset.position as 'bottom-right' | 'bottom-left') || 'bottom-right',
    greeting: container.dataset.greeting,
    aiName: container.dataset.aiName || 'YODA',
    aiAvatar: container.dataset.aiAvatar,
    enableSound: container.dataset.enableSound !== 'false',
    enableAttachments: container.dataset.enableAttachments === 'true',
  };

  createRoot(container).render(
    <StrictMode>
      <ChatApp config={config} />
    </StrictMode>
  );
}

// Also export a function for programmatic initialization
export function initRooomChat(
  element: HTMLElement | string,
  config: Partial<ChatConfig>
) {
  const container =
    typeof element === 'string' ? document.querySelector(element) : element;

  if (!container) {
    console.error('[Rooom Chat] Container element not found');
    return;
  }

  const fullConfig: ChatConfig = {
    studioId: config.studioId || 'demo-studio',
    studioName: config.studioName || 'Mon Studio',
    theme: config.theme || 'light',
    accentColor: config.accentColor || '#6366f1',
    locale: config.locale || 'fr',
    position: config.position || 'bottom-right',
    greeting: config.greeting,
    aiName: config.aiName || 'YODA',
    aiAvatar: config.aiAvatar,
    enableSound: config.enableSound ?? true,
    enableAttachments: config.enableAttachments ?? false,
  };

  createRoot(container as HTMLElement).render(
    <StrictMode>
      <ChatApp config={fullConfig} />
    </StrictMode>
  );
}

// Expose to window for script tag usage
declare global {
  interface Window {
    RooomChat: {
      init: typeof initRooomChat;
    };
  }
}

if (typeof window !== 'undefined') {
  window.RooomChat = {
    init: initRooomChat,
  };
}
