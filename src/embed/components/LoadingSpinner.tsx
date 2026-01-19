// src/embed/components/LoadingSpinner.tsx

export function LoadingSpinner() {
  return (
    <div style={styles.container}>
      <div style={styles.spinner} />
      <span style={styles.text}>Chargement...</span>
      <style>{spinnerKeyframes}</style>
    </div>
  );
}

const spinnerKeyframes = `
  @keyframes rooom-spinner {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }
`;

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 'var(--space-12)',
    gap: 'var(--space-4)',
  },
  spinner: {
    width: '40px',
    height: '40px',
    border: '3px solid var(--border-default)',
    borderTopColor: 'var(--accent-primary)',
    borderRadius: 'var(--radius-full)',
    animation: 'rooom-spinner 0.8s linear infinite',
  },
  text: {
    fontFamily: 'var(--font-sans)',
    fontSize: 'var(--text-sm)',
    color: 'var(--text-secondary)',
    letterSpacing: '0.02em',
  },
};
