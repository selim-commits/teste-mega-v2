// src/embed/components/TimeSlots.tsx
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import type { TimeSlot } from '../types';

interface TimeSlotsProps {
  slots: TimeSlot[];
  selectedSlot: TimeSlot | null;
  onSelectSlot: (slot: TimeSlot) => void;
  isLoading: boolean;
}

export function TimeSlots({
  slots,
  selectedSlot,
  onSelectSlot,
  isLoading,
}: TimeSlotsProps) {
  const formatTime = (isoString: string): string => {
    return format(parseISO(isoString), 'HH:mm', { locale: fr });
  };

  const formatPrice = (price: number): string => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
    }).format(price);
  };

  const isSlotSelected = (slot: TimeSlot): boolean => {
    return selectedSlot?.start === slot.start && selectedSlot?.end === slot.end;
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="rooom-timeslots-loading" style={styles.container}>
        <div style={styles.loadingContent}>
          <div style={styles.spinner} />
          <span style={styles.loadingText}>Chargement des créneaux...</span>
        </div>
        <style>{spinnerKeyframes}</style>
      </div>
    );
  }

  // Empty state
  if (slots.length === 0) {
    return (
      <div className="rooom-timeslots-empty" style={styles.container}>
        <div style={styles.emptyContent}>
          <EmptyIcon />
          <p style={styles.emptyText}>Aucun créneau disponible</p>
          <p style={styles.emptySubtext}>
            Essayez de sélectionner une autre date
          </p>
        </div>
      </div>
    );
  }

  // Available slots grouped by availability
  const availableSlots = slots.filter((slot) => slot.available);
  const unavailableSlots = slots.filter((slot) => !slot.available);

  return (
    <div className="rooom-timeslots" style={styles.container}>
      <h3 style={styles.heading}>Créneaux disponibles</h3>

      {availableSlots.length === 0 ? (
        <div style={styles.noAvailableSlots}>
          <p style={styles.emptyText}>Tous les créneaux sont réservés</p>
          <p style={styles.emptySubtext}>
            Essayez une autre date
          </p>
        </div>
      ) : (
        <div className="rooom-timeslots-grid" style={styles.grid}>
          {availableSlots.map((slot) => {
            const selected = isSlotSelected(slot);
            return (
              <button
                key={`${slot.start}-${slot.end}`}
                type="button"
                onClick={() => onSelectSlot(slot)}
                style={{
                  ...styles.slotButton,
                  ...(selected ? styles.slotButtonSelected : {}),
                }}
                aria-pressed={selected || undefined}
              >
                <span style={styles.slotTime}>
                  {formatTime(slot.start)} - {formatTime(slot.end)}
                </span>
                <span
                  style={{
                    ...styles.slotPrice,
                    ...(selected ? styles.slotPriceSelected : {}),
                  }}
                >
                  {formatPrice(slot.price)}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Show unavailable slots if there are any available ones */}
      {unavailableSlots.length > 0 && availableSlots.length > 0 && (
        <div style={styles.unavailableSection}>
          <p style={styles.unavailableLabel}>Créneaux indisponibles</p>
          <div style={styles.unavailableGrid}>
            {unavailableSlots.map((slot) => (
              <div
                key={`${slot.start}-${slot.end}`}
                style={styles.unavailableSlot}
              >
                <span style={styles.unavailableTime}>
                  {formatTime(slot.start)} - {formatTime(slot.end)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Icons
function EmptyIcon() {
  return (
    <svg
      width="48"
      height="48"
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ color: 'var(--rooom-text-muted, #9ca3af)' }}
    >
      <path
        d="M16 12H32C34.2091 12 36 13.7909 36 16V36C36 38.2091 34.2091 40 32 40H16C13.7909 40 12 38.2091 12 36V16C12 13.7909 13.7909 12 16 12Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M12 20H36"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M20 8V16"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M28 8V16"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M19 28L29 28"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

const spinnerKeyframes = `
  @keyframes rooom-timeslots-spinner {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }
`;

// Inline styles
const styles: Record<string, React.CSSProperties> = {
  container: {
    backgroundColor: 'var(--rooom-bg-card, #ffffff)',
    borderRadius: '0.75rem',
    padding: '1rem',
    border: '1px solid var(--rooom-border-color, #e5e5e5)',
    minHeight: '200px',
  },
  heading: {
    fontSize: '0.875rem',
    fontWeight: 600,
    color: 'var(--rooom-text-primary, #1a1a1a)',
    margin: 0,
    marginBottom: '1rem',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
    gap: '0.5rem',
  },
  slotButton: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '0.75rem',
    border: '1px solid var(--rooom-border-color, #e5e5e5)',
    borderRadius: '0.5rem',
    backgroundColor: 'var(--rooom-bg-card, #ffffff)',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    gap: '0.25rem',
  },
  slotButtonSelected: {
    borderColor: 'var(--rooom-accent-color, #3b82f6)',
    backgroundColor: 'var(--rooom-accent-color, #3b82f6)',
    boxShadow: '0 0 0 2px var(--rooom-accent-color, #3b82f6)',
  },
  slotTime: {
    fontSize: '0.875rem',
    fontWeight: 600,
    color: 'inherit',
  },
  slotPrice: {
    fontSize: '0.75rem',
    color: 'var(--rooom-text-secondary, #6b7280)',
  },
  slotPriceSelected: {
    color: 'rgba(255, 255, 255, 0.9)',
  },
  loadingContent: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '150px',
    gap: '0.75rem',
  },
  spinner: {
    width: '32px',
    height: '32px',
    border: '3px solid var(--rooom-border-color, #e5e5e5)',
    borderTopColor: 'var(--rooom-accent-color, #3b82f6)',
    borderRadius: '50%',
    animation: 'rooom-timeslots-spinner 0.8s linear infinite',
  },
  loadingText: {
    fontSize: '0.875rem',
    color: 'var(--rooom-text-secondary, #6b7280)',
  },
  emptyContent: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '150px',
    gap: '0.5rem',
    textAlign: 'center',
  },
  emptyText: {
    fontSize: '0.875rem',
    fontWeight: 500,
    color: 'var(--rooom-text-primary, #1a1a1a)',
    margin: 0,
  },
  emptySubtext: {
    fontSize: '0.75rem',
    color: 'var(--rooom-text-muted, #9ca3af)',
    margin: 0,
  },
  noAvailableSlots: {
    textAlign: 'center',
    padding: '2rem 1rem',
  },
  unavailableSection: {
    marginTop: '1.5rem',
    paddingTop: '1rem',
    borderTop: '1px solid var(--rooom-border-color, #e5e5e5)',
  },
  unavailableLabel: {
    fontSize: '0.75rem',
    fontWeight: 500,
    color: 'var(--rooom-text-muted, #9ca3af)',
    margin: 0,
    marginBottom: '0.5rem',
  },
  unavailableGrid: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '0.5rem',
  },
  unavailableSlot: {
    padding: '0.5rem 0.75rem',
    borderRadius: '0.375rem',
    backgroundColor: 'var(--rooom-bg-muted, #f3f4f6)',
    opacity: 0.5,
  },
  unavailableTime: {
    fontSize: '0.75rem',
    color: 'var(--rooom-text-muted, #9ca3af)',
    textDecoration: 'line-through',
  },
};
