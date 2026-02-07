// src/embed/EmbedApp.tsx
import { useEffect, useCallback, useRef } from 'react';
import { useEmbedStore } from './store/embedStore';
import { embedApi } from './services/embedApi';
import { ServiceSelection } from './components/ServiceSelection';
import { DateTimeSelection } from './components/DateTimeSelection';
import { BookingForm } from './components/BookingForm';
import { PaymentStep } from './components/PaymentStep';
import { Confirmation } from './components/Confirmation';
import { WidgetHeader } from './components/WidgetHeader';
import { LoadingSpinner } from './components/LoadingSpinner';
import { ErrorMessage } from './components/ErrorMessage';
import type { EmbedConfig } from './types';
import './embed.css';

interface EmbedAppProps {
  config: EmbedConfig;
}

export function EmbedApp({ config }: EmbedAppProps) {
  const {
    currentStep,
    studio,
    isLoading,
    error,
    setConfig,
    setStudio,
    setServices,
    setLoading,
    setError,
  } = useEmbedStore();

  const getParentOrigin = useCallback((): string => {
    try {
      if (document.referrer) {
        return new URL(document.referrer).origin;
      }
    } catch {
      // Invalid referrer URL
    }
    // Ne pas utiliser '*' - utiliser l'origin du document comme fallback securise
    return window.location.origin;
  }, []);

  const notifyParent = useCallback((type: string, payload: unknown) => {
    if (window.parent !== window) {
      window.parent.postMessage({ type, payload }, getParentOrigin());
    }
  }, [getParentOrigin]);

  // Use ref to avoid stale closures in the initialization effect
  const configRef = useRef(config);
  useEffect(() => {
    configRef.current = config;
  }, [config]);

  const loadStudioData = useCallback(async () => {
    const currentConfig = configRef.current;
    setLoading(true);
    setError(null);

    const studioRes = await embedApi.getStudioConfig(currentConfig.studioId);
    if (studioRes.error) {
      setError(studioRes.error);
      setLoading(false);
      return;
    }
    setStudio(studioRes.data!);

    const servicesRes = await embedApi.getServices(
      currentConfig.studioId,
      currentConfig.services.length ? currentConfig.services : undefined
    );
    if (servicesRes.error) {
      setError(servicesRes.error);
      setLoading(false);
      return;
    }
    setServices(servicesRes.data!);
    setLoading(false);
  }, [setLoading, setError, setStudio, setServices]);

  useEffect(() => {
    setConfig(configRef.current);
    loadStudioData();
    notifyParent('ROOOM_READY', {});

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        notifyParent('ROOOM_RESIZE', { height: entry.contentRect.height });
      }
    });

    const container = document.getElementById('rooom-embed-root');
    if (container) resizeObserver.observe(container);

    return () => resizeObserver.disconnect();
  }, [setConfig, loadStudioData, notifyParent]);

  const themeClass = config.theme === 'dark' ? 'rooom-dark' : 'rooom-light';

  if (isLoading && !studio) {
    return (
      <div className={`rooom-widget ${themeClass}`}>
        <LoadingSpinner />
      </div>
    );
  }

  if (error && !studio) {
    return (
      <div className={`rooom-widget ${themeClass}`}>
        <ErrorMessage message={error} onRetry={loadStudioData} />
      </div>
    );
  }

  const renderStep = () => {
    switch (currentStep) {
      case 'services': return <ServiceSelection />;
      case 'datetime': return <DateTimeSelection />;
      case 'form': return <BookingForm />;
      case 'payment': return <PaymentStep />;
      case 'confirmation': return <Confirmation />;
      default: return null;
    }
  };

  return (
    <div
      className={`rooom-widget ${themeClass}`}
      style={{ '--accent-color': config.accentColor } as React.CSSProperties}
    >
      <WidgetHeader />
      <main className="rooom-content">{renderStep()}</main>
    </div>
  );
}
