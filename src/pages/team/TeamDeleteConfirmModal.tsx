import { Button } from '../../components/ui/Button';
import { Modal, ModalHeader, ModalBody, ModalFooter } from '../../components/ui/Modal';
import styles from '../Team.module.css';

interface TeamDeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isDeleting: boolean;
}

export function TeamDeleteConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  isDeleting,
}: TeamDeleteConfirmModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} size="sm">
      <ModalHeader title="Supprimer le membre" onClose={onClose} />
      <ModalBody>
        <p>Etes-vous sur de vouloir supprimer ce membre ? Cette action est irreversible.</p>
      </ModalBody>
      <ModalFooter>
        <Button variant="secondary" onClick={onClose}>
          Annuler
        </Button>
        <Button
          variant="primary"
          onClick={onConfirm}
          loading={isDeleting}
          className={styles.deleteBtn}
        >
          Supprimer
        </Button>
      </ModalFooter>
    </Modal>
  );
}
