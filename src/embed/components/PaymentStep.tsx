// src/embed/components/PaymentStep.tsx
import { useEffect } from 'react';
import { useEmbedStore } from '../store/embedStore';

export function PaymentStep() {
  const { bookingResult, goToStep } = useEmbedStore();

  useEffect(() => {
    if (!bookingResult) {
      return;
    }

    if (bookingResult.paymentUrl) {
      // Redirect to payment URL
      window.location.href = bookingResult.paymentUrl;
    } else {
      // No payment required, skip to confirmation
      goToStep('confirmation');
    }
  }, [bookingResult, goToStep]);

  return (
    <div style={styles.container}>
      <div style={styles.spinner} />
      <span style={styles.text}>Redirection vers le paiement...</span>
      <style>{spinnerKeyframes}</style>
    </div>
  );
}

const spinnerKeyframes = `
  @keyframes rooom-payment-spinner {
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
    padding: 'var(--space-12, 3rem)',
    gap: 'var(--space-4, 1rem)',
    minHeight: '200px',
  },
  spinner: {
    width: '48px',
    height: '48px',
    border: '3px solid var(--rooom-border-color, #e5e5e5)',
    borderTopColor: 'var(--rooom-accent-color, #3b82f6)',
    borderRadius: '50%',
    animation: 'rooom-payment-spinner 0.8s linear infinite',
  },
  text: {
    fontFamily: 'var(--font-sans, system-ui, sans-serif)',
    fontSize: '1rem',
    color: 'var(--rooom-text-secondary, #6b7280)',
    letterSpacing: '0.02em',
    marginTop: '0.5rem',
  },
};
