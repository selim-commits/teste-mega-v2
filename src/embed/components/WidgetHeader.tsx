// src/embed/components/WidgetHeader.tsx
import { useEmbedStore } from '../store/embedStore';
import type { BookingStep } from '../types';

const STEPS: { key: BookingStep; label: string }[] = [
  { key: 'services', label: 'Services' },
  { key: 'datetime', label: 'Date & Heure' },
  { key: 'form', label: 'Informations' },
  { key: 'confirmation', label: 'Confirmation' },
];

export function WidgetHeader() {
  const { studio, currentStep, goToStep } = useEmbedStore();

  const currentStepIndex = STEPS.findIndex((s) => s.key === currentStep);

  return (
    <header className="rooom-header-flat">
      {/* Studio info */}
      <div className="rooom-header-studio">
        {studio?.logo_url ? (
          <img
            src={studio.logo_url}
            alt={studio.name}
            className="rooom-header-logo-img"
          />
        ) : (
          <div className="rooom-header-logo-placeholder">
            {studio?.name?.charAt(0) || 'R'}
          </div>
        )}
        <span className="rooom-header-studio-name">{studio?.name || 'Studio'}</span>
      </div>

      {/* Breadcrumb navigation */}
      {currentStep !== 'payment' && (
        <nav className="rooom-breadcrumb-nav" aria-label="Etapes de reservation">
          {STEPS.map((step, index) => {
            const isActive = step.key === currentStep;
            const isPast = index < currentStepIndex;
            const isFuture = index > currentStepIndex;

            return (
              <span key={step.key} className="rooom-breadcrumb-wrapper">
                {index > 0 && (
                  <span className="rooom-breadcrumb-separator" aria-hidden="true">
                    ›
                  </span>
                )}
                {isPast ? (
                  <button
                    type="button"
                    className="rooom-breadcrumb-item rooom-breadcrumb-past"
                    onClick={() => goToStep(step.key)}
                  >
                    {step.label}
                  </button>
                ) : (
                  <span
                    className={`rooom-breadcrumb-item ${
                      isActive ? 'rooom-breadcrumb-active' : ''
                    } ${isFuture ? 'rooom-breadcrumb-future' : ''}`}
                    aria-current={isActive ? 'step' : undefined}
                  >
                    {step.label}
                  </span>
                )}
              </span>
            );
          })}
        </nav>
      )}
    </header>
  );
}
