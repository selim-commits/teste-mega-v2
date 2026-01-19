// src/embed/components/WidgetHeader.tsx
import { useEmbedStore } from '../store/embedStore';
import type { BookingStep } from '../types';

const STEPS: { key: BookingStep; label: string }[] = [
  { key: 'services', label: 'Service' },
  { key: 'datetime', label: 'Date & Heure' },
  { key: 'form', label: 'Informations' },
];

export function WidgetHeader() {
  const { studio, currentStep, goBack } = useEmbedStore();

  const currentStepIndex = STEPS.findIndex((s) => s.key === currentStep);
  const showBackButton = currentStepIndex > 0 && currentStep !== 'confirmation';

  return (
    <header style={styles.header}>
      <div style={styles.topRow}>
        {showBackButton ? (
          <button
            onClick={goBack}
            style={styles.backButton}
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
          </button>
        ) : (
          <div style={styles.backButtonPlaceholder} />
        )}

        <div style={styles.studioInfo}>
          {studio?.logo_url ? (
            <img
              src={studio.logo_url}
              alt={studio.name}
              style={styles.logo}
            />
          ) : (
            <div style={styles.logoPlaceholder}>
              {studio?.name?.charAt(0) || 'R'}
            </div>
          )}
          <span style={styles.studioName}>{studio?.name || 'Studio'}</span>
        </div>

        <div style={styles.backButtonPlaceholder} />
      </div>

      {currentStep !== 'payment' && currentStep !== 'confirmation' && (
        <div style={styles.stepIndicator}>
          {STEPS.map((step, index) => {
            const isActive = step.key === currentStep;
            const isCompleted = index < currentStepIndex;

            return (
              <div key={step.key} style={styles.stepItem}>
                <div
                  style={{
                    ...styles.stepDot,
                    ...(isActive ? styles.stepDotActive : {}),
                    ...(isCompleted ? styles.stepDotCompleted : {}),
                  }}
                >
                  {isCompleted ? (
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 12 12"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M2 6L5 9L10 3" />
                    </svg>
                  ) : (
                    <span style={styles.stepNumber}>{index + 1}</span>
                  )}
                </div>
                <span
                  style={{
                    ...styles.stepLabel,
                    ...(isActive ? styles.stepLabelActive : {}),
                    ...(isCompleted ? styles.stepLabelCompleted : {}),
                  }}
                >
                  {step.label}
                </span>
                {index < STEPS.length - 1 && (
                  <div
                    style={{
                      ...styles.stepLine,
                      ...(isCompleted ? styles.stepLineCompleted : {}),
                    }}
                  />
                )}
              </div>
            );
          })}
        </div>
      )}
    </header>
  );
}

const styles: Record<string, React.CSSProperties> = {
  header: {
    padding: 'var(--space-4)',
    borderBottom: '1px solid var(--border-default)',
    backgroundColor: 'var(--bg-primary)',
  },
  topRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 'var(--space-4)',
  },
  backButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '36px',
    height: '36px',
    border: '1px solid var(--border-default)',
    borderRadius: 'var(--radius-md)',
    backgroundColor: 'var(--bg-primary)',
    color: 'var(--text-primary)',
    cursor: 'pointer',
    transition: 'all var(--duration-fast) var(--ease-default)',
  },
  backButtonPlaceholder: {
    width: '36px',
    height: '36px',
  },
  studioInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-3)',
  },
  logo: {
    width: '32px',
    height: '32px',
    borderRadius: 'var(--radius-md)',
    objectFit: 'cover' as const,
  },
  logoPlaceholder: {
    width: '32px',
    height: '32px',
    borderRadius: 'var(--radius-md)',
    backgroundColor: 'var(--accent-primary)',
    color: 'var(--color-white)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: 'var(--font-display)',
    fontSize: 'var(--text-lg)',
    fontWeight: 500,
  },
  studioName: {
    fontFamily: 'var(--font-display)',
    fontSize: 'var(--text-lg)',
    fontWeight: 500,
    fontStyle: 'italic',
    color: 'var(--text-primary)',
  },
  stepIndicator: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 'var(--space-1)',
  },
  stepItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-2)',
  },
  stepDot: {
    width: '24px',
    height: '24px',
    borderRadius: 'var(--radius-full)',
    border: '2px solid var(--border-default)',
    backgroundColor: 'var(--bg-primary)',
    color: 'var(--text-tertiary)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 'var(--text-xs)',
    fontWeight: 500,
    transition: 'all var(--duration-fast) var(--ease-default)',
  },
  stepDotActive: {
    borderColor: 'var(--accent-primary)',
    backgroundColor: 'var(--accent-primary)',
    color: 'var(--color-white)',
  },
  stepDotCompleted: {
    borderColor: 'var(--state-success)',
    backgroundColor: 'var(--state-success)',
    color: 'var(--color-white)',
  },
  stepNumber: {
    lineHeight: 1,
  },
  stepLabel: {
    fontFamily: 'var(--font-sans)',
    fontSize: 'var(--text-xs)',
    fontWeight: 500,
    color: 'var(--text-tertiary)',
    letterSpacing: '0.02em',
    transition: 'color var(--duration-fast) var(--ease-default)',
  },
  stepLabelActive: {
    color: 'var(--text-primary)',
  },
  stepLabelCompleted: {
    color: 'var(--text-secondary)',
  },
  stepLine: {
    width: '24px',
    height: '2px',
    backgroundColor: 'var(--border-default)',
    marginLeft: 'var(--space-2)',
    marginRight: 'var(--space-1)',
    transition: 'background-color var(--duration-fast) var(--ease-default)',
  },
  stepLineCompleted: {
    backgroundColor: 'var(--state-success)',
  },
};
