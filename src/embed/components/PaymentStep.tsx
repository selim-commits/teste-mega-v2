// src/embed/components/PaymentStep.tsx
import { useEffect, useRef, useState } from 'react';
import { useEmbedStore } from '../store/embedStore';

const isValidPaymentUrl = (url: string): boolean => {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:';
  } catch {
    return false;
  }
};

export function PaymentStep() {
  const { bookingResult, goToStep, setError } = useEmbedStore();
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const hasProcessed = useRef(false);

  useEffect(() => {
    if (!bookingResult || hasProcessed.current) {
      return;
    }
    hasProcessed.current = true;

    if (bookingResult.paymentUrl) {
      if (isValidPaymentUrl(bookingResult.paymentUrl)) {
        // Redirect to validated HTTPS payment URL
        window.location.href = bookingResult.paymentUrl;
      } else {
        // Invalid or non-HTTPS payment URL
        const errorMsg = 'URL de paiement invalide ou non securisee';
        // Use microtask to avoid synchronous setState in effect
        queueMicrotask(() => {
          setPaymentError(errorMsg);
          setError(errorMsg);
        });
      }
    } else {
      // No payment required, skip to confirmation
      goToStep('confirmation');
    }
  }, [bookingResult, goToStep, setError]);

  if (paymentError) {
    return (
      <div style={styles.container}>
        <span style={{ ...styles.text, color: 'var(--state-error, #ef4444)' }}>
          {paymentError}
        </span>
      </div>
    );
  }

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
