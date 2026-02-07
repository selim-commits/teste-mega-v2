import { useState, useCallback } from 'react';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  Clock,
  User,
  MapPin,
  Edit2,
  Trash2,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Modal, ModalHeader, ModalBody, ModalFooter } from '../../components/ui/Modal';
import type { Booking, BookingStatus } from '../../types/database';
import styles from '../SpaceControl.module.css';

// Status colors for badges
const STATUS_COLORS: Record<BookingStatus, 'default' | 'success' | 'warning' | 'error' | 'info' | 'orange'> = {
  pending: 'warning',
  confirmed: 'info',
  in_progress: 'success',
  completed: 'default',
  cancelled: 'error',
};

const STATUS_LABELS: Record<BookingStatus, string> = {
  pending: 'En attente',
  confirmed: 'Confirme',
  in_progress: 'En cours',
  completed: 'Termine',
  cancelled: 'Annule',
};

const statusOptions = [
  { value: 'pending', label: 'En attente' },
  { value: 'confirmed', label: 'Confirme' },
  { value: 'in_progress', label: 'En cours' },
  { value: 'completed', label: 'Termine' },
  { value: 'cancelled', label: 'Annule' },
];

interface SelectOption {
  value: string;
  label: string;
}

interface BookingDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: Booking | null;
  onUpdate: (data: {
    title: string;
    description: string;
    space_id: string;
    client_id: string;
    start_time: string;
    end_time: string;
    status: BookingStatus;
    notes: string;
  }) => void;
  onDelete: () => void;
  onStatusChange: (status: BookingStatus) => void;
  spaceOptions: SelectOption[];
  clientOptions: SelectOption[];
  getSpaceName: (spaceId: string) => string;
  getClientName: (clientId: string) => string;
  isUpdating: boolean;
  isDeleting: boolean;
  isStatusUpdating: boolean;
}

export function BookingDetailModal({
  isOpen,
  onClose,
  booking,
  onUpdate,
  onDelete,
  onStatusChange,
  spaceOptions,
  clientOptions,
  getSpaceName,
  getClientName,
  isUpdating,
  isDeleting,
  isStatusUpdating,
}: BookingDetailModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    space_id: '',
    client_id: '',
    start_time: '',
    end_time: '',
    status: 'pending' as BookingStatus,
    notes: '',
  });
  const [formErrors, setFormErrors] = useState<Partial<Record<string, string>>>({});

  // Sync form data when booking changes or modal opens
  const initFormData = useCallback((b: Booking) => {
    setFormData({
      title: b.title,
      description: b.description || '',
      space_id: b.space_id,
      client_id: b.client_id,
      start_time: b.start_time.slice(0, 16),
      end_time: b.end_time.slice(0, 16),
      status: b.status,
      notes: b.notes || '',
    });
  }, []);

  // When booking prop changes, reset form data
  if (booking && formData.title === '' && !isEditing) {
    initFormData(booking);
  }

  const validateForm = useCallback((): boolean => {
    const errors: Partial<Record<string, string>> = {};

    if (!formData.title.trim()) {
      errors.title = 'Le titre est requis';
    }
    if (!formData.space_id) {
      errors.space_id = "L'espace est requis";
    }
    if (!formData.client_id) {
      errors.client_id = 'Le client est requis';
    }
    if (!formData.start_time) {
      errors.start_time = "L'heure de debut est requise";
    }
    if (!formData.end_time) {
      errors.end_time = "L'heure de fin est requise";
    }
    if (formData.start_time && formData.end_time && formData.start_time >= formData.end_time) {
      errors.end_time = "L'heure de fin doit etre apres l'heure de debut";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }, [formData]);

  const handleSubmit = useCallback(() => {
    if (!validateForm()) return;
    onUpdate(formData);
    setIsEditing(false);
  }, [formData, validateForm, onUpdate]);

  const handleClose = useCallback(() => {
    setIsEditing(false);
    setFormErrors({});
    setFormData({
      title: '',
      description: '',
      space_id: '',
      client_id: '',
      start_time: '',
      end_time: '',
      status: 'pending',
      notes: '',
    });
    onClose();
  }, [onClose]);

  const handleStartEditing = useCallback(() => {
    if (booking) {
      initFormData(booking);
    }
    setIsEditing(true);
  }, [booking, initFormData]);

  const isMutating = isUpdating || isDeleting;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="md">
      <ModalHeader
        title={isEditing ? 'Modifier la reservation' : 'Details de la reservation'}
        onClose={handleClose}
      />
      <ModalBody>
        {isEditing ? (
          <div className={styles.formGrid}>
            <Input
              label="Titre"
              placeholder="Ex: Shooting photo"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              error={formErrors.title}
              fullWidth
            />
            <Select
              label="Espace"
              options={spaceOptions}
              value={formData.space_id}
              onChange={(value) => setFormData({ ...formData, space_id: value })}
              placeholder="Selectionnez un espace"
              error={formErrors.space_id}
              fullWidth
            />
            <Select
              label="Client"
              options={clientOptions}
              value={formData.client_id}
              onChange={(value) => setFormData({ ...formData, client_id: value })}
              placeholder="Selectionnez un client"
              error={formErrors.client_id}
              fullWidth
            />
            <div className={styles.formRow}>
              <Input
                label="Debut"
                type="datetime-local"
                value={formData.start_time}
                onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                error={formErrors.start_time}
                fullWidth
              />
              <Input
                label="Fin"
                type="datetime-local"
                value={formData.end_time}
                onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                error={formErrors.end_time}
                fullWidth
              />
            </div>
            <Select
              label="Statut"
              options={statusOptions}
              value={formData.status}
              onChange={(value) => setFormData({ ...formData, status: value as BookingStatus })}
              fullWidth
            />
            <Input
              label="Notes"
              placeholder="Notes internes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              fullWidth
            />
          </div>
        ) : booking && (
          <div className={styles.bookingDetails}>
            <div className={styles.detailHeader}>
              <h3>{booking.title}</h3>
              <Badge variant={STATUS_COLORS[booking.status]}>
                {STATUS_LABELS[booking.status]}
              </Badge>
            </div>

            <div className={styles.detailGrid}>
              <div className={styles.detailItem}>
                <Clock size={16} />
                <div>
                  <span className={styles.detailLabel}>Horaire</span>
                  <span className={styles.detailValue}>
                    {format(parseISO(booking.start_time), "EEEE d MMMM yyyy", { locale: fr })}
                    <br />
                    {format(parseISO(booking.start_time), 'HH:mm')} - {format(parseISO(booking.end_time), 'HH:mm')}
                  </span>
                </div>
              </div>

              <div className={styles.detailItem}>
                <MapPin size={16} />
                <div>
                  <span className={styles.detailLabel}>Espace</span>
                  <span className={styles.detailValue}>
                    {getSpaceName(booking.space_id)}
                  </span>
                </div>
              </div>

              <div className={styles.detailItem}>
                <User size={16} />
                <div>
                  <span className={styles.detailLabel}>Client</span>
                  <span className={styles.detailValue}>
                    {getClientName(booking.client_id)}
                  </span>
                </div>
              </div>
            </div>

            {booking.notes && (
              <div className={styles.detailSection}>
                <span className={styles.detailLabel}>Notes</span>
                <p>{booking.notes}</p>
              </div>
            )}

            <div className={styles.statusActions}>
              <span className={styles.detailLabel}>Changer le statut</span>
              <div className={styles.statusButtons}>
                {(['pending', 'confirmed', 'in_progress', 'completed', 'cancelled'] as BookingStatus[]).map((status) => (
                  <Button
                    key={status}
                    variant={booking.status === status ? 'primary' : 'ghost'}
                    size="sm"
                    onClick={() => onStatusChange(status)}
                    disabled={isStatusUpdating}
                  >
                    {STATUS_LABELS[status]}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        )}
      </ModalBody>
      <ModalFooter>
        {isEditing ? (
          <>
            <Button variant="ghost" onClick={() => setIsEditing(false)}>
              Annuler
            </Button>
            <Button
              variant="primary"
              onClick={handleSubmit}
              disabled={isMutating}
            >
              {isUpdating ? 'Sauvegarde...' : 'Sauvegarder'}
            </Button>
          </>
        ) : (
          <>
            <Button
              variant="ghost"
              icon={<Trash2 size={16} />}
              onClick={onDelete}
              disabled={isDeleting}
            >
              {isDeleting ? 'Suppression...' : 'Supprimer'}
            </Button>
            <Button
              variant="secondary"
              icon={<Edit2 size={16} />}
              onClick={handleStartEditing}
            >
              Modifier
            </Button>
          </>
        )}
      </ModalFooter>
    </Modal>
  );
}
