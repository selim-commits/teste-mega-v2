import { Button } from '../../components/ui/Button';
import { Modal, ModalHeader, ModalBody, ModalFooter } from '../../components/ui/Modal';
import type { Equipment } from '../../types/database';
import styles from '../Inventory.module.css';

interface DeleteEquipmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  equipment: Equipment | null;
  isDeleting: boolean;
}

export function DeleteEquipmentModal({
  isOpen,
  onClose,
  onConfirm,
  equipment,
  isDeleting,
}: DeleteEquipmentModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} size="sm">
      <ModalHeader title="Confirmer la suppression" onClose={onClose} />
      <ModalBody>
        <p className={styles.deleteMessage}>
          \u00cates-vous s\u00fbr de vouloir supprimer <strong>{equipment?.name}</strong> ?
          Cette action est irr\u00e9versible.
        </p>
      </ModalBody>
      <ModalFooter>
        <Button variant="secondary" onClick={onClose}>
          Annuler
        </Button>
        <Button
          variant="primary"
          onClick={onConfirm}
          disabled={isDeleting}
          className={styles.deleteBtn}
        >
          {isDeleting ? 'Suppression...' : 'Supprimer'}
        </Button>
      </ModalFooter>
    </Modal>
  );
}
