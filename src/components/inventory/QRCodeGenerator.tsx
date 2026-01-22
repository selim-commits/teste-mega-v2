import { useRef, useState } from 'react';
import { QRCodeSVG, QRCodeCanvas } from 'qrcode.react';
import { Download, Copy, Printer, Check, X } from 'lucide-react';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import styles from './QRCodeGenerator.module.css';

interface QRCodeGeneratorProps {
  value: string;
  title?: string;
  subtitle?: string;
  size?: number;
  isOpen: boolean;
  onClose: () => void;
}

export function QRCodeGenerator({
  value,
  title = 'QR Code',
  subtitle,
  size = 200,
  isOpen,
  onClose,
}: QRCodeGeneratorProps) {
  const [copied, setCopied] = useState(false);
  const [format, setFormat] = useState<'svg' | 'png'>('png');
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const handleDownload = () => {
    if (format === 'svg') {
      // Download as SVG
      const svgElement = document.querySelector(`.${styles.qrCode} svg`);
      if (svgElement) {
        const svgData = new XMLSerializer().serializeToString(svgElement);
        const blob = new Blob([svgData], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `qr-${title.toLowerCase().replace(/\s+/g, '-')}.svg`;
        link.click();
        URL.revokeObjectURL(url);
      }
    } else {
      // Download as PNG
      const canvas = document.querySelector(`.${styles.qrCodeCanvas} canvas`) as HTMLCanvasElement;
      if (canvas) {
        const url = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.href = url;
        link.download = `qr-${title.toLowerCase().replace(/\s+/g, '-')}.png`;
        link.click();
      }
    }
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      const canvas = document.querySelector(`.${styles.qrCodeCanvas} canvas`) as HTMLCanvasElement;
      const imgSrc = canvas ? canvas.toDataURL('image/png') : '';

      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>QR Code - ${title}</title>
            <style>
              body {
                font-family: system-ui, -apple-system, sans-serif;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                min-height: 100vh;
                margin: 0;
                padding: 20px;
              }
              .container {
                text-align: center;
                border: 2px dashed #e5e5e5;
                padding: 30px;
                border-radius: 8px;
              }
              h1 {
                font-size: 18px;
                margin: 0 0 8px;
                color: #1a1a1a;
              }
              p {
                font-size: 12px;
                color: #666;
                margin: 0 0 20px;
              }
              img {
                max-width: 200px;
              }
              .url {
                font-size: 10px;
                color: #999;
                margin-top: 16px;
                word-break: break-all;
                max-width: 250px;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <h1>${title}</h1>
              ${subtitle ? `<p>${subtitle}</p>` : ''}
              <img src="${imgSrc}" alt="QR Code" />
              <p class="url">${value}</p>
            </div>
            <script>
              window.onload = function() {
                window.print();
                window.onafterprint = function() {
                  window.close();
                };
              };
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="sm">
      <div className={styles.container}>
        <h3 className={styles.title}>{title}</h3>
        {subtitle && <p className={styles.subtitle}>{subtitle}</p>}

        <div className={styles.qrWrapper}>
          {/* SVG for display */}
          <div className={styles.qrCode}>
            <QRCodeSVG
              value={value}
              size={size}
              level="H"
              includeMargin
              bgColor="#ffffff"
              fgColor="#1a1a1a"
            />
          </div>

          {/* Hidden canvas for PNG export */}
          <div className={styles.qrCodeCanvas} style={{ display: 'none' }}>
            <QRCodeCanvas
              ref={canvasRef}
              value={value}
              size={size * 2}
              level="H"
              includeMargin
              bgColor="#ffffff"
              fgColor="#1a1a1a"
            />
          </div>
        </div>

        <div className={styles.valueContainer}>
          <code className={styles.value}>{value}</code>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCopyLink}
            icon={copied ? <Check size={14} /> : <Copy size={14} />}
          >
            {copied ? 'Copie!' : 'Copier'}
          </Button>
        </div>

        <div className={styles.formatSelector}>
          <span className={styles.formatLabel}>Format:</span>
          <div className={styles.formatButtons}>
            <button
              className={`${styles.formatButton} ${format === 'png' ? styles.active : ''}`}
              onClick={() => setFormat('png')}
            >
              PNG
            </button>
            <button
              className={`${styles.formatButton} ${format === 'svg' ? styles.active : ''}`}
              onClick={() => setFormat('svg')}
            >
              SVG
            </button>
          </div>
        </div>

        <div className={styles.actions}>
          <Button
            variant="secondary"
            onClick={handlePrint}
            icon={<Printer size={16} />}
          >
            Imprimer
          </Button>
          <Button
            variant="primary"
            onClick={handleDownload}
            icon={<Download size={16} />}
          >
            Telecharger
          </Button>
        </div>

        <div className={styles.footer}>
          <Button variant="ghost" onClick={onClose} icon={<X size={16} />}>
            Fermer
          </Button>
        </div>
      </div>
    </Modal>
  );
}

export default QRCodeGenerator;
