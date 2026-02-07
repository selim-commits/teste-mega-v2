import { useState, useCallback } from 'react';
import {
  Mail,
  Phone,
  MapPin,
  Building,
  Tag,
  X,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Modal, ModalHeader, ModalBody, ModalFooter } from '../../components/ui/Modal';
import { Badge } from '../../components/ui/Badge';
import { Switch } from '../../components/ui/Checkbox';
import type { ClientTier } from '../../types/database';
import styles from '../Clients.module.css';

export interface ClientFormData {
  name: string;
  email: string;
  phone: string;
  company: string;
  address: string;
  city: string;
  country: string;
  postal_code: string;
  tier: ClientTier;
  notes: string;
  tags: string[];
  is_active: boolean;
}

const defaultClientFormData: ClientFormData = {
  name: '',
  email: '',
  phone: '',
  company: '',
  address: '',
  city: '',
  country: '',
  postal_code: '',
  tier: 'standard',
  notes: '',
  tags: [],
  is_active: true,
};

const tierOptions = [
  { value: 'standard', label: 'Standard' },
  { value: 'premium', label: 'Premium' },
  { value: 'vip', label: 'VIP' },
];

const commonTags = [
  'Photographe',
  'Vidéaste',
  'Entreprise',
  'Particulier',
  'Régulier',
  'Événementiel',
  'Mode',
  'Portrait',
  'Produit',
  'Immobilier',
];

interface ClientFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ClientFormData) => void;
  initialData?: ClientFormData | null;
  isSubmitting: boolean;
  title?: string;
  subtitle?: string;
  submitLabel?: string;
}

export function ClientFormModal({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  isSubmitting,
  title = 'Nouveau client',
  subtitle = 'Ajoutez un nouveau client à votre base',
  submitLabel = 'Créer le client',
}: ClientFormModalProps) {
  const [formData, setFormData] = useState<ClientFormData>(initialData || defaultClientFormData);
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof ClientFormData, string>>>({});
  const [newTag, setNewTag] = useState('');

  // No effect needed - component is conditionally rendered by parent
  // so it remounts fresh each time the modal opens

  const validateForm = useCallback((): boolean => {
    const errors: Partial<Record<keyof ClientFormData, string>> = {};

    if (!formData.name.trim()) {
      errors.name = 'Le nom est requis';
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Email invalide';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }, [formData]);

  const handleSubmit = useCallback(() => {
    if (!validateForm()) return;
    onSubmit(formData);
  }, [formData, validateForm, onSubmit]);

  const handleClose = useCallback(() => {
    setFormData(defaultClientFormData);
    setFormErrors({});
    setNewTag('');
    onClose();
  }, [onClose]);

  const handleAddTag = useCallback(() => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData((prev) => ({ ...prev, tags: [...prev.tags, newTag.trim()] }));
      setNewTag('');
    }
  }, [newTag, formData.tags]);

  const handleRemoveTag = useCallback((tag: string) => {
    setFormData((prev) => ({ ...prev, tags: prev.tags.filter((t) => t !== tag) }));
  }, []);

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="lg">
      <ModalHeader title={title} subtitle={subtitle} onClose={handleClose} />
      <ModalBody>
        <div className={styles.formGrid}>
          <Input
            label="Nom *"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            error={formErrors.name}
            fullWidth
          />
          <Input
            label="Email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            error={formErrors.email}
            icon={<Mail size={16} />}
            fullWidth
          />
          <Input
            label="Téléphone"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            icon={<Phone size={16} />}
            fullWidth
          />
          <Input
            label="Entreprise"
            value={formData.company}
            onChange={(e) => setFormData({ ...formData, company: e.target.value })}
            icon={<Building size={16} />}
            fullWidth
          />
          <Input
            label="Adresse"
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            icon={<MapPin size={16} />}
            fullWidth
          />
          <Input
            label="Ville"
            value={formData.city}
            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
            fullWidth
          />
          <Input
            label="Code postal"
            value={formData.postal_code}
            onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })}
            fullWidth
          />
          <Input
            label="Pays"
            value={formData.country}
            onChange={(e) => setFormData({ ...formData, country: e.target.value })}
            fullWidth
          />
          <Select
            label="Niveau"
            options={tierOptions}
            value={formData.tier}
            onChange={(value) => setFormData({ ...formData, tier: value as ClientTier })}
            fullWidth
          />
          <div className={styles.formFullWidth}>
            <label className={styles.formLabel}>Notes</label>
            <textarea
              className={styles.textarea}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              placeholder="Notes internes sur le client..."
            />
          </div>
          <div className={styles.formFullWidth}>
            <label className={styles.formLabel}>Tags</label>
            <div className={styles.tagsSection}>
              <div className={styles.tagsInput}>
                <Input
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddTag();
                    }
                  }}
                  placeholder="Ajouter un tag..."
                  icon={<Tag size={16} />}
                />
                <Button variant="secondary" size="sm" onClick={handleAddTag}>
                  Ajouter
                </Button>
              </div>
              <div className={styles.commonTags}>
                {commonTags.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    className={`${styles.commonTag} ${formData.tags.includes(tag) ? styles.active : ''}`}
                    onClick={() => {
                      if (formData.tags.includes(tag)) {
                        handleRemoveTag(tag);
                      } else {
                        setFormData((prev) => ({ ...prev, tags: [...prev.tags, tag] }));
                      }
                    }}
                  >
                    {tag}
                  </button>
                ))}
              </div>
              {formData.tags.length > 0 && (
                <div className={styles.selectedTags}>
                  {formData.tags.map((tag) => (
                    <Badge key={tag} variant="info" size="sm">
                      {tag}
                      <button
                        type="button"
                        className={styles.removeTag}
                        onClick={() => handleRemoveTag(tag)}
                      >
                        <X size={12} />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className={styles.formFullWidth}>
            <Switch
              label="Client actif"
              description="Les clients inactifs n'apparaissent pas dans les listes de sélection"
              checked={formData.is_active}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
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
          loading={isSubmitting}
        >
          {submitLabel}
        </Button>
      </ModalFooter>
    </Modal>
  );
}
