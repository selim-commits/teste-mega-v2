import { memo } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Modal, ModalHeader, ModalBody, ModalFooter } from '../../components/ui/Modal';
import type { Invoice } from './types';
import styles from '../Finance.module.css';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: Invoice | null;
  onConfirm: () => void;
  isDeleting: boolean;
}

export const DeleteConfirmModal = memo(function DeleteConfirmModal({
  isOpen,
  onClose,
  invoice,
  onConfirm,
  isDeleting,
}: DeleteConfirmModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} size="sm">
      <ModalHeader
        title="Confirmer la suppression"
        onClose={onClose}
      />
      <ModalBody>
        <div className={styles.deleteConfirm}>
          <AlertTriangle size={48} className={styles.deleteWarningIcon} />
          <p>
            Etes-vous sur de vouloir supprimer la facture{' '}
            <strong>{invoice?.invoice_number}</strong> ?
          </p>
          <p className={styles.deleteWarningText}>
            Cette action est irreversible.
          </p>
        </div>
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
});
