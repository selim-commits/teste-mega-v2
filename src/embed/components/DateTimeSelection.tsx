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
  } = useEmbedStore();

  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [slotsError, setSlotsError] = useState<string | null>(null);

  // Calculate min/max dates based on studio settings
  const today = startOfDay(new Date());
  const leadTimeHours = studio?.settings.booking_lead_time_hours ?? 0;
  const maxAdvanceDays = studio?.settings.booking_max_advance_days ?? 90;

  const minDate = addDays(today, Math.ceil(leadTimeHours / 24));
  const maxDate = addDays(today, maxAdvanceDays);

  const selectedDateObj = selectedDate ? new Date(selectedDate) : null;

  const currentSlots: TimeSlot[] = selectedDate
    ? availability.get(selectedDate) ?? []
    : [];

  const fetchAvailability = useCallback(
    async (date: string) => {
      if (!config?.studioId || !selectedService?.id) return;
      if (availability.has(date)) return;

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
      } catch {
        setSlotsError('Erreur lors du chargement des creneaux');
      } finally {
        setIsLoadingSlots(false);
      }
    },
    [config?.studioId, selectedService?.id, availability, setAvailability]
  );

  useEffect(() => {
    if (selectedDate) {
      fetchAvailability(selectedDate);
    }
  }, [selectedDate, fetchAvailability]);

  const handleSelectDate = (date: Date) => {
    const dateString = format(date, 'yyyy-MM-dd');
    selectDate(dateString);
  };

  const handleSelectSlot = (slot: TimeSlot) => {
    selectSlot(slot);
  };

  const formatSelectedDate = (): string => {
    if (!selectedDateObj) return '';
    return format(selectedDateObj, 'EEEE d MMMM yyyy', { locale: fr });
  };

  return (
    <div className="rooom-dt-container">
      {/* Selected service chip */}
      {selectedService && (
        <div className="rooom-dt-service-chip">
          <span className="rooom-dt-chip-label">Espace:</span>
          <span className="rooom-dt-chip-name">{selectedService.name}</span>
        </div>
      )}

      {/* Calendar section */}
      <div className="rooom-dt-section">
        <h3 className="rooom-dt-section-title">Choisissez une date</h3>
        <Calendar
          selectedDate={selectedDateObj}
          onSelectDate={handleSelectDate}
          minDate={minDate}
          maxDate={maxDate}
        />
      </div>

      {/* Time slots section */}
      <div className="rooom-dt-section">
        {selectedDate ? (
          <>
            <div className="rooom-dt-date-label">
              {formatSelectedDate()}
            </div>
            {slotsError ? (
              <div className="rooom-dt-error">
                <p className="rooom-dt-error-text">{slotsError}</p>
                <button
                  type="button"
                  onClick={() => fetchAvailability(selectedDate)}
                  className="rooom-dt-retry-btn"
                >
                  Reessayer
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
          <div className="rooom-dt-placeholder">
            <p className="rooom-dt-placeholder-text">
              Selectionnez une date dans le calendrier
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
