import { AlertTriangle, Clock, MapPin } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Modal, ModalHeader, ModalBody, ModalFooter } from './Modal';
import { Button } from './Button';
import type { ConflictResult, ConflictSeverity } from '../../lib/calendarConflicts';
import type { AlternativeSlot, ConflictMode } from '../../hooks/useDoubleBookingPrevention';
import styles from './ConflictWarningModal.module.css';

interface ConflictWarningModalProps {
  isOpen: boolean;
  onClose: () => void;
  conflicts: ConflictResult[];
  alternativeSlots: AlternativeSlot[];
  conflictMode: ConflictMode;
  onForceBooking: () => void;
  onSelectAlternative: (slot: AlternativeSlot) => void;
  getSpaceName: (spaceId: string) => string;
}

function getSeverityLabel(severity: ConflictSeverity): string {
  const labels: Record<ConflictSeverity, string> = {
    high: 'Critique',
    medium: 'Avertissement',
    low: 'Info',
  };
  return labels[severity];
}

function getConflictTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    resource_conflict: 'Conflit d\'espace',
    double_booking: 'Double reservation',
    time_overlap: 'Chevauchement',
  };
  return labels[type] || type;
}

function getHighestSeverity(conflicts: ConflictResult[]): ConflictSeverity {
  if (conflicts.some((c) => c.severity === 'high')) return 'high';
  if (conflicts.some((c) => c.severity === 'medium')) return 'medium';
  return 'low';
}

export function ConflictWarningModal({
  isOpen,
  onClose,
  conflicts,
  alternativeSlots,
  conflictMode,
  onForceBooking,
  onSelectAlternative,
  getSpaceName,
}: ConflictWarningModalProps) {
  const highestSeverity = getHighestSeverity(conflicts);
  const isBlocking = conflictMode === 'block';

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md">
      <ModalHeader
        title="Conflit de reservation detecte"
        onClose={onClose}
      >
        <div className={styles.warningHeader}>
          <div
            className={`${styles.warningIcon} ${
              highestSeverity === 'high' ? styles.warningIconHigh : ''
            }`}
          >
            <AlertTriangle size={20} />
          </div>
          <div className={styles.headerText}>
            <span className={styles.headerSubtitle}>
              {conflicts.length} conflit{conflicts.length > 1 ? 's' : ''} detecte
              {conflicts.length > 1 ? 's' : ''}
            </span>
          </div>
        </div>
      </ModalHeader>

      <ModalBody>
        {/* Conflict List */}
        <div className={styles.conflictList}>
          {conflicts.map((conflict) => {
            const severityClass =
              conflict.severity === 'high'
                ? styles.conflictItemHigh
                : conflict.severity === 'medium'
                  ? styles.conflictItemMedium
                  : styles.conflictItemLow;

            const dotClass =
              conflict.severity === 'high'
                ? styles.severityDotHigh
                : conflict.severity === 'medium'
                  ? styles.severityDotMedium
                  : styles.severityDotLow;

            return (
              <div
                key={conflict.id}
                className={`${styles.conflictItem} ${severityClass}`}
              >
                <div className={styles.severityIndicator}>
                  <div className={`${styles.severityDot} ${dotClass}`} />
                </div>
                <div className={styles.conflictDetails}>
                  <span className={styles.conflictType}>
                    {getConflictTypeLabel(conflict.type)} -{' '}
                    {getSeverityLabel(conflict.severity)}
                  </span>
                  <span className={styles.conflictMessage}>
                    {conflict.message}
                  </span>
                  <div className={styles.conflictBookings}>
                    <div className={styles.bookingInfo}>
                      <Clock size={12} />
                      <span>
                        {format(conflict.bookingB.start, 'HH:mm', { locale: fr })} -{' '}
                        {format(conflict.bookingB.end, 'HH:mm', { locale: fr })}
                      </span>
                    </div>
                    <div className={styles.bookingInfo}>
                      <MapPin size={12} />
                      <span>{getSpaceName(conflict.bookingB.spaceId)}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Alternative Slots */}
        {alternativeSlots.length > 0 && (
          <div className={styles.alternativesSection}>
            <h4 className={styles.alternativesTitle}>
              Creneaux alternatifs disponibles
            </h4>
            <div className={styles.alternativesList}>
              {alternativeSlots.map((slot) => (
                <button
                  key={slot.id}
                  className={styles.alternativeItem}
                  onClick={() => onSelectAlternative(slot)}
                  type="button"
                >
                  <div className={styles.alternativeTime}>
                    <Clock size={14} />
                    <span>{slot.label}</span>
                  </div>
                  <span className={styles.alternativeAction}>
                    Selectionner
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {alternativeSlots.length === 0 && (
          <div className={styles.alternativesSection}>
            <h4 className={styles.alternativesTitle}>
              Creneaux alternatifs
            </h4>
            <p className={styles.noAlternatives}>
              Aucun creneau alternatif disponible pour cette date
            </p>
          </div>
        )}
      </ModalBody>

      <ModalFooter>
        <div className={styles.footerActions}>
          <Button variant="ghost" onClick={onClose}>
            Annuler
          </Button>
          {!isBlocking && (
            <Button variant="danger" onClick={onForceBooking}>
              Forcer la reservation
            </Button>
          )}
        </div>
      </ModalFooter>
    </Modal>
  );
}
