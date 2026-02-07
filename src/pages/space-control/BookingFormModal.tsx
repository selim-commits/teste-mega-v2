import { useState, useCallback } from 'react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Modal, ModalHeader, ModalBody, ModalFooter } from '../../components/ui/Modal';
import type { BookingStatus } from '../../types/database';
import styles from '../SpaceControl.module.css';

export interface BookingFormData {
  title: string;
  description: string;
  space_id: string;
  client_id: string;
  start_time: string;
  end_time: string;
  status: BookingStatus;
  notes: string;
}

// eslint-disable-next-line react-refresh/only-export-components
export const initialFormData: BookingFormData = {
  title: '',
  description: '',
  space_id: '',
  client_id: '',
  start_time: '',
  end_time: '',
  status: 'pending',
  notes: '',
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

interface BookingFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: BookingFormData) => void;
  initialData?: BookingFormData;
  spaceOptions: SelectOption[];
  clientOptions: SelectOption[];
  isSubmitting: boolean;
}

export function BookingFormModal({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  spaceOptions,
  clientOptions,
  isSubmitting,
}: BookingFormModalProps) {
  const [formData, setFormData] = useState<BookingFormData>(initialData || initialFormData);
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof BookingFormData, string>>>({});

  const validateForm = useCallback((): boolean => {
    const errors: Partial<Record<keyof BookingFormData, string>> = {};

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
    onSubmit(formData);
  }, [formData, validateForm, onSubmit]);

  const handleClose = useCallback(() => {
    setFormData(initialFormData);
    setFormErrors({});
    onClose();
  }, [onClose]);

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="md">
      <ModalHeader title="Nouvelle reservation" onClose={handleClose} />
      <ModalBody>
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
      </ModalBody>
      <ModalFooter>
        <Button variant="ghost" onClick={handleClose}>
          Annuler
        </Button>
        <Button
          variant="primary"
          onClick={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Creation...' : 'Creer'}
        </Button>
      </ModalFooter>
    </Modal>
  );
}
