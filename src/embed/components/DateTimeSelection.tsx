// src/embed/components/DateTimeSelection.tsx
import { useCallback, useEffect, useState } from 'react';
import { format, addDays, startOfDay } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useEmbedStore } from '../store/embedStore';
import { embedApi } from '../services/embedApi';
import { Calendar } from './Calendar';
import { TimeSlots } from './TimeSlots';
import type { TimeSlot } from '../types';

export function DateTimeSelection() {
  const {
    config,
    studio,
    selectedService,
    selectedDate,
    selectedSlot,
    availability,
    selectDate,
    selectSlot,
    setAvailability,
    goBack,
  } = useEmbedStore();

  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [slotsError, setSlotsError] = useState<string | null>(null);

  // Calculate min/max dates based on studio settings
  const today = startOfDay(new Date());
  const leadTimeHours = studio?.settings.booking_lead_time_hours ?? 0;
  const maxAdvanceDays = studio?.settings.booking_max_advance_days ?? 90;

  // Min date: today + lead time (converted to days)
  const minDate = addDays(today, Math.ceil(leadTimeHours / 24));
  // Max date: today + max advance days
  const maxDate = addDays(today, maxAdvanceDays);

  // Currently selected date as Date object
  const selectedDateObj = selectedDate ? new Date(selectedDate) : null;

  // Get slots for the selected date from cache
  const currentSlots: TimeSlot[] = selectedDate
    ? availability.get(selectedDate) ?? []
    : [];

  // Fetch availability when date changes
  const fetchAvailability = useCallback(
    async (date: string) => {
      console.log('[Rooom Debug] fetchAvailability called', {
        date,
        config: config,
        studioId: config?.studioId,
        selectedService: selectedService,
        serviceId: selectedService?.id,
      });
      if (!config?.studioId || !selectedService?.id) {
        console.log('[Rooom Debug] Missing config or service, returning', { hasConfig: !!config, hasService: !!selectedService });
        return;
      }

      // Check if already cached
      if (availability.has(date)) {
        return;
      }

      setIsLoadingSlots(true);
      setSlotsError(null);

      try {
        const response = await embedApi.getAvailability(
          config.studioId,
          selectedService.id,
          date,
          date
        );

        if (response.error) {
          setSlotsError(response.error);
          return;
        }

        if (response.data && response.data.length > 0) {
          setAvailability(date, response.data[0].slots);
        } else {
          setAvailability(date, []);
        }
      } catch (err) {
        setSlotsError('Erreur lors du chargement des créneaux');
      } finally {
        setIsLoadingSlots(false);
      }
    },
    [config?.studioId, selectedService?.id, availability, setAvailability]
  );

  // Fetch when date changes
  useEffect(() => {
    if (selectedDate) {
      fetchAvailability(selectedDate);
    }
  }, [selectedDate, fetchAvailability]);

  // Handle date selection
  const handleSelectDate = (date: Date) => {
    const dateString = format(date, 'yyyy-MM-dd');
    selectDate(dateString);
  };

  // Handle slot selection
  const handleSelectSlot = (slot: TimeSlot) => {
    selectSlot(slot);
  };

  // Format selected date for display
  const formatSelectedDate = (): string => {
    if (!selectedDateObj) return '';
    return format(selectedDateObj, 'EEEE d MMMM yyyy', { locale: fr });
  };

  return (
    <div className="rooom-datetime" style={styles.container}>
      {/* Responsive styles */}
      <style>{responsiveStyles}</style>

      {/* Header with back button and service chip */}
      <div className="rooom-datetime-header" style={styles.header}>
        <button
          type="button"
          onClick={goBack}
          style={styles.backButton}
          aria-label="Retour"
        >
          <BackIcon />
        </button>
        <h2 style={styles.heading}>Choisissez une date et un créneau</h2>
      </div>

      {/* Selected service chip */}
      {selectedService && (
        <div className="rooom-datetime-service" style={styles.serviceChip}>
          <span style={styles.serviceChipLabel}>Espace sélectionné:</span>
          <span style={styles.serviceChipName}>{selectedService.name}</span>
        </div>
      )}

      {/* Main content: Calendar and TimeSlots */}
      <div className="rooom-datetime-content" style={styles.content}>
        {/* Calendar section */}
        <div className="rooom-datetime-calendar" style={styles.calendarSection}>
          <Calendar
            selectedDate={selectedDateObj}
            onSelectDate={handleSelectDate}
            minDate={minDate}
            maxDate={maxDate}
          />
        </div>

        {/* Time slots section */}
        <div className="rooom-datetime-slots" style={styles.slotsSection}>
          {selectedDate ? (
            <>
              <div style={styles.selectedDateLabel}>
                <CalendarIcon />
                <span>{formatSelectedDate()}</span>
              </div>
              {slotsError ? (
                <div style={styles.errorContainer}>
                  <p style={styles.errorText}>{slotsError}</p>
                  <button
                    type="button"
                    onClick={() => fetchAvailability(selectedDate)}
                    style={styles.retryButton}
                  >
                    Réessayer
                  </button>
                </div>
              ) : (
                <TimeSlots
                  slots={currentSlots}
                  selectedSlot={selectedSlot}
                  onSelectSlot={handleSelectSlot}
                  isLoading={isLoadingSlots}
                />
              )}
            </>
          ) : (
            <div style={styles.noDateSelected}>
              <CalendarIcon />
              <p style={styles.noDateText}>
                Sélectionnez une date dans le calendrier
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Icons
function BackIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M12.5 15L7.5 10L12.5 5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ color: 'var(--rooom-accent-color, #3b82f6)' }}
    >
      <path
        d="M6 5V3M14 5V3M5 8H15M4 6H16C16.5523 6 17 6.44772 17 7V16C17 16.5523 16.5523 17 16 17H4C3.44772 17 3 16.5523 3 16V7C3 6.44772 3.44772 6 4 6Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// Inline styles
const styles: Record<string, React.CSSProperties> = {
  container: {
    padding: '1rem',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    marginBottom: '1rem',
  },
  backButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '36px',
    height: '36px',
    border: '1px solid var(--rooom-border-color, #e5e5e5)',
    borderRadius: '0.5rem',
    backgroundColor: 'var(--rooom-bg-card, #ffffff)',
    color: 'var(--rooom-text-primary, #1a1a1a)',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  heading: {
    fontSize: '1.25rem',
    fontWeight: 600,
    color: 'var(--rooom-text-primary, #1a1a1a)',
    margin: 0,
  },
  serviceChip: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.5rem 0.75rem',
    backgroundColor: 'var(--rooom-bg-muted, #f3f4f6)',
    borderRadius: '9999px',
    marginBottom: '1.5rem',
  },
  serviceChipLabel: {
    fontSize: '0.75rem',
    color: 'var(--rooom-text-muted, #9ca3af)',
  },
  serviceChipName: {
    fontSize: '0.875rem',
    fontWeight: 600,
    color: 'var(--rooom-accent-color, #3b82f6)',
  },
  content: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '1.5rem',
  },
  calendarSection: {
    minWidth: 0,
  },
  slotsSection: {
    minWidth: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  selectedDateLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    fontSize: '0.875rem',
    fontWeight: 500,
    color: 'var(--rooom-text-primary, #1a1a1a)',
    textTransform: 'capitalize',
  },
  noDateSelected: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '200px',
    backgroundColor: 'var(--rooom-bg-card, #ffffff)',
    borderRadius: '0.75rem',
    border: '1px solid var(--rooom-border-color, #e5e5e5)',
    padding: '2rem',
    gap: '0.75rem',
    textAlign: 'center',
  },
  noDateText: {
    fontSize: '0.875rem',
    color: 'var(--rooom-text-secondary, #6b7280)',
    margin: 0,
  },
  errorContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '150px',
    backgroundColor: 'var(--rooom-bg-card, #ffffff)',
    borderRadius: '0.75rem',
    border: '1px solid var(--rooom-border-color, #e5e5e5)',
    padding: '1.5rem',
    gap: '1rem',
    textAlign: 'center',
  },
  errorText: {
    fontSize: '0.875rem',
    color: 'var(--rooom-error-color, #ef4444)',
    margin: 0,
  },
  retryButton: {
    padding: '0.5rem 1rem',
    border: '1px solid var(--rooom-accent-color, #3b82f6)',
    borderRadius: '0.5rem',
    backgroundColor: 'transparent',
    color: 'var(--rooom-accent-color, #3b82f6)',
    fontSize: '0.875rem',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
};

// Responsive styles for mobile
const responsiveStyles = `
  @media (max-width: 640px) {
    .rooom-datetime-content {
      grid-template-columns: 1fr !important;
    }
  }
`;
