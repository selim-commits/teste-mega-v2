import { useRef, useEffect, useCallback } from 'react';
import { Download } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Modal, ModalHeader, ModalBody, ModalFooter } from '../../components/ui/Modal';
import type { Equipment } from '../../types/database';
import styles from '../Inventory.module.css';

interface QrCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  equipment: Equipment | null;
}

/**
 * Draws a simple QR-like pattern on a canvas based on the input data string.
 * This is a visual representation, not a scannable QR code.
 * For production use, replace with a proper QR library (e.g., qrcode).
 */
function drawQrPattern(canvas: HTMLCanvasElement, data: string) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const size = 200;
  canvas.width = size;
  canvas.height = size;

  const moduleCount = 21;
  const moduleSize = size / moduleCount;
  const padding = 2;

  // White background
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, size, size);

  // Generate a deterministic pattern from the data string
  const hash = (str: string): number[] => {
    const values: number[] = [];
    for (let i = 0; i < str.length; i++) {
      values.push(str.charCodeAt(i));
    }
    return values;
  };

  const hashValues = hash(data);

  // Draw finder patterns (the three big squares in corners)
  const drawFinderPattern = (x: number, y: number) => {
    ctx.fillStyle = '#1A1A1A';
    // Outer square
    ctx.fillRect(x * moduleSize, y * moduleSize, 7 * moduleSize, 7 * moduleSize);
    // White inner
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect((x + 1) * moduleSize, (y + 1) * moduleSize, 5 * moduleSize, 5 * moduleSize);
    // Black center
    ctx.fillStyle = '#1A1A1A';
    ctx.fillRect((x + 2) * moduleSize, (y + 2) * moduleSize, 3 * moduleSize, 3 * moduleSize);
  };

  drawFinderPattern(0, 0);
  drawFinderPattern(moduleCount - 7, 0);
  drawFinderPattern(0, moduleCount - 7);

  // Draw data modules
  ctx.fillStyle = '#1A1A1A';
  for (let row = 0; row < moduleCount; row++) {
    for (let col = 0; col < moduleCount; col++) {
      // Skip finder pattern areas
      if ((row < 8 && col < 8) || (row < 8 && col > moduleCount - 9) || (row > moduleCount - 9 && col < 8)) {
        continue;
      }
      // Use hash to determine if module is dark
      const idx = (row * moduleCount + col) % Math.max(hashValues.length, 1);
      const val = hashValues[idx] || 0;
      if ((val + row * 3 + col * 7) % 3 === 0) {
        ctx.fillRect(
          col * moduleSize + padding / 2,
          row * moduleSize + padding / 2,
          moduleSize - padding,
          moduleSize - padding
        );
      }
    }
  }
}

export function QrCodeModal({
  isOpen,
  onClose,
  equipment,
}: QrCodeModalProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const qrData = equipment?.qr_code || equipment?.name || 'N/A';

  useEffect(() => {
    if (isOpen && canvasRef.current && equipment) {
      drawQrPattern(canvasRef.current, qrData);
    }
  }, [isOpen, equipment, qrData]);

  const handleDownload = useCallback(() => {
    if (!canvasRef.current || !equipment) return;

    const dataUrl = canvasRef.current.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = `qr-${equipment.name?.replace(/\s+/g, '-').toLowerCase() || 'equipment'}.png`;
    link.href = dataUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [equipment]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="sm">
      <ModalHeader title="QR Code" onClose={onClose} />
      <ModalBody>
        <div className={styles.qrContainer}>
          <div className={styles.qrCode}>
            <canvas
              ref={canvasRef}
              style={{ width: 200, height: 200, borderRadius: 8 }}
            />
            <span className={styles.qrText}>{qrData}</span>
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
        <Button
          variant="primary"
          icon={<Download size={16} />}
          onClick={handleDownload}
        >
          Telecharger
        </Button>
      </ModalFooter>
    </Modal>
  );
}
