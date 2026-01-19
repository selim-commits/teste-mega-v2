// src/embed-packs/PacksApp.tsx
import { useEffect } from 'react';
import { usePacksStore } from './store/packsStore';
import { packsApi } from './services/packsApi';
import {
  PacksHeader,
  PacksGrid,
  WalletDisplay,
  PurchaseModal,
  ConfirmationStep,
} from './components';
import type { PacksConfig } from './types';
import './packs.css';

interface PacksAppProps {
  config: PacksConfig;
}

// Loading spinner component
function LoadingSpinner() {
  return (
    <div className="rooom-packs-loading">
      <div className="rooom-packs-spinner" />
      <span className="rooom-packs-loading-text">Chargement des offres...</span>
    </div>
  );
}

// Error message component
function ErrorMessage({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="rooom-packs-error">
      <div className="rooom-packs-error-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 8v4M12 16h.01" />
        </svg>
      </div>
      <h3 className="rooom-packs-error-title">Une erreur est survenue</h3>
      <p className="rooom-packs-error-description">{message}</p>
      <button className="rooom-packs-btn rooom-packs-btn-primary" onClick={onRetry}>
        Reessayer
      </button>
    </div>
  );
}

// Pack detail view
function PackDetailView() {
  const { selectedPack, studio, openPurchaseModal } = usePacksStore();
  const currency = studio?.currency || 'EUR';

  if (!selectedPack) return null;

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const pricePerHour = selectedPack.price / selectedPack.hours;

  return (
    <div className="rooom-packs-animate-slide-up">
      <div style={{ textAlign: 'center', marginBottom: '24px' }}>
        <h2 className="rooom-packs-heading-1">Pack {selectedPack.name}</h2>
        <p className="rooom-packs-text-secondary rooom-packs-text-lg">
          {selectedPack.description}
        </p>
      </div>

      <div className="rooom-purchase-summary">
        <div style={{ textAlign: 'center', padding: '16px 0' }}>
          <div
            style={{
              fontSize: '3rem',
              fontWeight: 700,
              color: 'var(--accent-color, #6366f1)',
              lineHeight: 1,
            }}
          >
            {selectedPack.hours}
            <span style={{ fontSize: '1.5rem', fontWeight: 400, marginLeft: '8px' }}>heures</span>
          </div>
          <div style={{ marginTop: '8px' }}>
            <span style={{ fontSize: '1.5rem', fontWeight: 700 }}>
              {formatPrice(selectedPack.price)}
            </span>
            {selectedPack.savings_percent > 0 && (
              <span
                style={{
                  fontSize: '1rem',
                  color: 'var(--rooom-text-muted)',
                  textDecoration: 'line-through',
                  marginLeft: '8px',
                }}
              >
                {formatPrice(selectedPack.regular_price)}
              </span>
            )}
          </div>
          <div className="rooom-packs-text-secondary" style={{ marginTop: '4px' }}>
            {formatPrice(pricePerHour)}/heure
          </div>
        </div>
      </div>

      {selectedPack.savings_percent > 0 && (
        <div
          className="rooom-pack-savings"
          style={{ display: 'block', textAlign: 'center', marginBottom: '24px' }}
        >
          Economisez {selectedPack.savings_percent}% par rapport au tarif horaire standard
        </div>
      )}

      <div style={{ marginBottom: '24px' }}>
        <h3 className="rooom-packs-heading-3">Avantages inclus</h3>
        <ul className="rooom-pack-benefits">
          {selectedPack.benefits.map((benefit, index) => (
            <li key={index} className="rooom-pack-benefit">
              <svg
                className="rooom-pack-benefit-icon"
                viewBox="0 0 16 16"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M3 8L6 11L13 4" />
              </svg>
              <span>{benefit}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="rooom-pack-validity" style={{ marginBottom: '24px' }}>
        Ce pack est valide {selectedPack.validity_days} jours apres l'achat.
      </div>

      <button
        className="rooom-packs-btn rooom-packs-btn-primary rooom-packs-btn-lg rooom-packs-btn-block"
        onClick={openPurchaseModal}
      >
        Acheter ce pack - {formatPrice(selectedPack.price)}
      </button>
    </div>
  );
}

// Subscription detail view
function SubscriptionDetailView() {
  const { selectedSubscription, studio, openPurchaseModal } = usePacksStore();
  const currency = studio?.currency || 'EUR';

  if (!selectedSubscription) return null;

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const isYearly = selectedSubscription.billing_cycle === 'yearly';
  const totalPrice = isYearly
    ? selectedSubscription.yearly_price || selectedSubscription.price_per_month * 12
    : selectedSubscription.price_per_month;

  return (
    <div className="rooom-packs-animate-slide-up">
      <div style={{ textAlign: 'center', marginBottom: '24px' }}>
        <span className="rooom-subscription-billing">
          {isYearly ? 'Engagement annuel' : 'Sans engagement'}
        </span>
        <h2 className="rooom-packs-heading-1" style={{ marginTop: '8px' }}>
          Abonnement {selectedSubscription.name}
        </h2>
        <p className="rooom-packs-text-secondary rooom-packs-text-lg">
          {selectedSubscription.description}
        </p>
      </div>

      <div className="rooom-purchase-summary">
        <div style={{ textAlign: 'center', padding: '16px 0' }}>
          <div
            style={{
              fontSize: '2rem',
              fontWeight: 700,
              color: 'var(--accent-color, #6366f1)',
              lineHeight: 1,
            }}
          >
            {selectedSubscription.hours_per_month}h
            <span style={{ fontSize: '1rem', fontWeight: 400 }}>/mois</span>
          </div>
          {isYearly && (
            <div className="rooom-packs-text-secondary" style={{ marginTop: '4px' }}>
              Soit {selectedSubscription.hours_per_month * 12} heures par an
            </div>
          )}
          <div style={{ marginTop: '16px' }}>
            <span style={{ fontSize: '1.5rem', fontWeight: 700 }}>
              {formatPrice(selectedSubscription.price_per_month)}
            </span>
            <span style={{ fontSize: '1rem', color: 'var(--rooom-text-secondary)' }}>/mois</span>
          </div>
          {isYearly && selectedSubscription.yearly_price && (
            <div className="rooom-packs-text-secondary" style={{ marginTop: '4px' }}>
              Facture {formatPrice(selectedSubscription.yearly_price)} annuellement
            </div>
          )}
        </div>
      </div>

      {selectedSubscription.savings_percent > 0 && (
        <div
          className="rooom-pack-savings"
          style={{ display: 'block', textAlign: 'center', marginBottom: '24px' }}
        >
          Economisez {selectedSubscription.savings_percent}% par rapport au tarif horaire standard
        </div>
      )}

      <div style={{ marginBottom: '24px' }}>
        <h3 className="rooom-packs-heading-3">Avantages inclus</h3>
        <ul className="rooom-pack-benefits">
          {selectedSubscription.benefits.map((benefit, index) => (
            <li key={index} className="rooom-pack-benefit">
              <svg
                className="rooom-pack-benefit-icon"
                viewBox="0 0 16 16"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M3 8L6 11L13 4" />
              </svg>
              <span>{benefit}</span>
            </li>
          ))}
        </ul>
      </div>

      <div
        style={{
          padding: '16px',
          backgroundColor: 'var(--rooom-bg-secondary)',
          borderRadius: '12px',
          marginBottom: '24px',
        }}
      >
        <h4 className="rooom-packs-font-semibold rooom-packs-mb-2">Conditions</h4>
        <ul className="rooom-packs-text-sm rooom-packs-text-secondary" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          <li style={{ marginBottom: '4px' }}>
            - Preavis de {selectedSubscription.cancellation_notice_days} jours pour annulation
          </li>
          {selectedSubscription.rollover_hours && (
            <li>
              - Heures non utilisees{' '}
              {selectedSubscription.max_rollover_hours
                ? `cumulables (max ${selectedSubscription.max_rollover_hours}h)`
                : 'cumulables sans limite'}
            </li>
          )}
        </ul>
      </div>

      <button
        className="rooom-packs-btn rooom-packs-btn-primary rooom-packs-btn-lg rooom-packs-btn-block"
        onClick={openPurchaseModal}
      >
        S'abonner - {formatPrice(totalPrice)}
        {isYearly ? '/an' : '/mois'}
      </button>
    </div>
  );
}

export function PacksApp({ config }: PacksAppProps) {
  const {
    currentView,
    studio,
    clientWallet,
    isLoading,
    error,
    setConfig,
    setStudio,
    setPacks,
    setSubscriptions,
    setGiftCertificates,
    setClientWallet,
    setLoading,
    setError,
  } = usePacksStore();

  useEffect(() => {
    setConfig(config);
    loadData();
    notifyParent('ROOOM_PACKS_READY', {});

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        notifyParent('ROOOM_PACKS_RESIZE', { height: entry.contentRect.height });
      }
    });

    const container = document.getElementById('rooom-packs-root');
    if (container) resizeObserver.observe(container);

    return () => resizeObserver.disconnect();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError(null);

    // Load studio config
    const studioRes = await packsApi.getStudioConfig(config.studioId);
    if (studioRes.error) {
      setError(studioRes.error);
      setLoading(false);
      return;
    }
    setStudio(studioRes.data!);

    // Load packs
    const packsRes = await packsApi.getPacks(config.studioId);
    if (packsRes.data) {
      setPacks(packsRes.data);
    }

    // Load subscriptions
    if (config.showSubscriptions !== false) {
      const subsRes = await packsApi.getSubscriptions(config.studioId);
      if (subsRes.data) {
        setSubscriptions(subsRes.data);
      }
    }

    // Load gift certificates
    if (config.showGiftCertificates !== false) {
      const giftsRes = await packsApi.getGiftCertificates(config.studioId);
      if (giftsRes.data) {
        setGiftCertificates(giftsRes.data);
      }
    }

    // Try to load client wallet (if auth token available)
    // In real implementation, this would check for stored auth token
    const walletRes = await packsApi.getClientWallet(config.studioId);
    if (walletRes.data) {
      setClientWallet(walletRes.data);
    }

    setLoading(false);
  };

  const notifyParent = (type: string, payload: unknown) => {
    if (window.parent !== window) {
      window.parent.postMessage({ type, payload }, '*');
    }
  };

  const themeClass = config.theme === 'dark' ? 'rooom-dark' : 'rooom-light';

  if (isLoading && !studio) {
    return (
      <div className={`rooom-packs-widget ${themeClass}`}>
        <LoadingSpinner />
      </div>
    );
  }

  if (error && !studio) {
    return (
      <div className={`rooom-packs-widget ${themeClass}`}>
        <ErrorMessage message={error} onRetry={loadData} />
      </div>
    );
  }

  const renderContent = () => {
    switch (currentView) {
      case 'browse':
        return <PacksGrid />;
      case 'pack_detail':
        return <PackDetailView />;
      case 'subscription_detail':
        return <SubscriptionDetailView />;
      case 'gift_form':
        return <PacksGrid />;
      case 'confirmation':
        return <ConfirmationStep currency={studio?.currency} />;
      default:
        return <PacksGrid />;
    }
  };

  return (
    <div
      className={`rooom-packs-widget ${themeClass}`}
      style={{ '--accent-color': config.accentColor } as React.CSSProperties}
    >
      <PacksHeader />
      <main className="rooom-packs-content">
        {clientWallet && currentView === 'browse' && (
          <WalletDisplay currency={studio?.currency} />
        )}
        {renderContent()}
      </main>
      <PurchaseModal currency={studio?.currency} />
    </div>
  );
}
