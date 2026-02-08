import { useState, useCallback } from 'react';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Button } from '../../components/ui/Button';
import { Modal, ModalHeader, ModalBody, ModalFooter } from '../../components/ui/Modal';
import { useActiveSpaces } from '../../hooks/useSpaces';
import { DEMO_STUDIO_ID as STUDIO_ID } from '../../stores/authStore';
import type { EquipmentFormData } from './types';
import { defaultFormData, statusFormOptions, conditionOptions } from './types';
import styles from '../Inventory.module.css';

interface EquipmentFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: EquipmentFormData) => void;
  initialData?: EquipmentFormData | null;
  isSubmitting: boolean;
  title?: string;
  submitLabel?: string;
}

export function EquipmentFormModal({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  isSubmitting,
  title = 'Ajouter un \u00e9quipement',
  submitLabel = 'Cr\u00e9er',
}: EquipmentFormModalProps) {
  const [formData, setFormData] = useState<EquipmentFormData>(initialData || defaultFormData);
  const [formErrors, setFormErrors] = useState<Partial<EquipmentFormData>>({});

  const { data: spaces } = useActiveSpaces(STUDIO_ID);

  const handleFormChange = useCallback((field: keyof EquipmentFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setFormErrors((prev) => ({ ...prev, [field]: undefined }));
  }, []);

  const validateForm = useCallback((): boolean => {
    const errors: Partial<EquipmentFormData> = {};

    if (!formData.name.trim()) errors.name = 'Le nom est requis';
    if (!formData.category.trim()) errors.category = 'La cat\u00e9gorie est requise';
    if (formData.condition < 1 || formData.condition > 10) {
      errors.condition = 'La condition doit \u00eatre entre 1 et 10' as unknown as number;
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }, [formData]);

  const handleSubmit = useCallback(() => {
    if (!validateForm()) return;
    onSubmit(formData);
  }, [formData, validateForm, onSubmit]);

  const handleClose = useCallback(() => {
    setFormData(defaultFormData);
    setFormErrors({});
    onClose();
  }, [onClose]);

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="lg">
      <ModalHeader title={title} onClose={handleClose} />
      <ModalBody>
        <div className={styles.formGrid}>
          <Input
            label="Nom *"
            value={formData.name}
            onChange={(e) => handleFormChange('name', e.target.value)}
            error={formErrors.name}
            fullWidth
          />
          <Input
            label="Cat\u00e9gorie *"
            value={formData.category}
            onChange={(e) => handleFormChange('category', e.target.value)}
            error={formErrors.category}
            fullWidth
          />
          <Input
            label="Marque"
            value={formData.brand}
            onChange={(e) => handleFormChange('brand', e.target.value)}
            fullWidth
          />
          <Input
            label="Mod\u00e8le"
            value={formData.model}
            onChange={(e) => handleFormChange('model', e.target.value)}
            fullWidth
          />
          <Input
            label="Num\u00e9ro de s\u00e9rie"
            value={formData.serial_number}
            onChange={(e) => handleFormChange('serial_number', e.target.value)}
            fullWidth
          />
          <Select
            label="Statut"
            options={statusFormOptions}
            value={formData.status}
            onChange={(v) => handleFormChange('status', v)}
            fullWidth
          />
          <Select
            label="\u00c9tat (1-10)"
            options={conditionOptions}
            value={String(formData.condition)}
            onChange={(v) => handleFormChange('condition', v)}
            fullWidth
          />
          <Select
            label="Espace assigné"
            options={[
              { value: '', label: 'Non assigné' },
              ...(spaces || []).map((space) => ({
                value: space.id,
                label: space.name,
              })),
            ]}
            value={formData.space_id}
            onChange={(v) => handleFormChange('space_id', v)}
            fullWidth
          />
          <Input
            label="Emplacement"
            value={formData.location}
            onChange={(e) => handleFormChange('location', e.target.value)}
            fullWidth
          />
          <Input
            label="Date d'achat"
            type="date"
            value={formData.purchase_date}
            onChange={(e) => handleFormChange('purchase_date', e.target.value)}
            fullWidth
          />
          <Input
            label="Prix d'achat ($)"
            type="number"
            value={formData.purchase_price}
            onChange={(e) => handleFormChange('purchase_price', e.target.value)}
            placeholder="0.00"
            fullWidth
          />
          <Input
            label="Valeur actuelle ($)"
            type="number"
            value={formData.current_value}
            onChange={(e) => handleFormChange('current_value', e.target.value)}
            placeholder="0.00"
            fullWidth
          />
          <Input
            label="Tarif horaire ($)"
            type="number"
            value={formData.hourly_rate}
            onChange={(e) => handleFormChange('hourly_rate', e.target.value)}
            placeholder="0.00"
            fullWidth
          />
          <Input
            label="Tarif journalier ($)"
            type="number"
            value={formData.daily_rate}
            onChange={(e) => handleFormChange('daily_rate', e.target.value)}
            placeholder="0.00"
            fullWidth
          />
          <div />
          <div className={styles.fullWidth}>
            <Input
              label="Description"
              value={formData.description}
              onChange={(e) => handleFormChange('description', e.target.value)}
              fullWidth
            />
          </div>
          <div className={styles.fullWidth}>
            <Input
              label="URL de l'image"
              value={formData.image_url}
              onChange={(e) => handleFormChange('image_url', e.target.value)}
              placeholder="https://exemple.com/image.jpg"
              fullWidth
            />
          </div>
        </div>
      </ModalBody>
      <ModalFooter>
        <Button variant="secondary" onClick={handleClose}>
          Annuler
        </Button>
        <Button
          variant="primary"
          onClick={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? 'En cours...' : submitLabel}
        </Button>
      </ModalFooter>
    </Modal>
  );
}
