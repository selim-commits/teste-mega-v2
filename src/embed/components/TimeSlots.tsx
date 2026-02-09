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
      <div className="rooom-slots-container">
        <div className="rooom-slots-loading">
          <div className="rooom-slots-spinner" />
          <span className="rooom-slots-loading-text">Chargement des creneaux...</span>
        </div>
      </div>
    );
  }

  // Empty state
  if (slots.length === 0) {
    return (
      <div className="rooom-slots-container">
        <div className="rooom-slots-empty">
          <p className="rooom-slots-empty-text">Aucun creneau disponible</p>
          <p className="rooom-slots-empty-sub">Essayez de selectionner une autre date</p>
        </div>
      </div>
    );
  }

  const availableSlots = slots.filter((slot) => slot.available);
  const unavailableSlots = slots.filter((slot) => !slot.available);

  return (
    <div className="rooom-slots-container">
      <h3 className="rooom-slots-heading">Horaires disponibles</h3>

      {availableSlots.length === 0 ? (
        <div className="rooom-slots-empty">
          <p className="rooom-slots-empty-text">Tous les creneaux sont reserves</p>
          <p className="rooom-slots-empty-sub">Essayez une autre date</p>
        </div>
      ) : (
        <div className="rooom-slots-list">
          {availableSlots.map((slot) => {
            const selected = isSlotSelected(slot);
            return (
              <button
                key={`${slot.start}-${slot.end}`}
                type="button"
                onClick={() => onSelectSlot(slot)}
                className={`rooom-slot-row ${selected ? 'rooom-slot-row-selected' : ''}`}
                aria-pressed={selected || undefined}
              >
                <span className="rooom-slot-time">
                  {formatTime(slot.start)} - {formatTime(slot.end)}
                </span>
                <span className={`rooom-slot-price ${selected ? 'rooom-slot-price-selected' : ''}`}>
                  {formatPrice(slot.price)}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Unavailable slots */}
      {unavailableSlots.length > 0 && availableSlots.length > 0 && (
        <div className="rooom-slots-unavailable">
          <p className="rooom-slots-unavailable-label">Creneaux indisponibles</p>
          {unavailableSlots.map((slot) => (
            <div
              key={`${slot.start}-${slot.end}`}
              className="rooom-slot-row-unavailable"
            >
              <span className="rooom-slot-time-unavailable">
                {formatTime(slot.start)} - {formatTime(slot.end)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
