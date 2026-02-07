// src/embed/EmbedApp.tsx
import { useEffect } from 'react';
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

  useEffect(() => {
    setConfig(config);
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
  }, []);

  const loadStudioData = async () => {
    setLoading(true);
    setError(null);

    const studioRes = await embedApi.getStudioConfig(config.studioId);
    if (studioRes.error) {
      setError(studioRes.error);
      setLoading(false);
      return;
    }
    setStudio(studioRes.data!);

    const servicesRes = await embedApi.getServices(
      config.studioId,
      config.services.length ? config.services : undefined
    );
    if (servicesRes.error) {
      setError(servicesRes.error);
      setLoading(false);
      return;
    }
    setServices(servicesRes.data!);
    setLoading(false);
  };

  const getParentOrigin = (): string => {
    try {
      if (document.referrer) {
        return new URL(document.referrer).origin;
      }
    } catch {
      // Invalid referrer URL
    }
    // Ne pas utiliser '*' - utiliser l'origin du document comme fallback securise
    return window.location.origin;
  };

  const notifyParent = (type: string, payload: unknown) => {
    if (window.parent !== window) {
      window.parent.postMessage({ type, payload }, getParentOrigin());
    }
  };

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
