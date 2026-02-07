import { useState, useCallback } from 'react';
import { Button } from '../../components/ui/Button';
import { Select } from '../../components/ui/Select';
import { Modal, ModalHeader, ModalBody, ModalFooter } from '../../components/ui/Modal';
import type { TeamRole } from '../../types/database';
import styles from '../Team.module.css';

const roleOptionsForForm = [
  { value: 'owner', label: 'Proprietaire' },
  { value: 'admin', label: 'Administrateur' },
  { value: 'manager', label: 'Manager' },
  { value: 'staff', label: 'Staff' },
  { value: 'viewer', label: 'Lecteur' },
];

interface TeamRoleChangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (role: TeamRole) => void;
  memberName?: string;
  currentRole: TeamRole;
  isSubmitting: boolean;
}

export function TeamRoleChangeModal({
  isOpen,
  onClose,
  onSubmit,
  memberName,
  currentRole,
  isSubmitting,
}: TeamRoleChangeModalProps) {
  const [newRole, setNewRole] = useState<TeamRole>(currentRole);

  const handleSubmit = useCallback(() => {
    onSubmit(newRole);
  }, [newRole, onSubmit]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="sm">
      <ModalHeader title="Changer le role" onClose={onClose} />
      <ModalBody>
        <p className={styles.roleChangeInfo}>
          Selectionnez le nouveau role pour {memberName}
        </p>
        <Select
          label="Nouveau role"
          options={roleOptionsForForm}
          value={newRole}
          onChange={(value) => setNewRole(value as TeamRole)}
          fullWidth
        />
        <div className={styles.rolePermissions}>
          <h4>Permissions du role</h4>
          {newRole === 'owner' && (
            <p>Acces complet a toutes les fonctionnalites et parametres.</p>
          )}
          {newRole === 'admin' && (
            <p>Peut gerer l'equipe, les clients, les reservations et les parametres.</p>
          )}
          {newRole === 'manager' && (
            <p>Peut gerer les reservations, les clients et consulter les rapports.</p>
          )}
          {newRole === 'staff' && (
            <p>Peut consulter et gerer les reservations qui lui sont assignees.</p>
          )}
          {newRole === 'viewer' && (
            <p>Peut uniquement consulter les informations sans modification.</p>
          )}
        </div>
      </ModalBody>
      <ModalFooter>
        <Button variant="secondary" onClick={onClose}>
          Annuler
        </Button>
        <Button
          variant="primary"
          onClick={handleSubmit}
          loading={isSubmitting}
        >
          Changer le role
        </Button>
      </ModalFooter>
    </Modal>
  );
}
