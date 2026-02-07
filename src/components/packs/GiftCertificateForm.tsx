import { useState, useCallback } from 'react';
import { Gift, Mail, Copy, Check } from 'lucide-react';
import { Modal, ModalHeader, ModalBody, ModalFooter } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import type { Pack, ClientPurchaseInsert } from '../../types/database';
import styles from '../../pages/Packs.module.css';

interface GiftCertificateFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ClientPurchaseInsert) => Promise<void>;
  pack: Pack | null;
  studioId: string;
  clientId: string;
  isLoading?: boolean;
}

interface FormData {
  recipient_email: string;
  recipient_name: string;
  gift_message: string;
}

const defaultFormData: FormData = {
  recipient_email: '',
  recipient_name: '',
  gift_message: '',
};

function generateGiftCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 12; i++) {
    if (i > 0 && i % 4 === 0) code += '-';
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export function GiftCertificateForm({
  isOpen,
  onClose,
  onSubmit,
  pack,
  studioId,
  clientId,
  isLoading,
}: GiftCertificateFormProps) {
  const [formData, setFormData] = useState<FormData>(defaultFormData);
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [giftCode, setGiftCode] = useState('');
  const [copied, setCopied] = useState(false);
  const [prevIsOpen, setPrevIsOpen] = useState(false);

  // Reset form when modal opens (React recommended pattern for prop-driven state reset)
  if (isOpen && !prevIsOpen) {
    setPrevIsOpen(true);
    setFormData(defaultFormData);
    setFormErrors({});
    setGiftCode(generateGiftCode());
    setCopied(false);
  }
  if (!isOpen && prevIsOpen) {
    setPrevIsOpen(false);
  }

  const handleChange = useCallback((field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setFormErrors((prev) => ({ ...prev, [field]: undefined }));
  }, []);

  const handleCopyCode = useCallback(() => {
    navigator.clipboard.writeText(giftCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [giftCode]);

  const validateForm = useCallback((): boolean => {
    const errors: Partial<Record<keyof FormData, string>> = {};

    if (!formData.recipient_email.trim()) {
      errors.recipient_email = 'L\'email du destinataire est requis';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.recipient_email)) {
      errors.recipient_email = 'Email invalide';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }, [formData]);

  const handleSubmit = useCallback(async () => {
    if (!validateForm() || !pack) return;

    const data: ClientPurchaseInsert = {
      studio_id: studioId,
      client_id: clientId,
      product_id: pack.id,
      status: 'active',
      purchased_at: new Date().toISOString(),
      credits_remaining: pack.credits_included || null,
      expires_at: pack.valid_days
        ? new Date(Date.now() + pack.valid_days * 24 * 60 * 60 * 1000).toISOString()
        : null,
      gift_code: giftCode,
      gift_recipient_email: formData.recipient_email,
      gift_message: formData.gift_message || null,
    };

    await onSubmit(data);
  }, [formData, pack, studioId, clientId, giftCode, validateForm, onSubmit]);

  if (!pack) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md">
      <ModalHeader
        title="Offrir un certificat cadeau"
        subtitle={pack.name}
        onClose={onClose}
      />
      <ModalBody>
        <div className={styles.giftForm}>
          {/* Gift Preview */}
          <div className={styles.giftPreview}>
            <div className={styles.giftCard}>
              <div className={styles.giftCardHeader}>
                <Gift size={24} />
                <span>Certificat Cadeau</span>
              </div>
              <div className={styles.giftCardContent}>
                <h3>{pack.name}</h3>
                <p className={styles.giftCardValue}>
                  {pack.price.toLocaleString('fr-FR')} {pack.currency}
                </p>
                {pack.credits_included && (
                  <Badge variant="info" size="sm">
                    {pack.credits_included} {pack.credits_type || 'credits'}
                  </Badge>
                )}
              </div>
              <div className={styles.giftCardCode}>
                <span className={styles.codeLabel}>Code cadeau</span>
                <div className={styles.codeValue}>
                  <code>{giftCode}</code>
                  <button
                    type="button"
                    className={styles.copyBtn}
                    onClick={handleCopyCode}
                    title="Copier le code"
                  >
                    {copied ? <Check size={16} /> : <Copy size={16} />}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Form Fields */}
          <div className={styles.giftFormFields}>
            <Input
              label="Nom du destinataire"
              value={formData.recipient_name}
              onChange={(e) => handleChange('recipient_name', e.target.value)}
              placeholder="Jean Dupont"
              fullWidth
            />

            <Input
              label="Email du destinataire *"
              type="email"
              value={formData.recipient_email}
              onChange={(e) => handleChange('recipient_email', e.target.value)}
              error={formErrors.recipient_email}
              placeholder="destinataire@email.com"
              icon={<Mail size={16} />}
              fullWidth
            />

            <div className={styles.formField}>
              <label className={styles.formLabel} htmlFor="gift-message">Message personnel</label>
              <textarea
                id="gift-message"
                className={styles.textarea}
                value={formData.gift_message}
                onChange={(e) => handleChange('gift_message', e.target.value)}
                rows={4}
                placeholder="Un message pour accompagner le cadeau..."
              />
            </div>
          </div>

          {/* Info */}
          <div className={styles.giftInfo}>
            <p>
              Un email sera envoye au destinataire avec le code cadeau et les instructions
              pour l'utiliser. Le certificat est valide{' '}
              {pack.valid_days ? `${pack.valid_days} jours` : 'sans limite de temps'}.
            </p>
          </div>
        </div>
      </ModalBody>
      <ModalFooter>
        <Button variant="secondary" onClick={onClose}>
          Annuler
        </Button>
        <Button
          variant="primary"
          onClick={handleSubmit}
          loading={isLoading}
          icon={<Gift size={16} />}
        >
          Offrir le certificat
        </Button>
      </ModalFooter>
    </Modal>
  );
}
