(function() {
  'use strict';

  interface RooomConfig {
    studioId: string;
    theme?: 'light' | 'dark';
    accentColor?: string;
    services?: string[];
    locale?: string;
    container?: string | HTMLElement;
    mode?: 'inline' | 'popup' | 'iframe';
    onReady?: () => void;
    onBookingComplete?: (booking: unknown) => void;
    onError?: (error: Error) => void;
  }

  interface RooomWidget {
    init: (config: RooomConfig) => void;
    open: () => void;
    close: () => void;
    destroy: () => void;
  }

  const WIDGET_URL = import.meta.env.PROD
    ? 'https://embed.rooom-os.com'
    : 'http://localhost:5173/src/embed/index.html';

  const createWidget = (config: RooomConfig): RooomWidget => {
    let iframe: HTMLIFrameElement | null = null;
    let container: HTMLElement | null = null;

    const init = () => {
      // Get or create container
      if (typeof config.container === 'string') {
        container = document.querySelector(config.container);
      } else if (config.container instanceof HTMLElement) {
        container = config.container;
      } else {
        container = document.createElement('div');
        container.id = 'rooom-embed-container';
        document.body.appendChild(container);
      }

      if (!container) {
        config.onError?.(new Error('Container not found'));
        return;
      }

      // Create iframe
      iframe = document.createElement('iframe');
      iframe.src = buildWidgetUrl(config);
      iframe.style.cssText = `
        width: 100%;
        height: 600px;
        border: none;
        border-radius: 12px;
      `;
      iframe.setAttribute('loading', 'lazy');
      iframe.setAttribute('title', 'Rooom OS Booking Widget');

      // Handle messages from widget
      window.addEventListener('message', handleMessage);

      container.appendChild(iframe);
    };

    const buildWidgetUrl = (cfg: RooomConfig): string => {
      const params = new URLSearchParams({
        studioId: cfg.studioId,
        theme: cfg.theme || 'light',
        accentColor: cfg.accentColor || '#1E3A5F',
        locale: cfg.locale || 'fr',
      });
      if (cfg.services?.length) {
        params.set('services', cfg.services.join(','));
      }
      return `${WIDGET_URL}?${params.toString()}`;
    };

    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== new URL(WIDGET_URL).origin) return;

      const { type, payload } = event.data;
      switch (type) {
        case 'ROOOM_READY':
          config.onReady?.();
          break;
        case 'ROOOM_BOOKING_COMPLETE':
          config.onBookingComplete?.(payload);
          break;
        case 'ROOOM_RESIZE':
          if (iframe) {
            iframe.style.height = `${payload.height}px`;
          }
          break;
        case 'ROOOM_ERROR':
          config.onError?.(new Error(payload.message));
          break;
      }
    };

    const open = () => {
      if (config.mode === 'popup' && container) {
        container.style.display = 'block';
      }
    };

    const close = () => {
      if (config.mode === 'popup' && container) {
        container.style.display = 'none';
      }
    };

    const destroy = () => {
      window.removeEventListener('message', handleMessage);
      if (iframe) {
        iframe.remove();
        iframe = null;
      }
    };

    init();

    return { init, open, close, destroy };
  };

  // Expose to window
  (window as any).Rooom = {
    createWidget,
  };

  // Auto-init if data attributes present
  document.addEventListener('DOMContentLoaded', () => {
    const autoInitElements = document.querySelectorAll('[data-rooom-studio-id]');
    autoInitElements.forEach((el) => {
      const htmlEl = el as HTMLElement;
      createWidget({
        studioId: htmlEl.dataset.rooomStudioId || '',
        theme: (htmlEl.dataset.rooomTheme as 'light' | 'dark') || 'light',
        accentColor: htmlEl.dataset.rooomAccentColor,
        services: htmlEl.dataset.rooomServices?.split(','),
        locale: htmlEl.dataset.rooomLocale,
        container: htmlEl,
      });
    });
  });
})();
