import { useState, useCallback } from 'react';
import {
  Mail,
  Phone,
  Briefcase,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Modal, ModalHeader, ModalBody, ModalFooter } from '../../components/ui/Modal';
import { Switch } from '../../components/ui/Checkbox';
import type { TeamRole } from '../../types/database';
import styles from '../Team.module.css';

export interface TeamMemberFormData {
  name: string;
  email: string;
  phone: string;
  job_title: string;
  role: TeamRole;
  hourly_rate: string;
  is_active: boolean;
}

// eslint-disable-next-line react-refresh/only-export-components
export const defaultFormData: TeamMemberFormData = {
  name: '',
  email: '',
  phone: '',
  job_title: '',
  role: 'staff',
  hourly_rate: '',
  is_active: true,
};

const roleOptionsForForm = [
  { value: 'owner', label: 'Proprietaire' },
  { value: 'admin', label: 'Administrateur' },
  { value: 'manager', label: 'Manager' },
  { value: 'staff', label: 'Staff' },
  { value: 'viewer', label: 'Lecteur' },
];

interface TeamMemberFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: TeamMemberFormData) => void;
  initialData?: TeamMemberFormData | null;
  isSubmitting: boolean;
  title?: string;
  subtitle?: string;
  submitLabel?: string;
}

export function TeamMemberFormModal({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  isSubmitting,
  title = 'Inviter un membre',
  subtitle = 'Ajoutez un nouveau membre a votre equipe',
  submitLabel = 'Inviter',
}: TeamMemberFormModalProps) {
  const [formData, setFormData] = useState<TeamMemberFormData>(initialData || defaultFormData);
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof TeamMemberFormData, string>>>({});

  const validateForm = useCallback((): boolean => {
    const errors: Partial<Record<keyof TeamMemberFormData, string>> = {};

    if (!formData.name.trim()) {
      errors.name = 'Le nom est requis';
    }

    if (!formData.email.trim()) {
      errors.email = "L'email est requis";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
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
    setFormData(defaultFormData);
    setFormErrors({});
    onClose();
  }, [onClose]);

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
            label="Email *"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            error={formErrors.email}
            icon={<Mail size={16} />}
            fullWidth
          />
          <Input
            label="Telephone"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            icon={<Phone size={16} />}
            fullWidth
          />
          <Input
            label="Poste"
            value={formData.job_title}
            onChange={(e) => setFormData({ ...formData, job_title: e.target.value })}
            icon={<Briefcase size={16} />}
            fullWidth
          />
          <Select
            label="Role"
            options={roleOptionsForForm}
            value={formData.role}
            onChange={(value) => setFormData({ ...formData, role: value as TeamRole })}
            fullWidth
          />
          <Input
            label="Taux horaire (EUR)"
            type="number"
            value={formData.hourly_rate}
            onChange={(e) => setFormData({ ...formData, hourly_rate: e.target.value })}
            fullWidth
          />
          <div className={styles.formFullWidth}>
            <Switch
              label="Membre actif"
              description="Les membres inactifs ne peuvent pas se connecter"
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
