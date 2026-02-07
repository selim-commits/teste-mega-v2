import { QrCode } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Modal, ModalHeader, ModalBody, ModalFooter } from '../../components/ui/Modal';
import type { Equipment } from '../../types/database';
import styles from '../Inventory.module.css';

interface QrCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  equipment: Equipment | null;
}

export function QrCodeModal({
  isOpen,
  onClose,
  equipment,
}: QrCodeModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} size="sm">
      <ModalHeader title="QR Code" onClose={onClose} />
      <ModalBody>
        <div className={styles.qrContainer}>
          <div className={styles.qrCode}>
            {/* QR Code placeholder - in production, use a QR library like qrcode.react */}
            <div className={styles.qrPlaceholder}>
              <QrCode size={120} />
              <span className={styles.qrText}>{equipment?.qr_code || 'N/A'}</span>
            </div>
          </div>
          <div className={styles.qrInfo}>
            <h4>{equipment?.name}</h4>
            <p>{equipment?.brand} {equipment?.model}</p>
            <p className={styles.qrSerial}>S/N: {equipment?.serial_number || 'N/A'}</p>
          </div>
        </div>
      </ModalBody>
      <ModalFooter>
        <Button variant="secondary" onClick={onClose}>
          Fermer
        </Button>
        <Button variant="primary" icon={<QrCode size={16} />}>
          T\u00e9l\u00e9charger
        </Button>
      </ModalFooter>
    </Modal>
  );
}
