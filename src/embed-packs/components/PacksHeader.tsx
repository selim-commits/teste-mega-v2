// src/embed-packs/components/PacksHeader.tsx
import { usePacksStore } from '../store/packsStore';
import type { PacksTab } from '../types';

const TABS: { key: PacksTab; label: string }[] = [
  { key: 'packs', label: 'Packs Heures' },
  { key: 'subscriptions', label: 'Abonnements' },
  { key: 'gifts', label: 'Cartes Cadeaux' },
];

export function PacksHeader() {
  const { studio, config, currentTab, currentView, setCurrentTab, setCurrentView, reset } =
    usePacksStore();

  const showTabs = currentView === 'browse';
  const showBackButton = currentView !== 'browse' && currentView !== 'confirmation';

  const handleBack = () => {
    reset();
    setCurrentView('browse');
  };

  const handleTabChange = (tab: PacksTab) => {
    setCurrentTab(tab);
  };

  // Filter tabs based on config
  const visibleTabs = TABS.filter((tab) => {
    if (tab.key === 'gifts' && config?.showGiftCertificates === false) return false;
    if (tab.key === 'subscriptions' && config?.showSubscriptions === false) return false;
    return true;
  });

  return (
    <header className="rooom-packs-header">
      <div className="rooom-packs-header-top">
        {showBackButton ? (
          <button
            onClick={handleBack}
            className="rooom-packs-btn rooom-packs-btn-ghost rooom-packs-btn-sm"
            aria-label="Retour"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M15 10H5M5 10L10 5M5 10L10 15" />
            </svg>
            Retour
          </button>
        ) : (
          <div style={{ width: '80px' }} />
        )}

        <div className="rooom-packs-studio-info">
          {studio?.logo_url ? (
            <img src={studio.logo_url} alt={studio.name} className="rooom-packs-logo" />
          ) : (
            <div className="rooom-packs-logo-placeholder">{studio?.name?.charAt(0) || 'R'}</div>
          )}
          <span className="rooom-packs-studio-name">{studio?.name || 'Studio'}</span>
        </div>

        <div style={{ width: '80px' }} />
      </div>

      {showTabs && visibleTabs.length > 1 && (
        <div className="rooom-packs-tabs">
          {visibleTabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => handleTabChange(tab.key)}
              className={`rooom-packs-tab ${currentTab === tab.key ? 'rooom-packs-tab-active' : ''}`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}
    </header>
  );
}
