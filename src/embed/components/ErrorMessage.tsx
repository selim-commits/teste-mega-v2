// src/embed/components/ErrorMessage.tsx

interface ErrorMessageProps {
  message: string;
  onRetry?: () => void;
}

export function ErrorMessage({ message, onRetry }: ErrorMessageProps) {
  return (
    <div style={styles.container}>
      <div style={styles.iconWrapper}>
        <svg
          width="32"
          height="32"
          viewBox="0 0 32 32"
          fill="none"
          stroke="var(--state-error)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="16" cy="16" r="14" />
          <line x1="16" y1="10" x2="16" y2="18" />
          <circle cx="16" cy="23" r="1" fill="var(--state-error)" />
        </svg>
      </div>
      <h3 style={styles.title}>Une erreur est survenue</h3>
      <p style={styles.message}>{message}</p>
      {onRetry && (
        <button onClick={onRetry} style={styles.retryButton}>
          Reessayer
        </button>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 'var(--space-8)',
    textAlign: 'center',
    gap: 'var(--space-3)',
  },
  iconWrapper: {
    width: '64px',
    height: '64px',
    borderRadius: 'var(--radius-full)',
    backgroundColor: 'var(--state-error-bg)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 'var(--space-2)',
  },
  title: {
    fontFamily: 'var(--font-sans)',
    fontSize: 'var(--text-lg)',
    fontWeight: 600,
    color: 'var(--text-primary)',
    margin: 0,
  },
  message: {
    fontFamily: 'var(--font-sans)',
    fontSize: 'var(--text-sm)',
    color: 'var(--text-secondary)',
    margin: 0,
    maxWidth: '280px',
    lineHeight: 1.5,
  },
  retryButton: {
    marginTop: 'var(--space-4)',
    padding: 'var(--space-3) var(--space-6)',
    fontFamily: 'var(--font-sans)',
    fontSize: 'var(--text-sm)',
    fontWeight: 500,
    color: 'var(--color-white)',
    backgroundColor: 'var(--accent-primary)',
    border: 'none',
    borderRadius: 'var(--radius-md)',
    cursor: 'pointer',
    transition: 'background-color var(--duration-fast) var(--ease-default)',
  },
};
