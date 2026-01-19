// src/embed/components/Confirmation.tsx
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useEmbedStore } from '../store/embedStore';

export function Confirmation() {
  const { bookingResult, studio, reset } = useEmbedStore();

  if (!bookingResult) {
    return null;
  }

  const formatCurrency = (amount: number) => {
    const currency = studio?.currency || 'EUR';
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return format(date, 'EEEE d MMMM yyyy', { locale: fr });
  };

  const formatTime = (timeString: string) => {
    // Handle both ISO datetime and time-only formats
    if (timeString.includes('T')) {
      const date = new Date(timeString);
      return format(date, 'HH:mm', { locale: fr });
    }
    return timeString;
  };

  return (
    <div style={styles.container}>
      {/* Success Icon */}
      <div style={styles.iconContainer}>
        <svg
          style={styles.checkIcon}
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M9 12.75L11.25 15L15 9.75M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      {/* Title */}
      <h2 style={styles.title}>Reservation confirmee !</h2>

      {/* Reference Number */}
      <div style={styles.referenceContainer}>
        <span style={styles.referenceLabel}>Reference</span>
        <span style={styles.referenceNumber}>{bookingResult.reference}</span>
      </div>

      {/* Summary Details */}
      <div style={styles.summaryCard}>
        <div style={styles.summaryRow}>
          <span style={styles.summaryLabel}>Espace</span>
          <span style={styles.summaryValue}>{bookingResult.service.name}</span>
        </div>
        <div style={styles.divider} />
        <div style={styles.summaryRow}>
          <span style={styles.summaryLabel}>Date</span>
          <span style={styles.summaryValue}>{formatDate(bookingResult.date)}</span>
        </div>
        <div style={styles.divider} />
        <div style={styles.summaryRow}>
          <span style={styles.summaryLabel}>Horaire</span>
          <span style={styles.summaryValue}>
            {formatTime(bookingResult.startTime)} - {formatTime(bookingResult.endTime)}
          </span>
        </div>
        <div style={styles.divider} />
        <div style={styles.summaryRow}>
          <span style={styles.summaryLabel}>Total</span>
          <span style={styles.summaryValueBold}>
            {formatCurrency(bookingResult.totalAmount)}
          </span>
        </div>
      </div>

      {/* Email Confirmation Message */}
      <p style={styles.emailMessage}>
        Un email de confirmation a ete envoye a votre adresse email.
      </p>

      {/* New Booking Button */}
      <button type="button" style={styles.newBookingButton} onClick={reset}>
        Faire une nouvelle reservation
      </button>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '2rem 1rem',
    textAlign: 'center',
  },
  iconContainer: {
    width: '80px',
    height: '80px',
    borderRadius: '50%',
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '1.5rem',
  },
  checkIcon: {
    width: '48px',
    height: '48px',
    color: '#22c55e',
  },
  title: {
    fontSize: '1.5rem',
    fontWeight: 700,
    color: 'var(--rooom-text-primary, #1a1a1a)',
    margin: '0 0 1.5rem 0',
  },
  referenceContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '0.25rem',
    marginBottom: '1.5rem',
  },
  referenceLabel: {
    fontSize: '0.875rem',
    color: 'var(--rooom-text-secondary, #6b7280)',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  referenceNumber: {
    fontSize: '1.25rem',
    fontWeight: 700,
    color: 'var(--rooom-accent-color, #3b82f6)',
    fontFamily: 'monospace',
    letterSpacing: '0.1em',
  },
  summaryCard: {
    width: '100%',
    maxWidth: '400px',
    backgroundColor: 'var(--rooom-bg-card, #ffffff)',
    border: '1px solid var(--rooom-border-color, #e5e5e5)',
    borderRadius: '0.75rem',
    padding: '1rem',
    marginBottom: '1.5rem',
  },
  summaryRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0.75rem 0',
  },
  summaryLabel: {
    fontSize: '0.875rem',
    color: 'var(--rooom-text-secondary, #6b7280)',
  },
  summaryValue: {
    fontSize: '0.875rem',
    fontWeight: 500,
    color: 'var(--rooom-text-primary, #1a1a1a)',
    textAlign: 'right',
  },
  summaryValueBold: {
    fontSize: '1rem',
    fontWeight: 700,
    color: 'var(--rooom-text-primary, #1a1a1a)',
  },
  divider: {
    height: '1px',
    backgroundColor: 'var(--rooom-border-color, #e5e5e5)',
  },
  emailMessage: {
    fontSize: '0.875rem',
    color: 'var(--rooom-text-secondary, #6b7280)',
    margin: '0 0 1.5rem 0',
    lineHeight: 1.5,
  },
  newBookingButton: {
    padding: '0.875rem 1.5rem',
    backgroundColor: 'var(--rooom-accent-color, #3b82f6)',
    color: '#ffffff',
    border: 'none',
    borderRadius: '0.5rem',
    fontSize: '1rem',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'background-color 0.2s ease',
  },
};
